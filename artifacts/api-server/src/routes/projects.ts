import { Router, type IRouter } from "express";
import { desc, eq, sql, and, ilike } from "drizzle-orm";
import { db, projectsTable, usersTable, contactUnlocksTable, subscriptionsTable, subscriptionPlansTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  CreateProjectBody,
  UpdateProjectBody,
  UpdateProjectParams,
  GetProjectParams,
  DeleteProjectParams,
  ListProjectsResponse,
  GetProjectResponse,
  UpdateProjectResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { sendNewProjectNotification, sendProjectConfirmationToClient, sendProjectPublishedNotification, sendProjectRejectedNotification, sendPremiumProjectNotification } from "../lib/email";
import { createNotification, getUserEmail } from "../lib/notify";
import { isAuthenticated, isAdminSession, canViewProjectContacts, getLocalUserId, getUnlockStats, getProviderPlanSlug, getUnlockedProjectIds, PRO_UNLOCK_LIMIT } from "../lib/planGating";
import { requireProvider } from "../middlewares/requireProvider";

const router: IRouter = Router();

function redactContact<T extends { fullName: string; email: string; phone: string }>(project: T): T {
  return { ...project, fullName: "", email: "", phone: "" };
}

type OwnerInfo = {
  ownerFullName: string | null;
  ownerCompanyName: string | null;
  ownerAvatarUrl: string | null;
  ownerSubtype: string | null;
};

// Poster identity (name + avatar + type) is only exposed to authenticated
// users — for public/unauthenticated requests the poster fields are blanked
// (alongside the contact details handled by redactContact). For projects with
// a linked account, prefer the account's company name / full name; legacy
// projects fall back to the project's own name.
function withPoster<P extends { fullName: string }>(project: P, owner: OwnerInfo, includePoster: boolean) {
  if (!includePoster) {
    return { ...project, posterName: "", posterAvatarUrl: null as string | null, posterType: null as string | null };
  }
  const isCompany = owner.ownerSubtype === "company";
  const posterName = (isCompany ? owner.ownerCompanyName : null) ?? owner.ownerFullName ?? project.fullName ?? "";
  return {
    ...project,
    posterName,
    posterAvatarUrl: owner.ownerAvatarUrl ?? null,
    posterType: owner.ownerSubtype ?? null,
  };
}

const ownerSelect = {
  ownerFullName: usersTable.fullName,
  ownerCompanyName: usersTable.companyName,
  ownerAvatarUrl: usersTable.avatarUrl,
  ownerSubtype: usersTable.accountSubtype,
};

router.get("/projects", async (req, res): Promise<void> => {
  const { city, type, status } = req.query;
  const conditions = [];
  if (typeof city === "string" && city.trim()) {
    conditions.push(ilike(projectsTable.city, `%${city.trim()}%`));
  }
  if (typeof type === "string" && type.trim()) {
    conditions.push(eq(projectsTable.projectType, type.trim()));
  }
  if (typeof status === "string" && status.trim()) {
    conditions.push(eq(projectsTable.status, status.trim()));
  }
  const rows = await db
    .select({ project: projectsTable, ...ownerSelect })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.ownerUserId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${projectsTable.createdAt} desc`);
  const authed = isAuthenticated(req);
  const projectsList = rows.map(r => withPoster(r.project, r, authed));
  let payload: typeof projectsList;
  if (isAdminSession(req)) {
    payload = projectsList;
  } else {
    const userId = await getLocalUserId(req);
    const planSlug = userId ? await getProviderPlanSlug(userId) : "free";
    if (planSlug === "premium") {
      payload = projectsList;
    } else if (planSlug === "pro" && userId) {
      const unlockedIds = await getUnlockedProjectIds(userId);
      payload = projectsList.map(p => (unlockedIds.has(p.id) ? p : redactContact(p)));
    } else {
      payload = projectsList.map(redactContact);
    }
  }
  res.json(ListProjectsResponse.parse(payload));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid project body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rawBody = req.body as Record<string, unknown>;
  const size = typeof rawBody.size === "string" && ["small", "medium", "large", "premium"].includes(rawBody.size)
    ? (rawBody.size as string)
    : "medium";

  // Optionally link project to the authenticated user (guests may submit without signing in)
  let ownerUserId: number | null = null;
  const clerkAuth = getAuth(req);
  if (clerkAuth?.userId) {
    const [dbUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkAuth.userId))
      .limit(1);
    ownerUserId = dbUser?.id ?? null;
  }

  const [project] = await db.insert(projectsTable).values({
    ownerUserId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    title: parsed.data.title?.trim() || null,
    projectType: parsed.data.projectType,
    subcategory: parsed.data.subcategory ?? null,
    subcategoryOtherText: parsed.data.subcategoryOtherText
      ? parsed.data.subcategoryOtherText.trim().replace(/\s+/g, " ").slice(0, 40) || null
      : null,
    description: parsed.data.description,
    city: parsed.data.city,
    budget: parsed.data.budget ?? null,
    timeline: parsed.data.timeline ?? null,
    photos: (parsed.data as Record<string, unknown>).photos as string[] ?? [],
    size,
    status: "pending",
  }).returning();

  void sendNewProjectNotification({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    projectType: parsed.data.projectType,
    description: parsed.data.description,
    city: parsed.data.city,
    budget: parsed.data.budget ?? null,
    timeline: parsed.data.timeline ?? null,
  });

  void sendProjectConfirmationToClient({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    projectType: parsed.data.projectType,
    city: parsed.data.city,
    budget: parsed.data.budget ?? null,
    timeline: parsed.data.timeline ?? null,
  });

  // Immediately notify Premium-plan providers about the new project request
  void (async () => {
    try {
      const premiumUsers = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(subscriptionsTable)
        .innerJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
        .innerJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
        .where(and(eq(subscriptionsTable.status, "active"), eq(subscriptionPlansTable.slug, "premium")));
      for (const u of premiumUsers) {
        if (!u.email) continue;
        await sendPremiumProjectNotification({
          recipientEmail: u.email,
          recipientName: u.fullName ?? "Provider",
          projectType: project.projectType,
          city: project.city,
          projectId: project.id,
        });
      }
    } catch (notifyErr) {
      req.log.warn({ notifyErr }, "Failed to send premium new-project notifications");
    }
  })();

  res.status(201).json(GetProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ project: projectsTable, ...ownerSelect })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.ownerUserId, usersTable.id))
    .where(eq(projectsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const authed = isAuthenticated(req);
  const canContact = await canViewProjectContacts(req, params.data.id);
  const project = withPoster(row.project, row, authed);
  const payload = canContact ? project : redactContact(project);
  res.json(GetProjectResponse.parse(payload));
});

// POST /projects/:id/unlock — Professional providers unlock a project's contact details
router.post("/projects/:id/unlock", requireProvider, async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.userId!;

  const [row] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const slug = await getProviderPlanSlug(userId);
  if (!["basic", "pro", "professional", "starter", "premium"].includes(slug)) {
    res.status(403).json({ error: "A paid plan is required to unlock contacts" });
    return;
  }

  if (slug !== "premium") {
    // Check if already unlocked first (doesn't count against limit)
    const [existing] = await db
      .select({ id: contactUnlocksTable.id })
      .from(contactUnlocksTable)
      .where(and(eq(contactUnlocksTable.providerUserId, userId), eq(contactUnlocksTable.projectId, params.data.id)))
      .limit(1);

    if (!existing) {
      // Determine period start from active subscription, fall back to calendar month
      const [sub] = await db
        .select({ currentPeriodStart: subscriptionsTable.currentPeriodStart })
        .from(subscriptionsTable)
        .innerJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
        .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
        .orderBy(desc(subscriptionsTable.id))
        .limit(1);

      const periodStart = sub?.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const stats = await getUnlockStats(userId, periodStart);

      if (!stats.canUnlock) {
        res.status(403).json({
          error: `Monthly contact unlock limit reached (${PRO_UNLOCK_LIMIT}/month). Upgrade to Premium for unlimited unlocks.`,
          limitReached: true,
          used: stats.used,
          limit: stats.limit,
        });
        return;
      }
    }
  }

  // Insert unlock row — unique constraint makes this idempotent
  await db
    .insert(contactUnlocksTable)
    .values({ providerUserId: userId, projectId: params.data.id })
    .onConflictDoNothing();

  res.json({ phone: row.phone, email: row.email, fullName: row.fullName });
});

// GET /projects/:id/unlocked-by — project owner sees which providers unlocked their contact
// Premium providers are revealed by name; Pro providers appear anonymous.
router.get("/projects/:id/unlocked-by", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const localUserId = await getLocalUserId(req);
  if (!localUserId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [project] = await db
    .select({ id: projectsTable.id, ownerUserId: projectsTable.ownerUserId })
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (project.ownerUserId !== localUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const unlocks = await db
    .select({
      unlockedAt: contactUnlocksTable.unlockedAt,
      fullName: usersTable.fullName,
      companyName: usersTable.companyName,
      accountSubtype: usersTable.accountSubtype,
      planSlug: subscriptionPlansTable.slug,
    })
    .from(contactUnlocksTable)
    .innerJoin(usersTable, eq(contactUnlocksTable.providerUserId, usersTable.id))
    .leftJoin(
      subscriptionsTable,
      and(
        eq(subscriptionsTable.userId, contactUnlocksTable.providerUserId),
        eq(subscriptionsTable.status, "active"),
      ),
    )
    .leftJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
    .where(eq(contactUnlocksTable.projectId, params.data.id))
    .orderBy(desc(contactUnlocksTable.unlockedAt));

  const providers = unlocks.map(u => {
    const isPremium = u.planSlug === "premium";
    const displayName = u.accountSubtype === "company" ? (u.companyName ?? u.fullName) : u.fullName;
    return {
      isRevealed: isPremium,
      name: isPremium ? displayName : null,
      planSlug: u.planSlug ?? "pro",
      unlockedAt: u.unlockedAt,
    };
  });

  res.json({ total: providers.length, providers });
});

router.patch("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, string | null> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  if (parsed.data.title != null) updateData.title = parsed.data.title.trim() || null;

  const [project] = await db
    .update(projectsTable)
    .set(updateData)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Notify client when admin changes project status
  if (parsed.data.status) {
    void (async () => {
      try {
        const newStatus = parsed.data.status!;
        const isPublished = newStatus === "open";
        const isRejected = newStatus === "cancelled" || newStatus === "archived";
        // Owner notifications — only when the project has a linked account
        if (project.ownerUserId) {
          const clientUser = await getUserEmail(project.ownerUserId);
          if (clientUser) {
            if (isPublished) {
              await createNotification({
                recipientUserId: project.ownerUserId,
                type: "project_published",
                title: "Ihr Projekt wurde freigeschaltet",
                message: `Ihr Projekt (${project.projectType} in ${project.city}) ist jetzt aktiv. Dienstleister können nun Angebote einreichen.`,
                relatedProjectId: project.id,
              });
              await sendProjectPublishedNotification({
                clientEmail: clientUser.email,
                clientName: clientUser.fullName,
                projectType: project.projectType,
                city: project.city,
                projectId: project.id,
                language: clientUser.language,
              });
            } else if (isRejected) {
              await createNotification({
                recipientUserId: project.ownerUserId,
                type: "project_rejected",
                title: "Projektanfrage abgelehnt",
                message: `Ihr Projekt (${project.projectType} in ${project.city}) konnte leider nicht veröffentlicht werden.`,
                relatedProjectId: project.id,
              });
              await sendProjectRejectedNotification({
                clientEmail: clientUser.email,
                clientName: clientUser.fullName,
                projectType: project.projectType,
                city: project.city,
                language: clientUser.language,
              });
            }
          }
        }
        // Premium priority notifications fire on any publish, regardless of whether the
        // project poster has a linked account.
        if (isPublished) {
          void (async () => {
            try {
              const premiumUsers = await db
                .select({ email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
                .from(subscriptionsTable)
                .innerJoin(subscriptionPlansTable, eq(subscriptionsTable.planId, subscriptionPlansTable.id))
                .innerJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
                .where(and(eq(subscriptionsTable.status, "active"), eq(subscriptionPlansTable.slug, "premium")));

              for (const u of premiumUsers) {
                if (!u.email) continue;
                await sendPremiumProjectNotification({
                  recipientEmail: u.email,
                  recipientName: u.fullName ?? "Provider",
                  language: u.language,
                  projectType: project.projectType,
                  city: project.city,
                  projectId: project.id,
                });
              }
            } catch (notifyErr) {
              req.log.error({ notifyErr }, "Failed to send premium project notifications");
            }
          })();
        }
      } catch (err) {
        req.log.error({ err }, "Failed to send project status notification");
      }
    })();
  }

  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

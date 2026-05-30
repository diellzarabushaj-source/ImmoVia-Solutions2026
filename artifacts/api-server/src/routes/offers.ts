import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, offersTable, projectsTable, usersTable, subscriptionsTable, subscriptionPlansTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireProvider } from "../middlewares/requireProvider";
import {
  PROJECT_SIZE_OFFER_CAP,
  offerCost,
  spendCredits,
  getBalance,
  rollSubscriptionCycle,
} from "../lib/credits";
import { sendNewOfferNotification, sendOfferAcceptedNotification } from "../lib/email";
import { createNotification } from "../lib/notify";

const router: IRouter = Router();

router.get("/projects/:id/offers", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  // Client owners or providers can list offers. Provider sees their own. Client sees all on their project.
  let where;
  if (user?.accountType === "service_provider") {
    where = and(eq(offersTable.projectId, projectId), eq(offersTable.providerUserId, userId));
  } else if (user?.accountType === "project_poster" && project.ownerUserId === userId) {
    where = eq(offersTable.projectId, projectId);
  } else if (user?.role === "admin") {
    where = eq(offersTable.projectId, projectId);
  } else {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const offers = await db
    .select({
      id: offersTable.id,
      projectId: offersTable.projectId,
      providerUserId: offersTable.providerUserId,
      type: offersTable.type,
      creditsSpent: offersTable.creditsSpent,
      message: offersTable.message,
      priceEstimate: offersTable.priceEstimate,
      status: offersTable.status,
      createdAt: offersTable.createdAt,
      providerName: usersTable.fullName,
      providerCompany: usersTable.companyName,
      providerCity: usersTable.city,
    })
    .from(offersTable)
    .leftJoin(usersTable, eq(offersTable.providerUserId, usersTable.id))
    .where(where)
    .orderBy(desc(offersTable.id));
  res.json(offers);
});

router.post("/projects/:id/offers", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const projectId = Number(req.params.id);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const type =
    typeof body.type === "string" && ["normal", "highlighted", "top"].includes(body.type)
      ? (body.type as "normal" | "highlighted" | "top")
      : "normal";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const priceEstimate = typeof body.priceEstimate === "string" ? body.priceEstimate.trim() : null;
  if (message.length < 5) {
    res.status(400).json({ error: "Message too short" });
    return;
  }

  await rollSubscriptionCycle(userId);

  // Monthly application limit check
  const PLAN_APP_LIMITS: Record<string, number> = {
    free: 2, starter: 10, professional: 30, premium: 100, founding: 10,
  };
  const [activeSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);
  const [activePlan] = activeSub
    ? await db.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, activeSub.planId))
    : [null];
  const planSlug = activePlan?.slug ?? "free";
  const appLimit = PLAN_APP_LIMITS[planSlug] ?? 2;
  const periodStart = activeSub?.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [{ monthlyUsed }] = await db
    .select({ monthlyUsed: sql<number>`count(*)::int` })
    .from(offersTable)
    .where(and(eq(offersTable.providerUserId, userId), gte(offersTable.createdAt, periodStart)));
  if ((monthlyUsed ?? 0) >= appLimit) {
    res.status(429).json({
      error: "Monatliches Bewerbungslimit erreicht. Upgraden Sie Ihren Plan.",
      code: "APP_LIMIT_REACHED",
    });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const cost = offerCost(project.size, type);
  const balance = await getBalance(userId);
  if (balance.total < cost) {
    res
      .status(402)
      .json({ error: "Insufficient credits", required: cost, available: balance.total });
    return;
  }

  // Caps: ≤3 highlighted, ≤1 top, total capped by size.
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      highlighted: sql<number>`count(*) filter (where ${offersTable.type} = 'highlighted')::int`,
      top: sql<number>`count(*) filter (where ${offersTable.type} = 'top')::int`,
    })
    .from(offersTable)
    .where(eq(offersTable.projectId, projectId));
  const cap = PROJECT_SIZE_OFFER_CAP[project.size] ?? 8;
  if ((counts?.total ?? 0) >= cap) {
    res.status(409).json({ error: "Project offer cap reached" });
    return;
  }
  if (type === "highlighted" && (counts?.highlighted ?? 0) >= 3) {
    res.status(409).json({ error: "Highlighted cap reached for this project" });
    return;
  }
  if (type === "top" && (counts?.top ?? 0) >= 1) {
    res.status(409).json({ error: "Top cap reached for this project" });
    return;
  }

  // Already sent?
  const [existing] = await db
    .select()
    .from(offersTable)
    .where(and(eq(offersTable.projectId, projectId), eq(offersTable.providerUserId, userId)))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "You have already sent an offer for this project" });
    return;
  }

  const [offer] = await db
    .insert(offersTable)
    .values({
      projectId,
      providerUserId: userId,
      type,
      creditsSpent: cost,
      message,
      priceEstimate,
      status: "sent",
    })
    .returning();
  if (!offer) {
    res.status(500).json({ error: "Failed to create offer" });
    return;
  }
  await spendCredits({
    userId,
    amount: cost,
    offerId: offer.id,
    projectId,
    note: `Offer ${type} on project #${projectId}`,
  });
  const balanceAfter = await getBalance(userId);

  // Notify client about the new offer (fire-and-forget)
  void (async () => {
    try {
      const [clientUser] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
        .from(usersTable)
        .where(eq(usersTable.id, project.ownerUserId!))
        .limit(1);
      const [providerUser] = await db
        .select({ fullName: usersTable.fullName, companyName: usersTable.companyName })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (clientUser && providerUser) {
        const senderLabel = providerUser.companyName ?? providerUser.fullName;
        await createNotification({
          recipientUserId: project.ownerUserId!,
          type: "offer_received",
          title: `Neues Angebot erhalten — ${senderLabel}`,
          message: `${senderLabel} hat ein Angebot für Ihr Projekt (${project.projectType} in ${project.city}) eingereicht.`,
          relatedProjectId: projectId,
        });
        await sendNewOfferNotification({
          clientEmail: clientUser.email,
          clientName: clientUser.fullName,
          providerName: providerUser.fullName,
          providerCompany: providerUser.companyName,
          projectType: project.projectType,
          city: project.city,
          message,
          priceEstimate,
          projectId,
          language: clientUser.language,
        });
      }
    } catch (err) {
      req.log.error({ err }, "Failed to send new offer notification");
    }
  })();

  res.status(201).json({ offer, cost, balanceAfter });
});

router.post("/offers/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const offerId = Number(req.params.id);
  if (!Number.isFinite(offerId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = req.userId!;
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, offerId));
  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, offer.projectId));
  if (!project || project.ownerUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.update(offersTable).set({ status: "accepted" }).where(eq(offersTable.id, offerId));
  await db
    .update(projectsTable)
    .set({ status: "matched" })
    .where(eq(projectsTable.id, project.id));

  // Notify provider that their offer was accepted (fire-and-forget)
  void (async () => {
    try {
      const [providerUser] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
        .from(usersTable)
        .where(eq(usersTable.id, offer.providerUserId))
        .limit(1);
      const [clientUser] = await db
        .select({ fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (providerUser && clientUser) {
        await createNotification({
          recipientUserId: offer.providerUserId,
          type: "offer_accepted",
          title: "Ihr Angebot wurde angenommen",
          message: `${clientUser.fullName} hat Ihr Angebot für das Projekt (${project.projectType} in ${project.city}) angenommen.`,
          relatedProjectId: project.id,
        });
        await sendOfferAcceptedNotification({
          providerEmail: providerUser.email,
          providerName: providerUser.fullName,
          clientName: clientUser.fullName,
          projectType: project.projectType,
          city: project.city,
          offerId,
          language: providerUser.language,
        });
      }
    } catch (err) {
      req.log.error({ err }, "Failed to send offer accepted notification");
    }
  })();

  res.json({ ok: true });
});

// Client: list own projects with offer counts
router.get("/me/projects", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.ownerUserId, userId))
    .orderBy(desc(projectsTable.id));
  res.json(rows);
});

// Provider: browse open projects
router.get("/provider/projects", requireProvider, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.status, "pending"))
    .orderBy(desc(projectsTable.id))
    .limit(100);
  res.json(rows);
});

// Provider: my offers
router.get("/provider/offers", requireProvider, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db
    .select({
      id: offersTable.id,
      projectId: offersTable.projectId,
      type: offersTable.type,
      creditsSpent: offersTable.creditsSpent,
      message: offersTable.message,
      priceEstimate: offersTable.priceEstimate,
      status: offersTable.status,
      createdAt: offersTable.createdAt,
      projectFullName: projectsTable.fullName,
      projectCity: projectsTable.city,
      projectType: projectsTable.projectType,
      projectSize: projectsTable.size,
    })
    .from(offersTable)
    .leftJoin(projectsTable, eq(offersTable.projectId, projectsTable.id))
    .where(eq(offersTable.providerUserId, userId))
    .orderBy(desc(offersTable.id));
  res.json(rows);
});

export default router;

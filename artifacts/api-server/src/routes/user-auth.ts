import { Router, type IRouter } from "express";
import { getAuth, clerkClient as clerk } from "@clerk/express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  toPublicUser,
  subscriptionPlansTable,
  subscriptionsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { generateUniqueSlug } from "../lib/slug";
import { grantMonthlyCredits } from "../lib/credits";

const router: IRouter = Router();

const VALID_ROLES = ["client", "service_provider"] as const;
const VALID_PROVIDER_TYPES = ["individual", "small_team", "company"] as const;

const ADMIN_EMAILS = new Set(["immovia.rd@gmail.com"]);

function normalizeRole(v: unknown): "client" | "service_provider" | null {
  if (typeof v !== "string") return null;
  if (v === "homeowner" || v === "client") return "client";
  if (v === "contractor" || v === "service_provider") return "service_provider";
  return null;
}

// ── GET /auth/me ─────────────────────────────────────────────────────────────
// Returns the DB user linked to the current Clerk session.
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId!;

  // Look up by clerk user id
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found. Please complete sign-up." });
    return;
  }

  res.json({ user: toPublicUser(user) });
});

// ── POST /auth/sync ──────────────────────────────────────────────────────────
// Called after Clerk sign-up/sign-in to JIT-provision the DB user.
// If a DB user already exists for this Clerk ID, returns it.
// If a DB user exists with the same email, links it to the Clerk ID.
// Otherwise creates a new DB user.
// NOTE: intentionally does NOT use requireAuth (which demands a DB row),
// because this is the route that creates/links the DB row for the first time.
router.post("/auth/sync", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const clerkUserId = auth.userId;

  // Fetch Clerk user info to get email + name
  let clerkEmail = "";
  let clerkFullName = "User";
  let clerkAvatarUrl: string | null = null;
  try {
    const clerkUser = await clerk.users.getUser(clerkUserId);
    clerkEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    clerkFullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";
    clerkAvatarUrl = clerkUser.imageUrl || null;
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Clerk user");
    res.status(500).json({ error: "Failed to fetch user data" });
    return;
  }

  // 1. Check if DB user already linked to this Clerk ID
  let [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (existingUser) {
    // Ensure admin emails always have admin role even if record predates this check
    if (ADMIN_EMAILS.has(existingUser.email) && existingUser.role !== "admin") {
      const [upgraded] = await db
        .update(usersTable)
        .set({ role: "admin" })
        .where(eq(usersTable.id, existingUser.id))
        .returning();
      existingUser = upgraded!;
    }
    res.json({ user: toPublicUser(existingUser) });
    return;
  }

  // 2. Check if DB user exists with same email (existing account migration)
  if (clerkEmail) {
    const [emailUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, clerkEmail))
      .limit(1);
    if (emailUser) {
      // Link the existing DB user to this Clerk ID
      const shouldBeAdmin = ADMIN_EMAILS.has(emailUser.email);
      const [linked] = await db
        .update(usersTable)
        .set({
          clerkUserId,
          avatarUrl: emailUser.avatarUrl ?? clerkAvatarUrl,
          ...(shouldBeAdmin && emailUser.role !== "admin" ? { role: "admin" as const } : {}),
        })
        .where(eq(usersTable.id, emailUser.id))
        .returning();
      // Persist role to Clerk publicMetadata for fast access
      try {
        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: { role: linked!.role, dbUserId: emailUser.id },
        });
      } catch (err) {
        req.log.warn({ err }, "Failed to update Clerk publicMetadata");
      }
      res.json({ user: toPublicUser(linked!) });
      return;
    }
  }

  // 3. Create a new DB user
  const body = req.body as Record<string, unknown>;
  const role = ADMIN_EMAILS.has(clerkEmail)
    ? ("admin" as const)
    : (normalizeRole(body.role) ?? "client");
  const providerType =
    role === "service_provider" &&
    typeof body.providerType === "string" &&
    (VALID_PROVIDER_TYPES as readonly string[]).includes(body.providerType)
      ? (body.providerType as (typeof VALID_PROVIDER_TYPES)[number])
      : null;
  const fullName =
    typeof body.fullName === "string" && body.fullName.trim().length >= 2
      ? body.fullName.trim()
      : clerkFullName;
  const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  const city = typeof body.city === "string" ? body.city.trim() || null : null;
  const language = typeof body.language === "string" ? body.language : "en";
  const companyName =
    role === "service_provider" && typeof body.companyName === "string"
      ? body.companyName.trim() || null
      : null;
  const serviceTypes =
    role === "service_provider" && Array.isArray(body.serviceTypes)
      ? (body.serviceTypes.filter((s) => typeof s === "string") as string[])
      : null;

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const slugBase = role === "service_provider" && companyName ? companyName : fullName;
  const slug = await generateUniqueSlug(slugBase);

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkUserId,
      email: clerkEmail,
      passwordHash: "",
      role,
      providerType: role === "service_provider" ? providerType : null,
      fullName,
      slug,
      phone,
      city,
      language,
      avatarUrl: clerkAvatarUrl,
      companyName: role === "service_provider" ? companyName : null,
      serviceTypes: role === "service_provider" ? serviceTypes : null,
    })
    .returning();

  if (!newUser) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  // Persist role to Clerk publicMetadata
  try {
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { role: newUser.role, dbUserId: newUser.id },
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to update Clerk publicMetadata");
  }

  // Service providers get a Free plan subscription with 3 monthly credits.
  if (role === "service_provider") {
    try {
      const [freePlan] = await db
        .select()
        .from(subscriptionPlansTable)
        .where(eq(subscriptionPlansTable.slug, "free"))
        .limit(1);
      if (freePlan) {
        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);
        await db.insert(subscriptionsTable).values({
          userId: newUser.id,
          planId: freePlan.id,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: end,
          providerRef: `clerk_free_${newUser.id}_${now.getTime()}`,
        });
        if (freePlan.monthlyCredits > 0) {
          await grantMonthlyCredits(newUser.id, freePlan.monthlyCredits, end, "Free plan signup");
        }
      }
    } catch (err) {
      req.log.error({ err }, "Failed to provision free plan");
    }
  }

  res.status(201).json({ user: toPublicUser(newUser) });
});

// ── PUT /auth/profile ─────────────────────────────────────────────────────────
router.put("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId!;

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (typeof body.fullName === "string" && body.fullName.trim().length >= 2) {
    updates.fullName = body.fullName.trim();
  }
  if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body.city === "string") updates.city = body.city.trim() || null;
  if (typeof body.bio === "string") updates.bio = body.bio.trim() || null;
  if (typeof body.avatarUrl === "string") updates.avatarUrl = body.avatarUrl.trim() || null;
  if (typeof body.companyName === "string") updates.companyName = body.companyName.trim() || null;
  if (typeof body.website === "string") updates.website = body.website.trim() || null;
  if (typeof body.licenseNumber === "string") updates.licenseNumber = body.licenseNumber.trim() || null;
  if (typeof body.yearsExperience === "number" && body.yearsExperience >= 0 && body.yearsExperience <= 100) {
    updates.yearsExperience = Math.floor(body.yearsExperience);
  }
  if (Array.isArray(body.serviceTypes)) {
    updates.serviceTypes = (body.serviceTypes.filter((s) => typeof s === "string") as string[])
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 60)
      .slice(0, 20);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, dbUser.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user: toPublicUser(user) });
});

export default router;

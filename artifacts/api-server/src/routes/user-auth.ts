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

const VALID_ACCOUNT_TYPES = ["project_poster", "service_provider"] as const;
const VALID_ACCOUNT_SUBTYPES = ["individual", "company"] as const;

const ADMIN_EMAILS = new Set(["immovia.rd@gmail.com"]);

function normalizeAccountType(v: unknown): "project_poster" | "service_provider" | null {
  if (typeof v !== "string") return null;
  // New values
  if (v === "project_poster") return "project_poster";
  if (v === "service_provider") return "service_provider";
  // Legacy mapping
  if (v === "client" || v === "homeowner") return "project_poster";
  if (v === "contractor") return "service_provider";
  return null;
}

function normalizeAccountSubtype(v: unknown): "individual" | "company" | null {
  if (typeof v !== "string") return null;
  if (v === "company") return "company";
  if (v === "individual" || v === "small_team") return "individual";
  return "individual";
}

// ── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId!;

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found. Please complete sign-up." });
    return;
  }

  // Auto-upgrade role for known admin emails
  if (ADMIN_EMAILS.has(user.email) && user.role !== "admin") {
    const [upgraded] = await db
      .update(usersTable)
      .set({ role: "admin" })
      .where(eq(usersTable.id, user.id))
      .returning();
    if (upgraded) user = upgraded;
  }

  res.json({ user: toPublicUser(user) });
});

// ── POST /auth/sync ──────────────────────────────────────────────────────────
router.post("/auth/sync", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const clerkUserId = auth.userId;

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

  // 1. Check if DB user already linked
  let [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (existingUser) {
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

  // 2. Check if DB user exists with same email
  if (clerkEmail) {
    const [emailUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, clerkEmail))
      .limit(1);
    if (emailUser) {
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
  const isAdminEmail = ADMIN_EMAILS.has(clerkEmail);

  const role = isAdminEmail ? ("admin" as const) : ("user" as const);
  const accountType = isAdminEmail
    ? null
    : (normalizeAccountType(body.accountType ?? body.role) ?? "project_poster");
  const accountSubtype = isAdminEmail
    ? null
    : (normalizeAccountSubtype(body.accountSubtype ?? body.providerType) ?? "individual");

  const fullName =
    typeof body.fullName === "string" && body.fullName.trim().length >= 2
      ? body.fullName.trim()
      : clerkFullName;
  const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  const city = typeof body.city === "string" ? body.city.trim() || null : null;
  const language = typeof body.language === "string" ? body.language : "en";
  const companyName =
    accountSubtype === "company" && typeof body.companyName === "string"
      ? body.companyName.trim() || null
      : null;
  const serviceTypes =
    accountType === "service_provider" && Array.isArray(body.serviceTypes)
      ? (body.serviceTypes.filter((s) => typeof s === "string") as string[])
      : null;

  const slugBase = companyName || fullName;
  const slug = await generateUniqueSlug(slugBase);

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkUserId,
      email: clerkEmail,
      passwordHash: "",
      role,
      accountType,
      accountSubtype,
      providerType: accountSubtype === "company" ? "company" : accountSubtype === "individual" ? "individual" : null,
      fullName,
      slug,
      phone,
      city,
      language,
      avatarUrl: clerkAvatarUrl,
      companyName: accountSubtype === "company" ? companyName : null,
      serviceTypes: accountType === "service_provider" ? serviceTypes : null,
    })
    .returning();

  if (!newUser) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  try {
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { role: newUser.role, accountType: newUser.accountType, dbUserId: newUser.id },
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to update Clerk publicMetadata");
  }

  // Service providers get a Free plan subscription
  if (accountType === "service_provider") {
    try {
      const [freePlan] = await db
        .select()
        .from(subscriptionPlansTable)
        .where(eq(subscriptionPlansTable.slug, "free"))
        .limit(1);
      if (freePlan) {
        await db.insert(subscriptionsTable).values({
          userId: newUser.id,
          planId: freePlan.id,
          status: "active",
        });
        await grantMonthlyCredits(newUser.id, freePlan.id);
      }
    } catch (err) {
      req.log.warn({ err }, "Failed to create free subscription for new service provider");
    }
  }

  res.json({ user: toPublicUser(newUser) });
});

// ── GET /auth/profile ──────────────────────────────────────────────────────
router.get("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, auth.userId!))
    .limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ user: toPublicUser(user) });
});

// ── PUT /auth/profile ──────────────────────────────────────────────────────
router.put("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId!;
  const body = req.body as Partial<{
    fullName: string;
    phone: string;
    city: string;
    bio: string;
    companyName: string;
    serviceTypes: string[];
    website: string;
    licenseNumber: string;
    yearsExperience: number;
    language: string;
    avatarUrl: string;
  }>;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (body.fullName) updates.fullName = body.fullName;
  if (body.phone !== undefined) updates.phone = body.phone || null;
  if (body.city !== undefined) updates.city = body.city || null;
  if (body.bio !== undefined) updates.bio = body.bio || null;
  if (body.companyName !== undefined) updates.companyName = body.companyName || null;
  if (body.serviceTypes !== undefined) updates.serviceTypes = body.serviceTypes;
  if (body.website !== undefined) updates.website = body.website || null;
  if (body.licenseNumber !== undefined) updates.licenseNumber = body.licenseNumber || null;
  if (body.yearsExperience !== undefined) updates.yearsExperience = body.yearsExperience ?? null;
  if (body.language) updates.language = body.language;
  if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl || null;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, existing.id))
    .returning();

  res.json({ user: toPublicUser(updated!) });
});

export default router;

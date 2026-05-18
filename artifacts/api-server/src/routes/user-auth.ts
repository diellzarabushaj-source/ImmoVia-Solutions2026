import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, toPublicUser } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const router: IRouter = Router();

const VALID_ROLES = ["homeowner", "contractor"] as const;
type Role = (typeof VALID_ROLES)[number];

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role as Role;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const city = typeof body.city === "string" ? body.city.trim() : null;
  const language = typeof body.language === "string" ? body.language : "en";
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : null;
  const serviceTypes = Array.isArray(body.serviceTypes)
    ? (body.serviceTypes.filter((s) => typeof s === "string") as string[])
    : null;

  if (!isEmail(email)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  if (fullName.length < 2) {
    res.status(400).json({ error: "Full name required" });
    return;
  }
  if (role === "contractor" && (!companyName || companyName.length < 2)) {
    res.status(400).json({ error: "Company name required for contractors" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      role,
      fullName,
      phone,
      city,
      language,
      companyName: role === "contractor" ? companyName : null,
      serviceTypes: role === "contractor" ? serviceTypes : null,
    })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  req.session.regenerate((regenErr) => {
    if (regenErr) {
      req.log.error({ err: regenErr }, "Session regenerate error");
      res.status(500).json({ error: "Session error" });
      return;
    }
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Session save error");
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ user: toPublicUser(user) });
    });
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.regenerate((regenErr) => {
    if (regenErr) {
      req.log.error({ err: regenErr }, "Session regenerate error");
      res.status(500).json({ error: "Session error" });
      return;
    }
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Session save error");
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ user: toPublicUser(user) });
    });
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("immovia.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    req.session.destroy(() => {
      res.status(401).json({ error: "Unauthorized" });
    });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

router.put("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
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
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user: toPublicUser(user) });
});

export default router;

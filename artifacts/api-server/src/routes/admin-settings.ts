import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, platformSettingsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

const DEFAULT_SETTINGS: Record<string, string> = {
  "platform.name": "ImmoVia",
  "platform.tagline": "Find trusted renovation professionals",
  "platform.maintenance": "false",
  "projects.auto_approve": "false",
  "companies.require_license": "false",
  "contact.support_email": "support@immovia365.ch",
  "contact.support_phone": "+41 000 000 000",
};

router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(platformSettingsTable).orderBy(platformSettingsTable.key);

  const existingKeys = new Set(rows.map((r) => r.key));
  const missing = Object.entries(DEFAULT_SETTINGS).filter(([k]) => !existingKeys.has(k));

  if (missing.length) {
    await db.insert(platformSettingsTable).values(missing.map(([key, value]) => ({ key, value }))).onConflictDoNothing();
    const fresh = await db.select().from(platformSettingsTable).orderBy(platformSettingsTable.key);
    res.json(fresh.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
    return;
  }

  res.json(rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const updates = req.body as Record<string, string>;

  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Body must be a key-value object" });
    return;
  }

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      db
        .insert(platformSettingsTable)
        .values({ key, value })
        .onConflictDoUpdate({
          target: platformSettingsTable.key,
          set: { value, updatedAt: sql`now()` },
        }),
    ),
  );

  const rows = await db.select().from(platformSettingsTable).orderBy(platformSettingsTable.key);
  res.json(rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, projectsTable, companiesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// PATCH /customer/projects/:id — customer can update title, description, status (archive)
router.patch("/customer/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db
    .select({ id: projectsTable.id, ownerUserId: projectsTable.ownerUserId })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project || project.ownerUserId !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { title, description, status } = req.body as Record<string, unknown>;
  const allowed = ["archived", "completed", "pending"];

  const updateData: Record<string, string> = {};
  if (typeof title === "string" && title.trim()) updateData.title = title.trim();
  if (typeof description === "string" && description.trim()) updateData.description = description.trim();
  if (typeof status === "string" && allowed.includes(status)) updateData.status = status;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" }); return;
  }

  const [updated] = await db
    .update(projectsTable)
    .set(updateData)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerUserId, userId)))
    .returning();

  res.json({ ok: true, project: updated });
});

// GET /customer/favorites — list saved providers
router.get("/customer/favorites", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db.execute(sql`
    SELECT cf.id, cf.company_id AS "companyId", cf.created_at AS "createdAt",
           c.name, c.city, c.service_types AS "serviceTypes", c.logo_url AS "logoUrl",
           c.short_description AS "shortDescription"
    FROM customer_favorites cf
    LEFT JOIN companies c ON c.id = cf.company_id
    WHERE cf.user_id = ${userId}
    ORDER BY cf.created_at DESC
  `);
  res.json(rows.rows ?? []);
});

// POST /customer/favorites/:companyId — add favorite
router.post("/customer/favorites/:companyId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const companyId = parseInt(req.params.companyId, 10);
  if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company id" }); return; }

  const [company] = await db.select({ id: companiesTable.id }).from(companiesTable).where(eq(companiesTable.id, companyId));
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }

  await db.execute(sql`
    INSERT INTO customer_favorites (user_id, company_id)
    VALUES (${userId}, ${companyId})
    ON CONFLICT (user_id, company_id) DO NOTHING
  `);
  res.json({ ok: true });
});

// DELETE /customer/favorites/:companyId — remove favorite
router.delete("/customer/favorites/:companyId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const companyId = parseInt(req.params.companyId, 10);
  if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company id" }); return; }

  await db.execute(sql`
    DELETE FROM customer_favorites WHERE user_id = ${userId} AND company_id = ${companyId}
  `);
  res.json({ ok: true });
});

export default router;

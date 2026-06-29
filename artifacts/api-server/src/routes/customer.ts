import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, projectsTable, companiesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// PATCH /customer/projects/:id — customer can update title, description, status (archive)
router.patch("/customer/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const projectId = parseInt(String(req.params.id), 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db
    .select({ id: projectsTable.id, ownerUserId: projectsTable.ownerUserId, status: projectsTable.status })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project || project.ownerUserId !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const body = req.body as Record<string, unknown>;
  const {
    title, description, status, projectType, subcategory,
    subcategoryOtherText, city, budget, timeline, size, photos,
  } = body;
  const allowedStatus = ["archived", "completed", "pending"];
  const allowedSize = ["small", "medium", "large", "premium"];

  const updateData: Record<string, unknown> = {};
  if (typeof title === "string") updateData.title = title.trim() || null;
  if (typeof description === "string" && description.trim()) updateData.description = description.trim();
  if (typeof status === "string" && allowedStatus.includes(status)) updateData.status = status;
  if (typeof projectType === "string" && projectType.trim()) updateData.projectType = projectType.trim();
  if (typeof subcategory === "string") updateData.subcategory = subcategory.trim() || null;
  if (typeof subcategoryOtherText === "string") {
    updateData.subcategoryOtherText =
      subcategoryOtherText.trim().replace(/\s+/g, " ").slice(0, 40) || null;
  }
  if (typeof city === "string" && city.trim()) updateData.city = city.trim();
  if (typeof budget === "string") updateData.budget = budget.trim() || null;
  if (typeof timeline === "string") updateData.timeline = timeline.trim() || null;
  if (typeof size === "string" && allowedSize.includes(size)) updateData.size = size;
  if (Array.isArray(photos) && photos.every((p) => typeof p === "string")) {
    updateData.photos = photos as string[];
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" }); return;
  }

  // If the poster edits content fields on a live ("open") project, reset to pending for admin re-approval.
  const CONTENT_FIELDS = ["title", "description", "projectType", "subcategory", "subcategoryOtherText", "city", "budget", "timeline", "size", "photos"];
  const editingContent = CONTENT_FIELDS.some((f) => f in updateData);
  if (editingContent && project.status === "open" && !("status" in updateData)) {
    updateData.status = "pending";
  }

  const [updated] = await db
    .update(projectsTable)
    .set(updateData)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerUserId, userId)))
    .returning();

  res.json({ ok: true, project: updated });
});

// DELETE /customer/projects/:id — customer permanently deletes their own project
router.delete("/customer/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const projectId = parseInt(String(req.params.id), 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db
    .select({ id: projectsTable.id, ownerUserId: projectsTable.ownerUserId })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project || project.ownerUserId !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.delete(projectsTable).where(and(eq(projectsTable.id, projectId), eq(projectsTable.ownerUserId, userId)));
  res.sendStatus(204);
});

// GET /customer/favorites — list saved providers
router.get("/customer/favorites", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db.execute(sql`
    SELECT cf.id, cf.company_id AS "companyId", cf.created_at AS "createdAt",
           c.company_name AS "name", c.city, c.service_types AS "serviceTypes", c.logo_url AS "logoUrl",
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
  const companyId = parseInt(String(req.params.companyId), 10);
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
  const companyId = parseInt(String(req.params.companyId), 10);
  if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company id" }); return; }

  await db.execute(sql`
    DELETE FROM customer_favorites WHERE user_id = ${userId} AND company_id = ${companyId}
  `);
  res.json({ ok: true });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, applicationsTable, projectsTable, companiesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/applications", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: applicationsTable.id,
      projectId: applicationsTable.projectId,
      companyId: applicationsTable.companyId,
      status: applicationsTable.status,
      message: applicationsTable.message,
      createdAt: applicationsTable.createdAt,
    })
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt));

  const projectIds = [...new Set(rows.map((r) => r.projectId).filter(Boolean))] as number[];
  const companyIds = [...new Set(rows.map((r) => r.companyId).filter(Boolean))] as number[];

  const [projects, companies] = await Promise.all([
    projectIds.length
      ? db.select({ id: projectsTable.id, fullName: projectsTable.fullName, city: projectsTable.city }).from(projectsTable)
      : [],
    companyIds.length
      ? db.select({ id: companiesTable.id, companyName: companiesTable.companyName }).from(companiesTable)
      : [],
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      project: r.projectId ? projectMap.get(r.projectId) ?? null : null,
      company: r.companyId ? companyMap.get(r.companyId) ?? null : null,
    })),
  );
});

router.post("/admin/applications", requireAdmin, async (req, res): Promise<void> => {
  const { projectId, companyId, message } = req.body as {
    projectId?: number;
    companyId?: number;
    message?: string;
  };

  const [created] = await db
    .insert(applicationsTable)
    .values({ projectId: projectId ?? null, companyId: companyId ?? null, message: message ?? null })
    .returning();

  res.status(201).json({ ...created, createdAt: created!.createdAt.toISOString() });
});

router.patch("/admin/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { status } = req.body as { status?: string };

  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status })
    .where(eq(applicationsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/admin/applications/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  res.status(204).end();
});

export default router;

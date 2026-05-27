import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, applicationsTable, projectsTable, usersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/applications", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: applicationsTable.id,
      projectId: applicationsTable.projectId,
      applicantUserId: applicationsTable.applicantUserId,
      message: applicationsTable.message,
      proposedPrice: applicationsTable.proposedPrice,
      status: applicationsTable.status,
      createdAt: applicationsTable.createdAt,
    })
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt));

  const projectIds = [...new Set(rows.map((r) => r.projectId).filter(Boolean))] as number[];
  const userIds = [...new Set(rows.map((r) => r.applicantUserId).filter(Boolean))] as number[];

  const [projects, applicants] = await Promise.all([
    projectIds.length
      ? db.select({ id: projectsTable.id, fullName: projectsTable.fullName, city: projectsTable.city }).from(projectsTable)
      : [],
    userIds.length
      ? db.select({ id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email }).from(usersTable)
      : [],
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const userMap = new Map(applicants.map((u) => [u.id, u]));

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      project: r.projectId ? (projectMap.get(r.projectId) ?? null) : null,
      applicant: r.applicantUserId ? (userMap.get(r.applicantUserId) ?? null) : null,
    })),
  );
});

router.post("/admin/applications", requireAdmin, async (req, res): Promise<void> => {
  const { projectId, applicantUserId, message, proposedPrice } = req.body as {
    projectId?: number;
    applicantUserId?: number;
    message?: string;
    proposedPrice?: string;
  };

  const [created] = await db
    .insert(applicationsTable)
    .values({
      projectId: projectId ?? null,
      applicantUserId: applicantUserId ?? null,
      message: message ?? null,
      proposedPrice: proposedPrice ?? null,
    })
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

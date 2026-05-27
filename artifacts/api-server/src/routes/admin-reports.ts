import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/reports", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/admin/reports", async (req, res): Promise<void> => {
  const { targetType, targetId, reason, reporterId } = req.body as {
    targetType?: string;
    targetId?: number;
    reason?: string;
    reporterId?: number;
  };

  if (!targetType || !targetId || !reason) {
    res.status(400).json({ error: "targetType, targetId and reason are required" });
    return;
  }

  const [created] = await db
    .insert(reportsTable)
    .values({ targetType, targetId, reason, reporterId: reporterId ?? null })
    .returning();

  res.status(201).json({ ...created, createdAt: created!.createdAt.toISOString() });
});

router.patch("/admin/reports/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { status } = req.body as { status?: string };

  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const [updated] = await db
    .update(reportsTable)
    .set({ status })
    .where(eq(reportsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/admin/reports/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(reportsTable).where(eq(reportsTable.id, id));
  res.status(204).end();
});

export default router;

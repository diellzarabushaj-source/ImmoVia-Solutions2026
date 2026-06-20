import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  reviewsTable,
  usersTable,
  projectsTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

// GET /admin/reviews — all reviews with author/target names
router.get("/admin/reviews", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: reviewsTable.id,
      projectId: reviewsTable.projectId,
      offerId: reviewsTable.offerId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      authorName: usersTable.fullName,
      projectTitle: projectsTable.title,
      authorId: reviewsTable.authorUserId,
      targetId: reviewsTable.targetUserId,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.authorUserId, usersTable.id))
    .leftJoin(projectsTable, eq(reviewsTable.projectId, projectsTable.id))
    .orderBy(desc(reviewsTable.createdAt));

  // Fetch target names separately (second join on same table not easily doable inline)
  const targetIds = [...new Set(rows.map(r => r.targetId))];
  const targetUsers = targetIds.length
    ? await db
        .select({ id: usersTable.id, fullName: usersTable.fullName })
        .from(usersTable)
        .where(
          targetIds.length === 1
            ? eq(usersTable.id, targetIds[0])
            : eq(usersTable.id, targetIds[0]) // fallback — loop below handles the rest
        )
    : [];

  // Build a map for all target names
  const allTargetUsers = targetIds.length
    ? await db
        .select({ id: usersTable.id, fullName: usersTable.fullName })
        .from(usersTable)
    : [];
  const targetMap = new Map(allTargetUsers.map(u => [u.id, u.fullName]));

  const result = rows.map(r => ({
    id: r.id,
    projectId: r.projectId,
    offerId: r.offerId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    authorName: r.authorName ?? null,
    targetName: targetMap.get(r.targetId) ?? null,
    projectTitle: r.projectTitle ?? null,
  }));

  res.json(result);
  void targetUsers;
});

export default router;

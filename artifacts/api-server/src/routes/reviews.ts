import { Router, type IRouter } from "express";
import { and, avg, count, desc, eq } from "drizzle-orm";
import {
  db,
  reviewsTable,
  offersTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// POST /projects/:id/review — authenticated client submits a review for an accepted offer
router.post("/projects/:id/review", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const userId = req.session.userId!;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user || user.role !== "client") {
    res.status(403).json({ error: "Only clients can leave reviews" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);
  if (!project || project.ownerUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const offerId = Number(body.offerId);
  if (!Number.isFinite(offerId)) {
    res.status(400).json({ error: "offerId required" });
    return;
  }

  const [offer] = await db
    .select()
    .from(offersTable)
    .where(
      and(
        eq(offersTable.id, offerId),
        eq(offersTable.projectId, projectId),
        eq(offersTable.status, "accepted")
      )
    )
    .limit(1);
  if (!offer) {
    res.status(400).json({ error: "Accepted offer not found" });
    return;
  }

  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    res.status(400).json({ error: "Rating must be an integer 1-5" });
    return;
  }
  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim()
      : null;

  const [existing] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.offerId, offerId), eq(reviewsTable.authorUserId, userId)))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Already reviewed" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      projectId,
      offerId,
      authorUserId: userId,
      targetUserId: offer.providerUserId,
      rating,
      comment,
    })
    .returning();

  res.status(201).json({ review });
});

// GET /reviews/by-provider/:userId — public: reviews + stats for a provider
router.get("/reviews/by-provider/:userId", async (req, res): Promise<void> => {
  const targetUserId = Number(req.params.userId);
  if (!Number.isFinite(targetUserId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  const reviews = await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      authorName: usersTable.fullName,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.authorUserId, usersTable.id))
    .where(eq(reviewsTable.targetUserId, targetUserId))
    .orderBy(desc(reviewsTable.createdAt));

  const [stats] = await db
    .select({
      avgRating: avg(reviewsTable.rating),
      totalCount: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.targetUserId, targetUserId));

  res.json({
    reviews,
    average: stats?.avgRating ? Math.round(Number(stats.avgRating) * 10) / 10 : null,
    count: Number(stats?.totalCount ?? 0),
  });
});

// GET /reviews/my-reviewed-offers — authenticated client: which offer IDs have been reviewed
router.get("/reviews/my-reviewed-offers", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const rows = await db
    .select({ offerId: reviewsTable.offerId })
    .from(reviewsTable)
    .where(eq(reviewsTable.authorUserId, userId));
  res.json({ reviewedOfferIds: rows.map((r) => r.offerId) });
});

export default router;

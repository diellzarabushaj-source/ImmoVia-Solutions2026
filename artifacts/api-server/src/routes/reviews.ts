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
import { requireAdmin } from "../middlewares/requireAdmin";
import { sendReviewReceivedNotification } from "../lib/email";

const router: IRouter = Router();

// POST /projects/:id/review — authenticated user (poster OR provider) submits a review
// Eligibility: the offer must be "accepted" AND the caller must be a party to the offer
router.post("/projects/:id/review", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const userId = req.userId!;

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const offerId = Number(body.offerId);
  if (!Number.isFinite(offerId)) {
    res.status(400).json({ error: "offerId required" });
    return;
  }

  // Load the accepted offer
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

  // Determine caller role in this offer
  const isProjectPoster = project.ownerUserId === userId;
  const isProvider = offer.providerUserId === userId;
  if (!isProjectPoster && !isProvider) {
    res.status(403).json({ error: "You are not a party to this offer" });
    return;
  }

  const targetUserId = isProjectPoster ? offer.providerUserId : project.ownerUserId!;
  if (!targetUserId) {
    res.status(400).json({ error: "Target user not found" });
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
      targetUserId,
      rating,
      comment,
    })
    .returning();

  // Notify the reviewed user (fire-and-forget)
  void (async () => {
    try {
      const [author] = await db
        .select({ fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      const [target] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName, accountType: usersTable.accountType, language: usersTable.language })
        .from(usersTable)
        .where(eq(usersTable.id, targetUserId))
        .limit(1);
      if (!target?.email) return;
      await sendReviewReceivedNotification({
        recipientEmail: target.email,
        recipientName: target.fullName,
        reviewerName: author?.fullName ?? null,
        rating,
        comment,
        projectType: project.projectType,
        city: project.city,
        isProvider: target.accountType === "service_provider",
        language: target.language,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to send review received notification");
    }
  })();

  res.status(201).json({ review });
});

// GET /reviews/pending — accepted offers where the current user hasn't reviewed yet
router.get("/reviews/pending", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  // All accepted offers involving the current user (as poster or provider)
  const [user] = await db
    .select({ accountType: usersTable.accountType })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  // Offers where user is the provider
  const providerOffers = user.accountType === "service_provider"
    ? await db
        .select({
          offerId: offersTable.id,
          projectId: offersTable.projectId,
          projectTitle: projectsTable.title,
          otherUserId: projectsTable.ownerUserId,
          otherName: usersTable.fullName,
          createdAt: offersTable.createdAt,
        })
        .from(offersTable)
        .leftJoin(projectsTable, eq(offersTable.projectId, projectsTable.id))
        .leftJoin(usersTable, eq(projectsTable.ownerUserId, usersTable.id))
        .where(
          and(
            eq(offersTable.providerUserId, userId),
            eq(offersTable.status, "accepted")
          )
        )
    : [];

  // Offers where user is the project poster
  const posterOffers = user.accountType === "project_poster"
    ? await db
        .select({
          offerId: offersTable.id,
          projectId: offersTable.projectId,
          projectTitle: projectsTable.title,
          otherUserId: offersTable.providerUserId,
          otherName: usersTable.fullName,
          createdAt: offersTable.createdAt,
        })
        .from(offersTable)
        .leftJoin(projectsTable, eq(offersTable.projectId, projectsTable.id))
        .leftJoin(usersTable, eq(offersTable.providerUserId, usersTable.id))
        .where(
          and(
            eq(projectsTable.ownerUserId, userId),
            eq(offersTable.status, "accepted")
          )
        )
    : [];

  const allEligible = [...providerOffers, ...posterOffers];

  // Filter out offers already reviewed by this user
  const alreadyReviewed = await db
    .select({ offerId: reviewsTable.offerId })
    .from(reviewsTable)
    .where(eq(reviewsTable.authorUserId, userId));

  const reviewedIds = new Set(alreadyReviewed.map(r => r.offerId));

  const pending = allEligible.filter(o => !reviewedIds.has(o.offerId));

  res.json({ pending });
});

// GET /reviews/received — reviews written FOR the current user
router.get("/reviews/received", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const reviews = await db
    .select({
      id: reviewsTable.id,
      offerId: reviewsTable.offerId,
      projectId: reviewsTable.projectId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      authorName: usersTable.fullName,
      projectTitle: projectsTable.title,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.authorUserId, usersTable.id))
    .leftJoin(projectsTable, eq(reviewsTable.projectId, projectsTable.id))
    .where(eq(reviewsTable.targetUserId, userId))
    .orderBy(desc(reviewsTable.createdAt));

  const [stats] = await db
    .select({ avgRating: avg(reviewsTable.rating), totalCount: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(eq(reviewsTable.targetUserId, userId));

  res.json({
    reviews,
    average: stats?.avgRating ? Math.round(Number(stats.avgRating) * 10) / 10 : null,
    count: Number(stats?.totalCount ?? 0),
  });
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

// GET /reviews/my-reviewed-offers — authenticated: which offer IDs the user has already reviewed
router.get("/reviews/my-reviewed-offers", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db
    .select({ offerId: reviewsTable.offerId })
    .from(reviewsTable)
    .where(eq(reviewsTable.authorUserId, userId));
  res.json({ reviewedOfferIds: rows.map((r) => r.offerId) });
});

// DELETE /reviews/:id — admin only
router.delete("/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const reviewId = Number(req.params.id);
  if (!Number.isFinite(reviewId)) {
    res.status(400).json({ error: "Invalid review id" });
    return;
  }

  const [existing] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(eq(reviewsTable.id, reviewId))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
  res.json({ ok: true });
});

export default router;

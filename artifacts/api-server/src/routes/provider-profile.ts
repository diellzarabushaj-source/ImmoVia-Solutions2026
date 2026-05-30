import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, usersTable, companiesTable, portfolioItemsTable } from "@workspace/db";
import { requireContractor } from "../middlewares/requireContractor";

const router: IRouter = Router();

router.get("/provider/profile", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.email, user.email)).limit(1);

  const portfolio = await db
    .select()
    .from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.userId, userId))
    .orderBy(asc(portfolioItemsTable.sortOrder), asc(portfolioItemsTable.id));

  const { passwordHash: _ph, clerkUserId: _ck, ...publicUser } = user;
  res.json({ user: publicUser, company: company ?? null, portfolio });
});

router.patch("/provider/profile", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;

  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const userUpdates: Record<string, unknown> = {};
  if (typeof body.bio === "string") userUpdates.bio = body.bio.slice(0, 1000);
  if (typeof body.phone === "string") userUpdates.phone = body.phone.slice(0, 50);
  if (typeof body.city === "string") userUpdates.city = body.city.slice(0, 100);
  if (typeof body.website === "string") userUpdates.website = body.website.slice(0, 200);
  if (typeof body.avatarUrl === "string") userUpdates.avatarUrl = body.avatarUrl.slice(0, 500);
  if (typeof body.yearsExperience === "number") userUpdates.yearsExperience = body.yearsExperience;

  if (Object.keys(userUpdates).length > 0) {
    await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, userId));
  }

  const compUpdates: Record<string, unknown> = {};
  if (typeof body.description === "string") compUpdates.description = body.description.slice(0, 2000);
  if (typeof body.shortDescription === "string") compUpdates.shortDescription = body.shortDescription.slice(0, 500);
  if (typeof body.phone === "string") compUpdates.phone = body.phone.slice(0, 50);
  if (typeof body.website === "string") compUpdates.website = body.website.slice(0, 200);
  if (typeof body.city === "string") compUpdates.city = body.city.slice(0, 100);
  if (typeof body.hourlyRate === "number") compUpdates.hourlyRate = body.hourlyRate;
  if (typeof body.profilePhoto === "string") compUpdates.profilePhoto = body.profilePhoto.slice(0, 500);
  if (typeof body.logoUrl === "string") compUpdates.logoUrl = body.logoUrl.slice(0, 500);
  if (typeof body.coverImageUrl === "string") compUpdates.coverImageUrl = body.coverImageUrl.slice(0, 500);
  if (typeof body.serviceArea === "string") compUpdates.serviceArea = body.serviceArea.slice(0, 200);
  if (typeof body.availability === "string") compUpdates.availability = body.availability.slice(0, 200);
  if (typeof body.teamSize === "number") compUpdates.teamSize = body.teamSize;
  if (typeof body.priceType === "string") compUpdates.priceType = body.priceType;
  if (typeof body.priceFromChf === "number") compUpdates.priceFromChf = String(body.priceFromChf);
  if (body.priceFromChf === null) compUpdates.priceFromChf = null;
  if (typeof body.priceUnit === "string") compUpdates.priceUnit = body.priceUnit;
  if (typeof body.priceNote === "string") compUpdates.priceNote = body.priceNote.slice(0, 200);
  if (typeof body.priceIsPublic === "boolean") compUpdates.priceIsPublic = body.priceIsPublic;
  if (typeof body.workerType === "string") compUpdates.workerType = body.workerType;
  if (typeof body.contactName === "string") compUpdates.contactName = body.contactName.slice(0, 100);

  if (Array.isArray(body.galleryPhotos)) {
    compUpdates.galleryPhotos = (body.galleryPhotos as unknown[])
      .filter((u): u is string => typeof u === "string" && u.length < 500)
      .slice(0, 20);
  }
  if (Array.isArray(body.categories)) {
    compUpdates.serviceTypes = (body.categories as unknown[])
      .filter((u): u is string => typeof u === "string")
      .slice(0, 30);
  }
  if (Array.isArray(body.specializations)) {
    compUpdates.specializations = (body.specializations as unknown[])
      .filter((u): u is string => typeof u === "string")
      .slice(0, 20);
  }
  if (Array.isArray(body.languages)) {
    compUpdates.languages = (body.languages as unknown[])
      .filter((u): u is string => typeof u === "string")
      .slice(0, 10);
  }

  if (Object.keys(compUpdates).length > 0) {
    await db.update(companiesTable).set(compUpdates).where(eq(companiesTable.email, user.email));
  }

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [updatedCompany] = await db.select().from(companiesTable).where(eq(companiesTable.email, user.email)).limit(1);
  const { passwordHash: _ph, clerkUserId: _ck, ...publicUser } = updatedUser;
  res.json({ user: publicUser, company: updatedCompany ?? null });
});

// ── PORTFOLIO CRUD ──

router.post("/provider/portfolio", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;

  if (typeof body.imageUrl !== "string" || !body.imageUrl) {
    res.status(400).json({ error: "imageUrl required" });
    return;
  }

  const existing = await db
    .select({ id: portfolioItemsTable.id })
    .from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.userId, userId));

  const [item] = await db.insert(portfolioItemsTable).values({
    userId,
    imageUrl: body.imageUrl.slice(0, 500),
    title: typeof body.title === "string" ? body.title.slice(0, 120) : null,
    description: typeof body.description === "string" ? body.description.slice(0, 1000) : null,
    category: typeof body.category === "string" ? body.category.slice(0, 100) : null,
    city: typeof body.city === "string" ? body.city.slice(0, 100) : null,
    projectDate: typeof body.projectDate === "string" ? body.projectDate.slice(0, 20) : null,
    isBeforeAfter: body.isBeforeAfter === true,
    isFeatured: body.isFeatured === true,
    sortOrder: existing.length,
  }).returning();

  res.json(item);
});

router.patch("/provider/portfolio/:id", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const itemId = Number(req.params.id);
  const body = req.body as Record<string, unknown>;

  const [existing] = await db
    .select()
    .from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.id, itemId))
    .limit(1);

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title.slice(0, 120);
  if (typeof body.description === "string") updates.description = body.description.slice(0, 1000);
  if (typeof body.category === "string") updates.category = body.category.slice(0, 100);
  if (typeof body.city === "string") updates.city = body.city.slice(0, 100);
  if (typeof body.projectDate === "string") updates.projectDate = body.projectDate.slice(0, 20);
  if (typeof body.isBeforeAfter === "boolean") updates.isBeforeAfter = body.isBeforeAfter;
  if (typeof body.isFeatured === "boolean") updates.isFeatured = body.isFeatured;
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;

  if (Object.keys(updates).length === 0) {
    res.json(existing);
    return;
  }

  const [updated] = await db
    .update(portfolioItemsTable)
    .set(updates)
    .where(eq(portfolioItemsTable.id, itemId))
    .returning();

  res.json(updated);
});

router.delete("/provider/portfolio/:id", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const itemId = Number(req.params.id);

  const [existing] = await db
    .select()
    .from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.id, itemId))
    .limit(1);

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(portfolioItemsTable).where(eq(portfolioItemsTable.id, itemId));
  res.json({ ok: true });
});

export default router;

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, companiesTable, portfolioItemsTable } from "@workspace/db";
import { requireContractor } from "../middlewares/requireContractor";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/provider/profile", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.email, user.email))
    .limit(1);

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

  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userUpdates: Record<string, unknown> = {};
  if (typeof body.bio === "string") userUpdates.bio = body.bio.slice(0, 1000);
  if (typeof body.phone === "string") userUpdates.phone = body.phone.slice(0, 50);
  if (typeof body.city === "string") userUpdates.city = body.city.slice(0, 100);
  if (typeof body.website === "string") userUpdates.website = body.website.slice(0, 200);
  if (typeof body.companyName === "string") userUpdates.companyName = body.companyName.slice(0, 120);
  if (typeof body.avatarUrl === "string") userUpdates.avatarUrl = body.avatarUrl.slice(0, 500);
  if (typeof body.yearsExperience === "number") userUpdates.yearsExperience = body.yearsExperience;

  if (Object.keys(userUpdates).length > 0) {
    await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, userId));
  }

  const compUpdates: Record<string, unknown> = {};
  if (typeof body.description === "string") compUpdates.description = body.description.slice(0, 2000);
  if (typeof body.phone === "string") compUpdates.phone = body.phone.slice(0, 50);
  if (typeof body.website === "string") compUpdates.website = body.website.slice(0, 200);
  if (typeof body.city === "string") compUpdates.city = body.city.slice(0, 100);
  if (typeof body.hourlyRate === "number") compUpdates.hourlyRate = body.hourlyRate;
  if (typeof body.profilePhoto === "string") compUpdates.profilePhoto = body.profilePhoto.slice(0, 500);
  if (Array.isArray(body.galleryPhotos)) {
    compUpdates.galleryPhotos = (body.galleryPhotos as unknown[])
      .filter((u): u is string => typeof u === "string" && u.length < 500)
      .slice(0, 20);
  }

  if (Object.keys(compUpdates).length > 0) {
    await db.update(companiesTable).set(compUpdates).where(eq(companiesTable.email, user.email));
  }

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [updatedCompany] = await db.select().from(companiesTable).where(eq(companiesTable.email, user.email)).limit(1);
  const { passwordHash: _ph, clerkUserId: _ck, ...publicUser } = updatedUser;
  res.json({ user: publicUser, company: updatedCompany ?? null });
});

export default router;

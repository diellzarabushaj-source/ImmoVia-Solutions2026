import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, usersTable, portfolioItemsTable, toPublicUser } from "@workspace/db";

const router: IRouter = Router();

router.get("/users/by-slug/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug || "").toLowerCase();
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.slug, slug), eq(usersTable.role, "service_provider")))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const portfolio = await db
    .select()
    .from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.userId, user.id))
    .orderBy(asc(portfolioItemsTable.sortOrder), asc(portfolioItemsTable.id));

  const publicUser = toPublicUser(user);
  res.json({ user: publicUser, portfolio });
});

router.get("/contractors", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "service_provider"))
    .orderBy(asc(usersTable.id));
  res.json({ contractors: rows.map(toPublicUser) });
});

export default router;

import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  usersTable,
  portfolioItemsTable,
  toPublicUser,
  subscriptionsTable,
  subscriptionPlansTable,
} from "@workspace/db";
import { getAuth } from "@clerk/express";
import { PLAN_CONTACT_VISIBLE, PLAN_BADGES } from "./billing";

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
    .where(and(eq(usersTable.slug, slug), eq(usersTable.accountType, "service_provider")))
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

  // Look up SP's active plan to determine what they expose to visitors
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, user.id))
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);

  let planSlug = "basic";
  if (sub) {
    const [plan] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, sub.planId))
      .limit(1);
    planSlug = plan?.slug ?? "basic";
  }

  const contactVisible = PLAN_CONTACT_VISIBLE[planSlug] ?? false;
  const planBadge = PLAN_BADGES[planSlug] ?? "";

  // Check if the visitor is authenticated (Clerk)
  const auth = getAuth(req);
  const viewerAuthenticated = !!auth.userId;

  const publicUser = toPublicUser(user);

  // Server-side enforcement: strip PII when not accessible
  const shouldShowContact = viewerAuthenticated && contactVisible;
  const safeUser = {
    ...publicUser,
    phone: shouldShowContact ? publicUser.phone : null,
    email: shouldShowContact ? publicUser.email : null,
    website: shouldShowContact ? publicUser.website : null,
  };

  res.json({
    user: safeUser,
    portfolio,
    meta: {
      viewerAuthenticated,
      contactVisible,
      planBadge,
    },
  });
});

router.get("/contractors", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.accountType, "service_provider"))
    .orderBy(asc(usersTable.id));
  res.json({ contractors: rows.map(toPublicUser) });
});

export default router;

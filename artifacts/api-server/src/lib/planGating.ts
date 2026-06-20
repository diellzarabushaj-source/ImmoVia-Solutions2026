import { and, desc, eq } from "drizzle-orm";
import { db, subscriptionsTable, subscriptionPlansTable, usersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import type { Request } from "express";

const CONTACT_VISIBLE_SLUGS = new Set(["pro", "premium"]);

/** Returns true for admin sessions, otherwise false. */
export function isAdminSession(req: Request): boolean {
  return req.session?.adminAuthenticated === true;
}

/** Returns true for any Clerk-authenticated user (or admin). Sync — no DB query. */
export function isAuthenticated(req: Request): boolean {
  if (isAdminSession(req)) return true;
  try {
    return Boolean(getAuth(req)?.userId);
  } catch {
    return false;
  }
}

/** Resolves the local user ID from a Clerk session. Returns undefined if not found. */
async function getLocalUserId(req: Request): Promise<number | undefined> {
  let clerkUserId: string | undefined;
  try {
    clerkUserId = getAuth(req)?.userId ?? undefined;
  } catch {
    return undefined;
  }
  if (!clerkUserId) return undefined;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return user?.id;
}

/**
 * Returns true only if the requesting user has an active Professional or Premium
 * subscription. Admins always return true.
 *
 * Use for project contact details (homeowner phone / email / name).
 */
export async function canViewContactDetails(req: Request): Promise<boolean> {
  if (isAdminSession(req)) return true;

  const userId = await getLocalUserId(req);
  if (!userId) return false;

  const [row] = await db
    .select({ slug: subscriptionPlansTable.slug })
    .from(subscriptionsTable)
    .innerJoin(
      subscriptionPlansTable,
      eq(subscriptionsTable.planId, subscriptionPlansTable.id),
    )
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
      ),
    )
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);

  return CONTACT_VISIBLE_SLUGS.has(row?.slug ?? "");
}

/**
 * Like canViewContactDetails, but also allows the project/resource owner to
 * always see their own contact details regardless of plan.
 */
export async function canViewProjectContacts(
  req: Request,
  ownerUserId: number | null,
): Promise<boolean> {
  if (isAdminSession(req)) return true;

  const userId = await getLocalUserId(req);
  if (!userId) return false;

  if (ownerUserId !== null && userId === ownerUserId) return true;

  const [row] = await db
    .select({ slug: subscriptionPlansTable.slug })
    .from(subscriptionsTable)
    .innerJoin(
      subscriptionPlansTable,
      eq(subscriptionsTable.planId, subscriptionPlansTable.id),
    )
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
      ),
    )
    .orderBy(desc(subscriptionsTable.id))
    .limit(1);

  return CONTACT_VISIBLE_SLUGS.has(row?.slug ?? "");
}

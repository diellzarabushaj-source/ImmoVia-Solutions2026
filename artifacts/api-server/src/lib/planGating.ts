import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  subscriptionsTable,
  subscriptionPlansTable,
  usersTable,
  contactUnlocksTable,
} from "@workspace/db";
import { getAuth } from "@clerk/express";
import type { Request } from "express";

/** Monthly unlock limit per plan. -1 = unlimited. */
export const PLAN_UNLOCK_LIMITS: Record<string, number> = {
  free: 0,
  basic: 20,
  pro: 50,
  premium: -1, // unlimited
  starter: 20,
  professional: 50,
  founding: 5,
};
/** @deprecated use PLAN_UNLOCK_LIMITS */
export const PRO_UNLOCK_LIMIT = 50;

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
export async function getLocalUserId(req: Request): Promise<number | undefined> {
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

/** Returns the active subscription plan slug for a local user ID. */
export async function getProviderPlanSlug(userId: number): Promise<string> {
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
  return row?.slug ?? "free";
}

/**
 * For list views: only Premium providers always see contacts inline.
 * Professional providers must unlock per-project via the unlock endpoint.
 * Admins always return true.
 */
export async function canViewContactDetails(req: Request): Promise<boolean> {
  if (isAdminSession(req)) return true;
  const userId = await getLocalUserId(req);
  if (!userId) return false;
  const slug = await getProviderPlanSlug(userId);
  return slug === "premium";
}

/**
 * For a specific project: only admins, Premium providers, and Basic/Pro providers
 * with an existing unlock row can view contact details.
 * Project owners do NOT get automatic access — the contact card is SP-only.
 */
export async function canViewProjectContacts(
  req: Request,
  projectId: number,
): Promise<boolean> {
  if (isAdminSession(req)) return true;
  const userId = await getLocalUserId(req);
  if (!userId) return false;
  // Project owners do NOT get automatic access — contacts are only for SP unlock flow
  const slug = await getProviderPlanSlug(userId);
  if (slug === "premium") return true;
  if (slug === "free") return false;
  // basic, pro, professional, starter — check for existing unlock row
  const [unlock] = await db
    .select({ id: contactUnlocksTable.id })
    .from(contactUnlocksTable)
    .where(
      and(
        eq(contactUnlocksTable.providerUserId, userId),
        eq(contactUnlocksTable.projectId, projectId),
      ),
    )
    .limit(1);
  return unlock !== undefined;
}

/**
 * Returns contact unlock usage stats for a user in the current billing period.
 * All paid plans get 20 unlocks/period. Premium gets unlimited.
 */
export async function getUnlockStats(
  userId: number,
  periodStart: Date,
): Promise<{ used: number; limit: number; canUnlock: boolean }> {
  const slug = await getProviderPlanSlug(userId);
  if (slug === "premium") return { used: 0, limit: -1, canUnlock: true };
  const limit = PLAN_UNLOCK_LIMITS[slug] ?? 0;
  if (limit === 0) return { used: 0, limit: 0, canUnlock: false };

  const [row] = await db
    .select({ used: sql<number>`count(*)::int` })
    .from(contactUnlocksTable)
    .where(
      and(
        eq(contactUnlocksTable.providerUserId, userId),
        gte(contactUnlocksTable.unlockedAt, periodStart),
      ),
    );

  const used = row?.used ?? 0;
  return { used, limit, canUnlock: used < limit };
}

/** Returns the set of project IDs a Pro provider has already unlocked. */
export async function getUnlockedProjectIds(userId: number): Promise<Set<number>> {
  const rows = await db
    .select({ projectId: contactUnlocksTable.projectId })
    .from(contactUnlocksTable)
    .where(eq(contactUnlocksTable.providerUserId, userId));
  return new Set(rows.map(r => r.projectId));
}

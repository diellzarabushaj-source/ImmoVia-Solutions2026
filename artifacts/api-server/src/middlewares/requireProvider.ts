import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

// requireProvider: must be a signed-in service_provider.
// Also resolves req.userId from the Clerk session → DB user.
export async function requireProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role, accountType: usersTable.accountType })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, auth.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not provisioned. Please complete sign-up." });
    return;
  }

  const isProvider =
    user.accountType === "service_provider" ||
    user.role === "contractor" ||
    user.role === "service_provider";
  if (!isProvider) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.userId = user.id;
  next();
}

// requireUserAdmin: admin via session (set by /api/admin-auth/login).
export async function requireUserAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session.adminAuthenticated === true) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

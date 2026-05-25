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
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, auth.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not provisioned. Please complete sign-up." });
    return;
  }

  if (user.role !== "service_provider") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.userId = user.id;
  next();
}

// requireUserAdmin: admin via DB role or legacy admin session flag.
export async function requireUserAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Legacy admin session flag (admin login form at /admin) still works
  if (req.session?.adminAuthenticated) {
    next();
    return;
  }

  const auth = getAuth(req);
  if (auth?.userId) {
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, auth.userId))
      .limit(1);
    if (user?.role === "admin") {
      req.userId = user.id;
      next();
      return;
    }
  }
  res.status(401).json({ error: "Unauthorized" });
}

import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

// requireAdmin: allows access when the request carries a valid Clerk JWT
// for a DB user with role='admin', OR when the legacy session flag is set
// (backward compatibility for the admin CLI / automated seeding scripts).
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Primary: Clerk JWT + DB role check
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

  // Legacy fallback: express-session flag (admin seeding / migration period)
  if (req.session?.adminAuthenticated) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}

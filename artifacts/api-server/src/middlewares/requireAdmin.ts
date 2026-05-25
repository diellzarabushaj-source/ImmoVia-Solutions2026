import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const ADMIN_EMAILS = new Set(["immovia.rd@gmail.com"]);

// requireAdmin: allows access only when the request carries a valid Clerk JWT
// for a DB user with role='admin'. No session fallback.
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let [user] = await db
    .select({ id: usersTable.id, role: usersTable.role, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, auth.userId))
    .limit(1);

  // Auto-upgrade role for known admin emails
  if (user && ADMIN_EMAILS.has(user.email) && user.role !== "admin") {
    const [upgraded] = await db
      .update(usersTable)
      .set({ role: "admin" })
      .where(eq(usersTable.id, user.id))
      .returning({ id: usersTable.id, role: usersTable.role, email: usersTable.email });
    if (upgraded) user = upgraded;
  }

  if (user?.role === "admin") {
    req.userId = user.id;
    next();
    return;
  }

  res.status(403).json({ error: "Forbidden" });
}

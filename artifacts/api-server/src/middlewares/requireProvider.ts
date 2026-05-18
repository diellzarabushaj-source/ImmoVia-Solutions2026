import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export async function requireProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "service_provider") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export async function requireUserAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Two ways to be admin: classic session flag (admin login form) OR a user with role=admin.
  if (req.session?.adminAuthenticated) {
    next();
    return;
  }
  const userId = req.session?.userId;
  if (userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (user?.role === "admin") {
      next();
      return;
    }
  }
  res.status(401).json({ error: "Unauthorized" });
}

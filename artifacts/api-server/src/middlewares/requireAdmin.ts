import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);

  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, auth.userId))
      .limit(1);

    if (user?.role === "admin") {
      next();
      return;
    }
  } catch (err) {
    req.log.error({ err }, "requireAdmin DB lookup failed");
  }

  res.status(403).json({ error: "Forbidden: admin access required" });
}

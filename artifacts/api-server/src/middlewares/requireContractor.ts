import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export async function requireContractor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

  if (!user || user.accountType !== "service_provider") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.userId = user.id;
  next();
}

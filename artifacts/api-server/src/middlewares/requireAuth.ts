import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Validates the Clerk JWT, resolves the linked DB user, and attaches req.userId.
// All downstream routes/middlewares should read req.userId — never req.session.userId.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, auth.userId))
    .limit(1);

  if (!dbUser) {
    res.status(401).json({ error: "User not provisioned. Please complete sign-up." });
    return;
  }

  req.userId = dbUser.id;
  next();
}

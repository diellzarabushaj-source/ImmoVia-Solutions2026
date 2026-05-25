import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

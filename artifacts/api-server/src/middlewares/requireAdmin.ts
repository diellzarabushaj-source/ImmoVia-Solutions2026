import type { Request, Response, NextFunction } from "express";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session.adminAuthenticated === true) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

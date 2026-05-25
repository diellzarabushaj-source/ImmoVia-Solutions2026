import { Router, type IRouter } from "express";

// Legacy admin session auth routes have been removed.
// Admin access is now exclusively via Clerk JWT + DB role='admin'.
// See requireAdmin middleware.

const router: IRouter = Router();

export default router;

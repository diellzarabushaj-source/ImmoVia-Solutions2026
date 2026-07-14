import { getAuth } from "@clerk/express";
import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

router.post("/admin-auth/login", (_req, res): void => {
  res.status(410).json({
    error: "Legacy admin login has been disabled. Sign in through Clerk.",
  });
});

router.post("/admin-auth/logout", (_req, res): void => {
  res.json({
    ok: true,
    message: "Sign out through Clerk on the client.",
  });
});

router.get("/admin-auth/verify", requireAdmin, (req, res): void => {
  const { userId } = getAuth(req);
  const adminUser = res.locals.adminUser as
    | { id: string; email: string | null; role: string }
    | undefined;

  res.json({
    ok: true,
    userId,
    email: adminUser?.email ?? null,
    role: adminUser?.role ?? "admin",
  });
});

export default router;

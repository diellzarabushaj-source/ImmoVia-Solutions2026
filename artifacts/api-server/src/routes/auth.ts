import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";

declare module "express-session" {
  interface SessionData {
    adminAuthenticated?: boolean;
  }
}

const router: IRouter = Router();

router.post("/admin/auth/login", (req, res): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  const adminUsername = process.env["ADMIN_USERNAME"] ?? "immovia2026";
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "immovia2026";

  if (username === adminUsername && password === adminPassword) {
    req.session.adminAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Session save error");
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ ok: true });
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/admin/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/admin/auth/me", requireAdmin, (req, res): void => {
  res.json({ authenticated: true });
});

export default router;

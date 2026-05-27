import { Router } from "express";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    adminAuthenticated?: boolean;
  }
}

const router = Router();

const ADMIN_USERNAME = "immovia2027";
const ADMIN_HASH = "$2b$12$pEoDPAs89qaePcl8uKhVEelTq7SSIizKN3T46eXcSONBA4MCZFa22";

const loginLimiter = (() => {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  return (ip: string): boolean => {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now > entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return true;
    }
    if (entry.count >= 10) return false;
    entry.count++;
    return true;
  };
})();

router.post("/admin-auth/login", async (req, res): Promise<void> => {
  const ip = (req.ip ?? req.socket.remoteAddress ?? "unknown");
  if (!loginLimiter(ip)) {
    res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    return;
  }

  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const usernameOk = username === ADMIN_USERNAME;
  const passwordOk = usernameOk && await bcrypt.compare(password, ADMIN_HASH);

  if (!usernameOk || !passwordOk) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  req.session.adminAuthenticated = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error." });
      return;
    }
    res.json({ ok: true });
  });
});

router.post("/admin-auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("immovia.sid");
    res.json({ ok: true });
  });
});

router.get("/admin-auth/verify", (req, res): void => {
  if (req.session.adminAuthenticated === true) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

export default router;

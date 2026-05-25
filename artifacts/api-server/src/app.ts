import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

app.set("trust proxy", 1);

// ── Clerk proxy (must be before body parsers — streams raw bytes) ──────────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.openai.com",
          "https://*.clerk.accounts.dev",
          "https://clerk.*.lcl.dev",
          "wss://*.clerk.accounts.dev",
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env["NODE_ENV"] === "production" ? [] : null,
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  }),
);

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api", globalLimiter);

// ── Strict limiter for auth & contact endpoints ───────────────────────────────
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
app.use("/api/auth", strictLimiter);
app.use("/api/contact", strictLimiter);

// ── Session (admin dashboard only) ───────────────────────────────────────────
app.use(
  session({
    name: "immovia.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Clerk middleware ──────────────────────────────────────────────────────────
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  logger.error({ err }, "Unhandled route error");

  function isDbError(e: unknown): boolean {
    if (!(e instanceof Error)) return false;
    const text = `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}`;
    return (
      text.includes("ENOTFOUND") ||
      text.includes("ECONNREFUSED") ||
      text.includes("getaddrinfo") ||
      text.includes("ETIMEDOUT")
    );
  }

  if (isDbError(err)) {
    res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
  } else {
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

export default app;

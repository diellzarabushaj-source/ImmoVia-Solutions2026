import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

app.set("trust proxy", 1);

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

app.use("/api", router);

// Global error handler — catches any unhandled async errors from routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  logger.error({ err }, "Unhandled route error");

  // Detect DB-down by inspecting the full error chain (message + cause)
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

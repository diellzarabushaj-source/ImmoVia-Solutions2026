import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import crypto from "node:crypto";
import { db, projectsTable, companiesTable } from "@workspace/db";

const router: IRouter = Router();

// Publicly visible / "published" status differs per table: projects are
// published as "open", companies (providers) are published as "approved".
const PUBLISHED_PROJECT_STATUS = "open";
const PUBLISHED_COMPANY_STATUS = "approved";
const MAX_RESULTS = 20;
const SHORT_DESC_LEN = 200;

// German labels for the top-level service categories (German is the default market).
// Unknown keys fall back to a humanized form, so this never throws on legacy data.
const CATEGORY_LABELS_DE: Record<string, string> = {
  renovation: "Renovierung & Umbau",
  painting: "Maler & Verputz",
  electrical: "Elektro & Smart Home",
  electric: "Elektro & Smart Home",
  plumbing: "Sanitär & Bad",
  kitchen: "Küche & Schreiner",
  flooring: "Bodenbeläge & Fliesen",
  interior_design: "Innenarchitektur & Home Staging",
  interior: "Innenausbau",
  exterior: "Außenarbeiten",
  cleaning: "Reinigung, Garten & Liegenschaftsdienste",
  other: "Sonstiges",
};

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(key: string | null | undefined): string {
  if (!key) return "";
  return CATEGORY_LABELS_DE[key] ?? humanizeKey(key);
}

function appBaseUrl(): string {
  const explicit = process.env.PUBLIC_APP_URL || process.env.VITE_APP_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");
  return "https://immovia365.ch";
}

// Strip contact details that users may have embedded in free-text fields, so
// the public endpoints never leak email/phone/URLs even if a description holds them.
function scrubPii(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "") // emails
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "") // urls
    .replace(/\+?\d[\d\s()./-]{6,}\d/g, "") // phone-like digit runs
    .replace(/\s{2,}/g, " ")
    .trim();
}

function shortText(value: string | null | undefined, max = SHORT_DESC_LEN): string {
  const clean = scrubPii(value).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "").trim() + "…";
}

function likePattern(value: string): string {
  return `%${value.trim()}%`;
}

// Constant-time comparison via fixed-length digests (independent of input length).
function tokenMatches(provided: string, configured: string): boolean {
  if (!provided) return false;
  const a = crypto.createHash("sha256").update(provided, "utf8").digest();
  const b = crypto.createHash("sha256").update(configured, "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

// API-key guard for external (Chatbase) consumers. Fails closed: if no key is
// configured the endpoints are disabled rather than open. Accepts the key via
// either `Authorization: Bearer <key>` or the `x-api-key` header.
function requireAiApiKey(req: Request, res: Response, next: NextFunction): void {
  const configured = process.env.CHATBASE_ACTIONS_API_KEY?.trim();
  if (!configured) {
    res.status(503).json({ error: "AI search endpoints are not configured" });
    return;
  }
  const authHeader = req.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const apiKey = (req.get("x-api-key") ?? "").trim();
  if (tokenMatches(bearer, configured) || tokenMatches(apiKey, configured)) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Reads a single string field from an untrusted JSON body; ignores non-strings.
function field(body: unknown, key: string): string {
  if (body && typeof body === "object" && key in body) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

// POST /api/ai/search-projects — public, contact-free project results for Chatbase.
router.post("/ai/search-projects", requireAiApiKey, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const city = field(body, "city");
  const category = field(body, "category");
  const service = field(body, "service");
  const budget = field(body, "budget_optional") || field(body, "budget");

  const conditions: SQL[] = [eq(projectsTable.status, PUBLISHED_PROJECT_STATUS)];

  if (city) conditions.push(ilike(projectsTable.city, likePattern(city)));

  for (const term of [category, service].filter(Boolean)) {
    const pattern = likePattern(term);
    const match = or(
      ilike(projectsTable.projectType, pattern),
      ilike(projectsTable.subcategory, pattern),
      ilike(projectsTable.title, pattern),
      ilike(projectsTable.description, pattern)
    );
    if (match) conditions.push(match);
  }

  if (budget) conditions.push(ilike(projectsTable.budget, likePattern(budget)));

  const rows = await db
    .select({
      title: projectsTable.title,
      city: projectsTable.city,
      projectType: projectsTable.projectType,
      description: projectsTable.description,
      id: projectsTable.id,
    })
    .from(projectsTable)
    .where(and(...conditions))
    .orderBy(desc(projectsTable.createdAt))
    .limit(MAX_RESULTS);

  const base = appBaseUrl();
  const results = rows.map((row) => ({
    title: row.title ?? "",
    city: row.city,
    category: categoryLabel(row.projectType),
    short_description: shortText(row.description),
    public_url: `${base}/projects/${row.id}`,
  }));

  res.json({ results });
});

// POST /api/ai/search-providers — public, contact-free provider results for Chatbase.
router.post("/ai/search-providers", requireAiApiKey, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const city = field(body, "city");
  const service = field(body, "service");
  const category = field(body, "category");
  const language = field(body, "language_optional") || field(body, "language");

  const conditions: SQL[] = [eq(companiesTable.status, PUBLISHED_COMPANY_STATUS)];

  if (city) conditions.push(ilike(companiesTable.city, likePattern(city)));

  for (const term of [service, category].filter(Boolean)) {
    const pattern = likePattern(term);
    const match = or(
      sql`EXISTS (SELECT 1 FROM unnest(${companiesTable.serviceTypes}) AS st WHERE st ILIKE ${pattern})`,
      ilike(companiesTable.companyName, pattern),
      ilike(companiesTable.shortDescription, pattern),
      ilike(companiesTable.description, pattern)
    );
    if (match) conditions.push(match);
  }

  if (language) {
    const pattern = likePattern(language);
    conditions.push(
      sql`EXISTS (SELECT 1 FROM unnest(${companiesTable.languages}) AS lng WHERE lng ILIKE ${pattern})`
    );
  }

  const rows = await db
    .select({
      companyName: companiesTable.companyName,
      city: companiesTable.city,
      serviceTypes: companiesTable.serviceTypes,
      shortDescription: companiesTable.shortDescription,
      description: companiesTable.description,
      id: companiesTable.id,
    })
    .from(companiesTable)
    .where(and(...conditions))
    .orderBy(desc(companiesTable.createdAt))
    .limit(MAX_RESULTS);

  const base = appBaseUrl();
  const results = rows.map((row) => ({
    company_name: row.companyName,
    city: row.city,
    services: (row.serviceTypes ?? []).map((s) => categoryLabel(s)),
    short_description: shortText(row.shortDescription || row.description),
    profile_url: `${base}/companies/${row.id}`,
  }));

  res.json({ results });
});

export default router;

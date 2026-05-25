import { Router, type IRouter } from "express";
import { and, eq, asc } from "drizzle-orm";
import { db, portfolioItemsTable } from "@workspace/db";
import { requireContractor } from "../middlewares/requireContractor";

const router: IRouter = Router();

const ALLOWED_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "unsplash.com",
]);

function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/api/storage/objects/")) return true;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

router.get("/portfolio/me", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const items = await db
    .select()
    .from(portfolioItemsTable)
    .where(eq(portfolioItemsTable.userId, userId))
    .orderBy(asc(portfolioItemsTable.sortOrder), asc(portfolioItemsTable.id));
  res.json({ items });
});

router.post("/portfolio", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : null;
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 1000) : null;

  if (!imageUrl || imageUrl.length > 500 || !isAllowedImageUrl(imageUrl)) {
    res.status(400).json({ error: "Invalid imageUrl" });
    return;
  }

  const [item] = await db
    .insert(portfolioItemsTable)
    .values({ userId, imageUrl, title, description })
    .returning();
  res.status(201).json({ item });
});

router.delete("/portfolio/:id", requireContractor, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await db
    .delete(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), eq(portfolioItemsTable.userId, userId)))
    .returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";
import { ObjectStorageService } from "../lib/objectStorage";

const objectStorageService = new ObjectStorageService();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const router: IRouter = Router();

router.get("/admin/categories", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name_de));

  res.json(
    rows.map((r) => ({
      ...r,
      parentId: r.parentId ?? null,
      imageUrl: r.imageUrl ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

router.post("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  const { name, name_de, name_sq, name_en, name_fr, imageUrl, slug, type, active, parentId, sortOrder } = req.body as {
    name?: string;
    name_de?: string;
    name_sq?: string;
    name_en?: string;
    name_fr?: string;
    imageUrl?: string;
    slug?: string;
    type?: string;
    active?: boolean;
    parentId?: number | null;
    sortOrder?: number;
  };

  const resolvedNameDe = name_de || name || "";
  if (!resolvedNameDe || !slug) {
    res.status(400).json({ error: "name (or name_de) and slug are required" });
    return;
  }

  if (parentId != null) {
    const parent = await db
      .select({ id: categoriesTable.id, parentId: categoriesTable.parentId })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, parentId))
      .then((r) => r[0]);
    if (!parent) {
      res.status(400).json({ error: "Parent category not found" });
      return;
    }
    if (parent.parentId != null) {
      res.status(400).json({ error: "Cannot nest more than one level deep" });
      return;
    }
  }

  const [created] = await db
    .insert(categoriesTable)
    .values({
      name: resolvedNameDe,
      name_de: resolvedNameDe || null,
      name_sq: name_sq || null,
      name_en: name_en || null,
      name_fr: name_fr || null,
      imageUrl: imageUrl || null,
      slug,
      type: type ?? "service",
      active: active !== undefined ? active : true,
      parentId: parentId ?? null,
      sortOrder: sortOrder ?? 0,
    })
    .returning();

  res.status(201).json({
    ...created,
    parentId: created!.parentId ?? null,
    imageUrl: created!.imageUrl ?? null,
    createdAt: created!.createdAt.toISOString(),
    updatedAt: created!.updatedAt.toISOString(),
  });
});

router.patch("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { name, name_de, name_sq, name_en, name_fr, imageUrl, slug, type, active, parentId, sortOrder } = req.body as {
    name?: string;
    name_de?: string;
    name_sq?: string;
    name_en?: string;
    name_fr?: string;
    imageUrl?: string;
    slug?: string;
    type?: string;
    active?: boolean;
    parentId?: number | null;
    sortOrder?: number;
  };

  if (parentId != null) {
    if (parentId === id) {
      res.status(400).json({ error: "A category cannot be its own parent" });
      return;
    }
    const parent = await db
      .select({ id: categoriesTable.id, parentId: categoriesTable.parentId })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, parentId))
      .then((r) => r[0]);
    if (!parent) {
      res.status(400).json({ error: "Parent category not found" });
      return;
    }
    if (parent.parentId != null) {
      res.status(400).json({ error: "Cannot nest more than one level deep" });
      return;
    }
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (name_de !== undefined) { patch["name_de"] = name_de || null; patch["name"] = name_de || patch["name"] as string; }
  if (name !== undefined && name_de === undefined) patch["name"] = name;
  if (name_sq !== undefined) patch["name_sq"] = name_sq || null;
  if (name_en !== undefined) patch["name_en"] = name_en || null;
  if (name_fr !== undefined) patch["name_fr"] = name_fr || null;
  if ("imageUrl" in req.body) patch["imageUrl"] = imageUrl || null;
  if (slug !== undefined) patch["slug"] = slug;
  if (type !== undefined) patch["type"] = type;
  if (active !== undefined) patch["active"] = active;
  if ("parentId" in req.body) patch["parentId"] = parentId ?? null;
  if (sortOrder !== undefined) patch["sortOrder"] = sortOrder;

  const [updated] = await db
    .update(categoriesTable)
    .set(patch)
    .where(eq(categoriesTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    ...updated,
    parentId: updated.parentId ?? null,
    imageUrl: updated.imageUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

/**
 * POST /admin/categories/upload-image
 * Admin-only: request a presigned URL to upload a category image directly to GCS.
 * Body: { name, size, contentType }
 * Response: { uploadURL, objectPath }
 */
router.post("/admin/categories/upload-image", requireAdmin, async (req, res): Promise<void> => {
  const { name, size, contentType } = req.body as { name?: string; size?: number; contentType?: string };
  if (!name || typeof size !== "number" || !contentType) {
    res.status(400).json({ error: "Missing name, size, or contentType" });
    return;
  }
  if (size > MAX_UPLOAD_BYTES) {
    res.status(413).json({ error: "File too large (max 8 MB)" });
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    res.status(415).json({ error: "Only JPEG, PNG, WebP and GIF images are allowed" });
    return;
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.delete("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);

  const children = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.parentId, id));

  if (children.length > 0) {
    res.status(409).json({
      error: `This category has ${children.length} subcategory(ies). Remove or reassign them first.`,
    });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).end();
});

export default router;

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/categories", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(
    rows.map((r) => ({
      ...r,
      parentId: r.parentId ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, type, active, parentId } = req.body as {
    name?: string;
    slug?: string;
    type?: string;
    active?: boolean;
    parentId?: number | null;
  };

  if (!name || !slug) {
    res.status(400).json({ error: "name and slug are required" });
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
      name,
      slug,
      type: type ?? "service",
      active: active !== undefined ? active : true,
      parentId: parentId ?? null,
    })
    .returning();

  res.status(201).json({
    ...created,
    parentId: created!.parentId ?? null,
    createdAt: created!.createdAt.toISOString(),
  });
});

router.patch("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { name, slug, type, active, parentId } = req.body as {
    name?: string;
    slug?: string;
    type?: string;
    active?: boolean;
    parentId?: number | null;
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

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch["name"] = name;
  if (slug !== undefined) patch["slug"] = slug;
  if (type !== undefined) patch["type"] = type;
  if (active !== undefined) patch["active"] = active;
  if ("parentId" in req.body) patch["parentId"] = parentId ?? null;

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
    createdAt: updated.createdAt.toISOString(),
  });
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

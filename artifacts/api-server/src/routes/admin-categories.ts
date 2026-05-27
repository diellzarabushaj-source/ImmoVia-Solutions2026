import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/categories", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, description } = req.body as {
    name?: string;
    slug?: string;
    description?: string;
  };

  if (!name || !slug) {
    res.status(400).json({ error: "name and slug are required" });
    return;
  }

  const [created] = await db
    .insert(categoriesTable)
    .values({ name, slug, description: description ?? null })
    .returning();

  res.status(201).json({ ...created, createdAt: created!.createdAt.toISOString() });
});

router.patch("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { name, slug, description } = req.body as {
    name?: string;
    slug?: string;
    description?: string;
  };

  const [updated] = await db
    .update(categoriesTable)
    .set({ ...(name ? { name } : {}), ...(slug ? { slug } : {}), ...(description !== undefined ? { description } : {}) })
    .where(eq(categoriesTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).end();
});

export default router;

import { Router, type IRouter } from "express";
import { eq, isNull, and } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const { type } = req.query as { type?: string };

  const conditions: ReturnType<typeof eq>[] = [eq(categoriesTable.active, true)];
  if (type === "service" || type === "project") {
    conditions.push(eq(categoriesTable.type, type));
  }

  const all = await db
    .select()
    .from(categoriesTable)
    .where(and(...conditions))
    .orderBy(categoriesTable.name);

  const parents = all.filter((c) => c.parentId === null);

  const result = parents.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    active: p.active,
    parentId: p.parentId,
    createdAt: p.createdAt.toISOString(),
    subcategories: all
      .filter((c) => c.parentId === p.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        type: s.type,
        active: s.active,
        parentId: s.parentId,
        createdAt: s.createdAt.toISOString(),
      })),
  }));

  res.json(result);
});

export default router;

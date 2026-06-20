import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, categoriesTable, categorySuggestionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

type Lang = "de" | "en" | "sq" | "fr";

function resolveName(
  row: { name: string; name_de: string | null; name_sq: string | null; name_en: string | null; name_fr: string | null },
  lang: Lang
): string {
  const byLang: Record<Lang, string | null | undefined> = {
    de: row.name_de,
    en: row.name_en,
    sq: row.name_sq,
    fr: row.name_fr,
  };
  return (
    byLang[lang] ||
    row.name_de ||
    row.name_en ||
    row.name_sq ||
    row.name_fr ||
    row.name
  );
}

router.get("/categories", async (req, res): Promise<void> => {
  const { type, lang } = req.query as { type?: string; lang?: string };
  const resolvedLang: Lang = (["de", "en", "sq", "fr"].includes(lang as string) ? lang : "de") as Lang;

  const conditions: ReturnType<typeof eq>[] = [eq(categoriesTable.active, true)];
  if (type === "service" || type === "project") {
    conditions.push(eq(categoriesTable.type, type));
  }

  const all = await db
    .select()
    .from(categoriesTable)
    .where(and(...conditions))
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name_de));

  const parents = all.filter((c) => c.parentId === null);

  const result = parents.map((p) => ({
    id: p.id,
    name: resolveName(p, resolvedLang),
    name_de: p.name_de,
    name_sq: p.name_sq,
    name_en: p.name_en,
    name_fr: p.name_fr,
    imageUrl: p.imageUrl,
    slug: p.slug,
    type: p.type,
    active: p.active,
    sortOrder: p.sortOrder,
    parentId: p.parentId,
    createdAt: p.createdAt.toISOString(),
    subcategories: all
      .filter((c) => c.parentId === p.id)
      .map((s) => ({
        id: s.id,
        name: resolveName(s, resolvedLang),
        name_de: s.name_de,
        name_sq: s.name_sq,
        name_en: s.name_en,
        name_fr: s.name_fr,
        imageUrl: s.imageUrl,
        slug: s.slug,
        type: s.type,
        active: s.active,
        sortOrder: s.sortOrder,
        parentId: s.parentId,
        createdAt: s.createdAt.toISOString(),
      })),
  }));

  res.json(result);
});

router.post("/categories/suggest", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const { name, type } = req.body as { name?: string; type?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (name.trim().length < 3 || name.trim().length > 80) {
    res.status(400).json({ error: "Name must be between 3 and 80 characters" });
    return;
  }
  const resolvedType = type === "project" ? "project" : "service";
  const [row] = await db.insert(categorySuggestionsTable).values({
    name: name.trim(),
    type: resolvedType,
    submittedByUserId: String(userId),
    status: "pending",
  }).returning();
  res.status(201).json({ id: row!.id, name: row!.name, type: row!.type, status: row!.status });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";

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

export default router;

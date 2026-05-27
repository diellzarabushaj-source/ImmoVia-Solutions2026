import { Router, type IRouter } from "express";
import { ilike, or, eq, and, sql } from "drizzle-orm";
import { db, companiesTable, projectsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/search/suggestions", async (req, res): Promise<void> => {
  const { q, tab } = req.query;

  if (typeof q !== "string" || q.trim().length < 2) {
    res.json([]);
    return;
  }

  const query = q.trim();
  const pattern = `%${query}%`;
  const suggestions: string[] = [];

  if (tab === "project") {
    const rows = await db
      .select({ fullName: projectsTable.fullName, description: projectsTable.description, city: projectsTable.city })
      .from(projectsTable)
      .where(
        and(
          or(
            ilike(projectsTable.description, pattern),
            ilike(projectsTable.city, pattern),
            ilike(projectsTable.fullName, pattern)
          ),
          eq(projectsTable.status, "approved")
        )
      )
      .limit(8);

    const seen = new Set<string>();
    for (const row of rows) {
      const snippet = row.description.slice(0, 60).replace(/\s+\S*$/, "").trim();
      if (snippet && !seen.has(snippet)) { seen.add(snippet); suggestions.push(snippet); }
      if (suggestions.length >= 6) break;
    }
    const cityRows = await db
      .selectDistinct({ city: projectsTable.city })
      .from(projectsTable)
      .where(and(ilike(projectsTable.city, pattern), eq(projectsTable.status, "approved")))
      .limit(3);
    for (const r of cityRows) {
      if (!seen.has(r.city)) { seen.add(r.city); suggestions.push(r.city); }
    }
  } else {
    const rows = await db
      .select({ companyName: companiesTable.companyName, city: companiesTable.city })
      .from(companiesTable)
      .where(
        and(
          or(
            ilike(companiesTable.companyName, pattern),
            ilike(companiesTable.city, pattern)
          ),
          eq(companiesTable.status, "approved")
        )
      )
      .limit(8);

    const seen = new Set<string>();
    for (const row of rows) {
      if (!seen.has(row.companyName)) { seen.add(row.companyName); suggestions.push(row.companyName); }
      if (suggestions.length >= 6) break;
    }
    const cityRows = await db
      .selectDistinct({ city: companiesTable.city })
      .from(companiesTable)
      .where(and(ilike(companiesTable.city, pattern), eq(companiesTable.status, "approved")))
      .limit(3);
    for (const r of cityRows) {
      if (!seen.has(r.city)) { seen.add(r.city); suggestions.push(r.city); }
    }
  }

  res.json(suggestions.slice(0, 7));
});

export default router;

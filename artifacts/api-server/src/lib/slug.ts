import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "user";
}

export async function generateUniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let i = 1;
  while (true) {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
    i += 1;
    candidate = `${root}-${i}`;
    if (i > 1000) return `${root}-${Date.now()}`;
  }
}

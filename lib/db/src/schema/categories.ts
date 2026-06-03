import { pgTable, text, serial, timestamp, boolean, integer, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  name_de: text("name_de"),
  name_sq: text("name_sq"),
  name_en: text("name_en"),
  name_fr: text("name_fr"),
  slug: text("slug").notNull(),
  type: text("type").notNull().default("service"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  parentId: integer("parent_id").references((): AnyPgColumn => categoriesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("categories_slug_type_unique").on(table.slug, table.type),
]);

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;

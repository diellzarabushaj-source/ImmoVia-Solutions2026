import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const portfolioItemsTable = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  category: text("category"),
  city: text("city"),
  isBeforeAfter: boolean("is_before_after").default(false),
  projectDate: text("project_date"),
  isFeatured: boolean("is_featured").default(false),
});

export type PortfolioItem = typeof portfolioItemsTable.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItemsTable.$inferInsert;

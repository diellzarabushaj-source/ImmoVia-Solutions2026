import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  title: text("title"),
  projectType: text("project_type").notNull(),
  subcategory: text("subcategory"),
  description: text("description").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  budget: text("budget"),
  timeline: text("timeline"),
  // small | medium | large | premium
  size: text("size").notNull().default("medium"),
  photos: text("photos").array().notNull().default([]),
  files: text("files").array().notNull().default([]),
  // pending | reviewing | matched | completed | cancelled | archived
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

export const customerFavoritesTable = pgTable("customer_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type CustomerFavorite = typeof customerFavoritesTable.$inferSelect;

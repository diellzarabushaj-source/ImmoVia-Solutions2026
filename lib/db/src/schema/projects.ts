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
  description: text("description").notNull(),
  city: text("city").notNull(),
  budget: text("budget"),
  timeline: text("timeline"),
  // small | medium | large | premium
  size: text("size").notNull().default("medium"),
  photos: text("photos").array().notNull().default([]),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

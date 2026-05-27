import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  companyId: integer("company_id"),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = typeof applicationsTable.$inferInsert;

import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  applicantUserId: integer("applicant_user_id"),
  message: text("message"),
  proposedPrice: text("proposed_price"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = typeof applicationsTable.$inferInsert;

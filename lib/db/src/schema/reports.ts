import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  reporterEmail: text("reporter_email"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;
export type InsertReport = typeof reportsTable.$inferInsert;

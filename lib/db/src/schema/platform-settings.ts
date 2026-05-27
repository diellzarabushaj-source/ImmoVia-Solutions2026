import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformSetting = typeof platformSettingsTable.$inferSelect;

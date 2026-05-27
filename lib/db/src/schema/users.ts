import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull().default(""),
  // role: user | admin
  role: text("role").notNull(),
  // account_type: project_poster | service_provider (null for admin)
  accountType: text("account_type"),
  // account_subtype: individual | company (null for admin)
  accountSubtype: text("account_subtype"),
  // Legacy field kept for backward compatibility
  providerType: text("provider_type"),
  fullName: text("full_name").notNull(),
  slug: text("slug").unique(),
  phone: text("phone"),
  city: text("city"),
  language: text("language").notNull().default("en"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  companyName: text("company_name"),
  serviceTypes: text("service_types").array(),
  website: text("website"),
  licenseNumber: text("license_number"),
  yearsExperience: integer("years_experience"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export type PublicUser = Omit<User, "passwordHash" | "clerkUserId">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, clerkUserId: _clerkUserId, ...publicUser } = user;
  return publicUser;
}

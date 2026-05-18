import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  fullName: text("full_name").notNull(),
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

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companiesTable = pgTable("companies", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  serviceTypes: text("service_types").array().notNull(),
  city: text("city").notNull(),
  description: text("description"),
  website: text("website"),
  licenseNumber: text("license_number"),
  yearsExperience: integer("years_experience"),
  workerType: text("worker_type").notNull().default("company"),
  hourlyRate: integer("hourly_rate"),
  profilePhoto: text("profile_photo"),
  galleryPhotos: text("gallery_photos").array(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Extended provider profile fields
  serviceArea: text("service_area"),
  shortDescription: text("short_description"),
  teamSize: integer("team_size"),
  languages: text("languages").array(),
  availability: text("availability"),
  specializations: text("specializations").array(),
  priceType: text("price_type"),
  priceFromChf: numeric("price_from_chf", { precision: 10, scale: 2 }),
  priceUnit: text("price_unit"),
  priceNote: text("price_note"),
  priceIsPublic: boolean("price_is_public").default(false),
  coverImageUrl: text("cover_image_url"),
  logoUrl: text("logo_url"),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;

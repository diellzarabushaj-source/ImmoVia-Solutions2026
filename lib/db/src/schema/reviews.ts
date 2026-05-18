import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull(),
    offerId: integer("offer_id").notNull(),
    authorUserId: integer("author_user_id").notNull(),
    targetUserId: integer("target_user_id").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("one_review_per_offer").on(t.offerId, t.authorUserId)]
);

export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;

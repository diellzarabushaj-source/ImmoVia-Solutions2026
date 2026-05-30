import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("provider_inquiry"),
  companyId: integer("company_id").notNull(),
  customerUserId: integer("customer_user_id").notNull(),
  status: text("status").notNull().default("new"),
  subject: text("subject"),
  lastMessageText: text("last_message_text"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  unreadCountCustomer: integer("unread_count_customer").notNull().default(0),
  unreadCountProvider: integer("unread_count_provider").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const convMessagesTable = pgTable("conv_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderUserId: integer("sender_user_id").notNull(),
  senderRole: text("sender_role").notNull(),
  body: text("body").notNull(),
  messageType: text("message_type").notNull().default("text"),
  attachments: text("attachments").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertConversation = typeof conversationsTable.$inferInsert;
export type ConvMessage = typeof convMessagesTable.$inferSelect;
export type InsertConvMessage = typeof convMessagesTable.$inferInsert;

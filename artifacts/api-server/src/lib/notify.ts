import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export interface NotificationPayload {
  recipientUserId: number;
  type: string;
  title: string;
  message: string;
  relatedProjectId?: number | null;
  relatedCompanyId?: number | null;
}

export async function createNotification(data: NotificationPayload): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      recipientUserId: data.recipientUserId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedProjectId: data.relatedProjectId ?? null,
      relatedCompanyId: data.relatedCompanyId ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create notification");
  }
}

export async function getUserEmail(userId: number): Promise<{ email: string; fullName: string; language: string | null } | null> {
  const [user] = await db
    .select({ email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return user ?? null;
}

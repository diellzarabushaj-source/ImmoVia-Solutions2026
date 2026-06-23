import { Router, type IRouter } from "express";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { db, companiesTable, conversationsTable, convMessagesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendNewMessageNotification } from "../lib/email";

const router: IRouter = Router();

async function getProviderCompanyId(userId: number): Promise<number | null> {
  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;
  const [company] = await db.select({ id: companiesTable.id }).from(companiesTable).where(eq(companiesTable.email, user.email)).limit(1);
  return company?.id ?? null;
}

async function canAccessConversation(convId: number, userId: number): Promise<{ ok: boolean; role: "customer" | "provider" | null }> {
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convId)).limit(1);
  if (!conv) return { ok: false, role: null };
  if (conv.customerUserId === userId) return { ok: true, role: "customer" };
  const companyId = await getProviderCompanyId(userId);
  if (companyId && conv.companyId === companyId) return { ok: true, role: "provider" };
  return { ok: false, role: null };
}

router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const companyId = await getProviderCompanyId(userId);

  const conditions = companyId
    ? or(eq(conversationsTable.customerUserId, userId), eq(conversationsTable.companyId, companyId))
    : eq(conversationsTable.customerUserId, userId);

  const rows = await db
    .select({
      id: conversationsTable.id,
      type: conversationsTable.type,
      companyId: conversationsTable.companyId,
      customerUserId: conversationsTable.customerUserId,
      status: conversationsTable.status,
      subject: conversationsTable.subject,
      lastMessageText: conversationsTable.lastMessageText,
      lastMessageAt: conversationsTable.lastMessageAt,
      unreadCountCustomer: conversationsTable.unreadCountCustomer,
      unreadCountProvider: conversationsTable.unreadCountProvider,
      createdAt: conversationsTable.createdAt,
      updatedAt: conversationsTable.updatedAt,
      companyName: companiesTable.companyName,
      companyCity: companiesTable.city,
      customerName: usersTable.fullName,
    })
    .from(conversationsTable)
    .leftJoin(companiesTable, eq(conversationsTable.companyId, companiesTable.id))
    .leftJoin(usersTable, eq(conversationsTable.customerUserId, usersTable.id))
    .where(conditions!)
    .orderBy(desc(conversationsTable.updatedAt));

  res.json({ conversations: rows, myCompanyId: companyId });
});

router.post("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;
  const companyId = typeof body.companyId === "number" ? body.companyId : null;
  const firstMessage = typeof body.message === "string" ? body.message.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : null;
  const type = typeof body.type === "string" ? body.type : "provider_inquiry";

  if (!companyId || !firstMessage || firstMessage.length < 2) {
    res.status(400).json({ error: "companyId and message are required" });
    return;
  }

  const [company] = await db.select({ id: companiesTable.id }).from(companiesTable).where(eq(companiesTable.id, companyId)).limit(1);
  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const existing = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.companyId, companyId), eq(conversationsTable.customerUserId, userId)))
    .limit(1);

  let convId: number;
  if (existing[0]) {
    convId = existing[0].id;
  } else {
    const [conv] = await db.insert(conversationsTable).values({
      type,
      companyId,
      customerUserId: userId,
      status: "new",
      subject,
      lastMessageText: firstMessage.slice(0, 100),
      lastMessageAt: new Date(),
      unreadCountProvider: 1,
    }).returning({ id: conversationsTable.id });
    convId = conv.id;
  }

  await db.insert(convMessagesTable).values({
    conversationId: convId,
    senderUserId: userId,
    senderRole: "customer",
    body: firstMessage,
    messageType: "text",
    attachments: [],
  });

  await db.update(conversationsTable).set({
    lastMessageText: firstMessage.slice(0, 100),
    lastMessageAt: new Date(),
    updatedAt: new Date(),
    unreadCountProvider: 1,
  }).where(eq(conversationsTable.id, convId));

  // Notify provider about new inquiry (fire-and-forget)
  void (async () => {
    try {
      const [customer] = await db
        .select({ fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      const [co] = await db
        .select({ email: companiesTable.email, companyName: companiesTable.companyName })
        .from(companiesTable)
        .where(eq(companiesTable.id, companyId))
        .limit(1);
      if (!co?.email) return;
      const [providerUser] = await db
        .select({ id: usersTable.id, fullName: usersTable.fullName, language: usersTable.language })
        .from(usersTable)
        .where(eq(usersTable.email, co.email))
        .limit(1);
      await sendNewMessageNotification({
        recipientEmail: co.email,
        recipientName: providerUser?.fullName ?? co.companyName ?? "Provider",
        recipientUserId: providerUser?.id ?? 0,
        senderName: customer?.fullName ?? "Customer",
        preview: firstMessage,
        offerId: convId,
        isProvider: true,
        language: providerUser?.language,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to send new conversation notification");
    }
  })();

  res.status(201).json({ conversationId: convId });
});

router.get("/conversations/unread-count", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const companyId = await getProviderCompanyId(userId);

  const conditions = companyId
    ? or(eq(conversationsTable.customerUserId, userId), eq(conversationsTable.companyId, companyId))
    : eq(conversationsTable.customerUserId, userId);

  const rows = await db
    .select({
      unreadCountCustomer: conversationsTable.unreadCountCustomer,
      unreadCountProvider: conversationsTable.unreadCountProvider,
      cid: conversationsTable.companyId,
    })
    .from(conversationsTable)
    .where(conditions!);

  let total = 0;
  for (const row of rows) {
    if (companyId && row.cid === companyId) {
      total += row.unreadCountProvider;
    } else {
      total += row.unreadCountCustomer;
    }
  }

  res.json({ total });
});

router.get("/conversations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const convId = Number(req.params.id);
  if (!Number.isFinite(convId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const access = await canAccessConversation(convId, userId);
  if (!access.ok) { res.status(403).json({ error: "Forbidden" }); return; }

  const [conv] = await db
    .select({
      id: conversationsTable.id,
      type: conversationsTable.type,
      companyId: conversationsTable.companyId,
      customerUserId: conversationsTable.customerUserId,
      status: conversationsTable.status,
      subject: conversationsTable.subject,
      lastMessageText: conversationsTable.lastMessageText,
      lastMessageAt: conversationsTable.lastMessageAt,
      unreadCountCustomer: conversationsTable.unreadCountCustomer,
      unreadCountProvider: conversationsTable.unreadCountProvider,
      createdAt: conversationsTable.createdAt,
      companyName: companiesTable.companyName,
      companyCity: companiesTable.city,
      customerName: usersTable.fullName,
    })
    .from(conversationsTable)
    .leftJoin(companiesTable, eq(conversationsTable.companyId, companiesTable.id))
    .leftJoin(usersTable, eq(conversationsTable.customerUserId, usersTable.id))
    .where(eq(conversationsTable.id, convId))
    .limit(1);

  const messages = await db
    .select({
      id: convMessagesTable.id,
      conversationId: convMessagesTable.conversationId,
      senderUserId: convMessagesTable.senderUserId,
      senderRole: convMessagesTable.senderRole,
      body: convMessagesTable.body,
      messageType: convMessagesTable.messageType,
      attachments: convMessagesTable.attachments,
      createdAt: convMessagesTable.createdAt,
      senderName: usersTable.fullName,
    })
    .from(convMessagesTable)
    .leftJoin(usersTable, eq(convMessagesTable.senderUserId, usersTable.id))
    .where(eq(convMessagesTable.conversationId, convId))
    .orderBy(asc(convMessagesTable.createdAt));

  if (access.role === "customer") {
    await db.update(conversationsTable).set({ unreadCountCustomer: 0 }).where(eq(conversationsTable.id, convId));
  } else {
    await db.update(conversationsTable).set({ unreadCountProvider: 0 }).where(eq(conversationsTable.id, convId));
  }

  res.json({ conversation: conv, messages, myRole: access.role });
});

router.post("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const convId = Number(req.params.id);
  if (!Number.isFinite(convId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const access = await canAccessConversation(convId, userId);
  if (!access.ok) { res.status(403).json({ error: "Forbidden" }); return; }

  const body = req.body as Record<string, unknown>;
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const attachments = Array.isArray(body.attachments) ? (body.attachments as string[]).slice(0, 5) : [];

  if (!text && attachments.length === 0) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  const [msg] = await db.insert(convMessagesTable).values({
    conversationId: convId,
    senderUserId: userId,
    senderRole: access.role!,
    body: text || "[Attachment]",
    messageType: attachments.length > 0 ? "file" : "text",
    attachments,
  }).returning();

  const unreadUpdate = access.role === "customer"
    ? { unreadCountProvider: 1 }
    : { unreadCountCustomer: 1 };

  await db.update(conversationsTable).set({
    lastMessageText: (text || "[Attachment]").slice(0, 100),
    lastMessageAt: new Date(),
    updatedAt: new Date(),
    ...unreadUpdate,
  }).where(eq(conversationsTable.id, convId));

  // Notify the other party (fire-and-forget)
  void (async () => {
    try {
      const [conv] = await db
        .select({
          companyId: conversationsTable.companyId,
          customerUserId: conversationsTable.customerUserId,
        })
        .from(conversationsTable)
        .where(eq(conversationsTable.id, convId))
        .limit(1);
      if (!conv) return;

      const [sender] = await db
        .select({ fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!sender) return;

      if (access.role === "customer") {
        // Customer sent → notify provider
        const [co] = await db
          .select({ email: companiesTable.email, companyName: companiesTable.companyName })
          .from(companiesTable)
          .where(eq(companiesTable.id, conv.companyId))
          .limit(1);
        if (!co?.email) return;
        const [providerUser] = await db
          .select({ id: usersTable.id, fullName: usersTable.fullName, language: usersTable.language })
          .from(usersTable)
          .where(eq(usersTable.email, co.email))
          .limit(1);
        await sendNewMessageNotification({
          recipientEmail: co.email,
          recipientName: providerUser?.fullName ?? co.companyName ?? "Provider",
          recipientUserId: providerUser?.id ?? 0,
          senderName: sender.fullName ?? "Customer",
          preview: text || "[Attachment]",
          offerId: convId,
          isProvider: true,
          language: providerUser?.language,
        });
      } else {
        // Provider sent → notify customer
        const [customer] = await db
          .select({ email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
          .from(usersTable)
          .where(eq(usersTable.id, conv.customerUserId))
          .limit(1);
        if (!customer?.email) return;
        await sendNewMessageNotification({
          recipientEmail: customer.email,
          recipientName: customer.fullName ?? "Customer",
          recipientUserId: conv.customerUserId,
          senderName: sender.fullName ?? "Provider",
          preview: text || "[Attachment]",
          offerId: convId,
          isProvider: false,
          language: customer.language,
        });
      }
    } catch (err) {
      req.log.error({ err }, "Failed to send conversation message notification");
    }
  })();

  res.status(201).json({ message: msg });
});

export default router;

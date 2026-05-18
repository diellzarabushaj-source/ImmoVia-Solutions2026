import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, messagesTable, offersTable, projectsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function canAccessOffer(
  offerId: number,
  userId: number
): Promise<boolean> {
  const [offer] = await db
    .select()
    .from(offersTable)
    .where(eq(offersTable.id, offerId))
    .limit(1);
  if (!offer) return false;

  // Provider who sent the offer
  if (offer.providerUserId === userId) return true;

  // Client who owns the project
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, offer.projectId))
    .limit(1);
  if (project?.ownerUserId === userId) return true;

  // Admin
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return user?.role === "admin";
}

// GET /messages/:offerId — list messages for an offer thread
router.get("/messages/:offerId", requireAuth, async (req, res): Promise<void> => {
  const offerId = Number(req.params.offerId);
  if (!Number.isFinite(offerId)) {
    res.status(400).json({ error: "Invalid offerId" });
    return;
  }
  const userId = req.session.userId!;
  if (!(await canAccessOffer(offerId, userId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select({
      id: messagesTable.id,
      offerId: messagesTable.offerId,
      senderUserId: messagesTable.senderUserId,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
      senderName: usersTable.fullName,
    })
    .from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.senderUserId, usersTable.id))
    .where(eq(messagesTable.offerId, offerId))
    .orderBy(asc(messagesTable.createdAt));

  res.json({ messages: rows });
});

// POST /messages/:offerId — send a message
router.post("/messages/:offerId", requireAuth, async (req, res): Promise<void> => {
  const offerId = Number(req.params.offerId);
  if (!Number.isFinite(offerId)) {
    res.status(400).json({ error: "Invalid offerId" });
    return;
  }
  const userId = req.session.userId!;
  if (!(await canAccessOffer(offerId, userId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const content =
    typeof body.content === "string" ? body.content.trim() : "";
  if (content.length === 0) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }
  if (content.length > 2000) {
    res.status(400).json({ error: "Message too long (max 2000 chars)" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ offerId, senderUserId: userId, content })
    .returning();

  res.status(201).json({ message: msg });
});

export default router;

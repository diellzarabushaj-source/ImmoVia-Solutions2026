import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullName: usersTable.fullName,
      role: usersTable.role,
      providerType: usersTable.providerType,
      city: usersTable.city,
      language: usersTable.language,
      verified: usersTable.verified,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { action } = req.body as { action?: "approve" | "suspend" | "reactivate" | "delete" };

  if (!action) {
    res.status(400).json({ error: "action is required" });
    return;
  }

  if (action === "delete") {
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.status(204).end();
    return;
  }

  const verifiedValue =
    action === "approve" || action === "reactivate" ? true
    : action === "suspend" ? false
    : undefined;

  if (verifiedValue === undefined) {
    res.status(400).json({ error: "invalid action" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ verified: verifiedValue })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;

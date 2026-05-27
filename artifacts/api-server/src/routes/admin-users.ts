import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
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

export default router;

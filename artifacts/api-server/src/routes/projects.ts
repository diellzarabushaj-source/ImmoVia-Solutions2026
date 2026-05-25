import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, projectsTable, usersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  CreateProjectBody,
  UpdateProjectBody,
  UpdateProjectParams,
  GetProjectParams,
  DeleteProjectParams,
  ListProjectsResponse,
  GetProjectResponse,
  UpdateProjectResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { sendNewProjectNotification } from "../lib/email";

const router: IRouter = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db
    .select()
    .from(projectsTable)
    .orderBy(sql`${projectsTable.createdAt} desc`);
  res.json(ListProjectsResponse.parse(projects));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid project body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rawBody = req.body as Record<string, unknown>;
  const size = typeof rawBody.size === "string" && ["small", "medium", "large", "premium"].includes(rawBody.size)
    ? (rawBody.size as string)
    : "medium";

  // Optionally link project to the authenticated user (guests may submit without signing in)
  let ownerUserId: number | null = null;
  const clerkAuth = getAuth(req);
  if (clerkAuth?.userId) {
    const [dbUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkAuth.userId))
      .limit(1);
    ownerUserId = dbUser?.id ?? null;
  }

  const [project] = await db.insert(projectsTable).values({
    ownerUserId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    projectType: parsed.data.projectType,
    description: parsed.data.description,
    city: parsed.data.city,
    budget: parsed.data.budget ?? null,
    timeline: parsed.data.timeline ?? null,
    photos: (parsed.data as Record<string, unknown>).photos as string[] ?? [],
    size,
    status: "pending",
  }).returning();

  void sendNewProjectNotification({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    projectType: parsed.data.projectType,
    description: parsed.data.description,
    city: parsed.data.city,
    budget: parsed.data.budget ?? null,
    timeline: parsed.data.timeline ?? null,
  });

  res.status(201).json(GetProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, string> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.description != null) updateData.description = parsed.data.description;

  const [project] = await db
    .update(projectsTable)
    .set(updateData)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { eq, count, sql, or } from "drizzle-orm";
import { db, projectsTable, companiesTable, usersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [
    [totalProjects], [pendingProjects], [totalCompanies], [pendingCompanies],
    [totalUsers], [serviceProviders], [projectPosters], [approvedCompanies], [openProjects],
  ] =
    await Promise.all([
      db.select({ count: count() }).from(projectsTable),
      db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.status, "pending")),
      db.select({ count: count() }).from(companiesTable),
      db.select({ count: count() }).from(companiesTable).where(eq(companiesTable.status, "pending")),
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "service_provider")),
      db.select({ count: count() }).from(usersTable).where(
        or(eq(usersTable.role, "client"), eq(usersTable.role, "homeowner"))
      ),
      db.select({ count: count() }).from(companiesTable).where(eq(companiesTable.status, "approved")),
      db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.status, "matched")),
    ]);

  const projectsByTypeRaw = await db
    .select({ label: projectsTable.projectType, count: count() })
    .from(projectsTable)
    .groupBy(projectsTable.projectType);

  const projectsByStatusRaw = await db
    .select({ label: projectsTable.status, count: count() })
    .from(projectsTable)
    .groupBy(projectsTable.status);

  const recentProjectsRaw = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.fullName,
      status: projectsTable.status,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .orderBy(sql`${projectsTable.createdAt} desc`)
    .limit(5);

  const recentCompaniesRaw = await db
    .select({
      id: companiesTable.id,
      title: companiesTable.companyName,
      status: companiesTable.status,
      createdAt: companiesTable.createdAt,
    })
    .from(companiesTable)
    .orderBy(sql`${companiesTable.createdAt} desc`)
    .limit(5);

  const recentActivity = [
    ...recentProjectsRaw.map((p) => ({ ...p, type: "project" as const })),
    ...recentCompaniesRaw.map((c) => ({ ...c, type: "company" as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json({
    totalProjects: totalProjects?.count ?? 0,
    pendingProjects: pendingProjects?.count ?? 0,
    totalCompanies: totalCompanies?.count ?? 0,
    pendingCompanies: pendingCompanies?.count ?? 0,
    totalUsers: totalUsers?.count ?? 0,
    serviceProviders: serviceProviders?.count ?? 0,
    projectPosters: projectPosters?.count ?? 0,
    approvedCompanies: approvedCompanies?.count ?? 0,
    openProjects: openProjects?.count ?? 0,
    projectsByType: projectsByTypeRaw.map((r) => ({ label: r.label, count: r.count })),
    projectsByStatus: projectsByStatusRaw.map((r) => ({ label: r.label, count: r.count })),
    recentActivity: recentActivity.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
  });
});

export default router;

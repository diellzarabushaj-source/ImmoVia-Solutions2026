import { Router, type IRouter } from "express";
import { eq, sql, and, ilike } from "drizzle-orm";
import { db, companiesTable } from "@workspace/db";
import {
  CreateCompanyBody,
  UpdateCompanyBody,
  UpdateCompanyParams,
  GetCompanyParams,
  DeleteCompanyParams,
  ListCompaniesResponse,
  GetCompanyResponse,
  UpdateCompanyResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { sendNewCompanyNotification } from "../lib/email";

const router: IRouter = Router();

router.get("/companies", async (req, res): Promise<void> => {
  const { city, type, status, workerType } = req.query;
  const conditions = [];
  if (typeof city === "string" && city.trim()) {
    conditions.push(ilike(companiesTable.city, `%${city.trim()}%`));
  }
  if (typeof type === "string" && type.trim()) {
    conditions.push(sql`${type.trim()} = ANY(${companiesTable.serviceTypes})`);
  }
  if (typeof status === "string" && status.trim()) {
    conditions.push(eq(companiesTable.status, status.trim()));
  }
  if (typeof workerType === "string" && workerType.trim()) {
    conditions.push(eq(companiesTable.workerType, workerType.trim()));
  }
  const companies = await db
    .select()
    .from(companiesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${companiesTable.createdAt} desc`);
  res.json(ListCompaniesResponse.parse(companies));
});

router.post("/companies", async (req, res): Promise<void> => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid company body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [company] = await db.insert(companiesTable).values({
    companyName: parsed.data.companyName,
    contactName: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    serviceTypes: parsed.data.serviceTypes,
    city: parsed.data.city,
    description: parsed.data.description ?? null,
    website: parsed.data.website ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    yearsExperience: parsed.data.yearsExperience ?? null,
    workerType: parsed.data.workerType ?? "company",
    hourlyRate: parsed.data.hourlyRate ?? null,
    profilePhoto: parsed.data.profilePhoto ?? null,
    status: "pending",
  }).returning();

  void sendNewCompanyNotification({
    companyName: parsed.data.companyName,
    contactName: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    serviceTypes: parsed.data.serviceTypes,
    city: parsed.data.city,
    description: parsed.data.description ?? null,
    website: parsed.data.website ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    yearsExperience: parsed.data.yearsExperience ?? null,
  });

  res.status(201).json(GetCompanyResponse.parse(company));
});

router.get("/companies/:id", async (req, res): Promise<void> => {
  const params = GetCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, params.data.id));

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(GetCompanyResponse.parse(company));
});

router.patch("/companies/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, string> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.description != null) updateData.description = parsed.data.description;

  const [company] = await db
    .update(companiesTable)
    .set(updateData)
    .where(eq(companiesTable.id, params.data.id))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(UpdateCompanyResponse.parse(company));
});

router.delete("/companies/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(companiesTable)
    .where(eq(companiesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

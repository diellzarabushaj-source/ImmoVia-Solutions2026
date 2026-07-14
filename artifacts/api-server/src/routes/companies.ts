import { Router, type IRouter } from "express";
import { desc, eq, sql, and, ilike } from "drizzle-orm";
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
  CreateRegistrationCheckoutParams,
  CreateRegistrationCheckoutBody,
  VerifyRegistrationPaymentParams,
  VerifyRegistrationPaymentBody,
  CreatePackageCheckoutParams,
  CreatePackageCheckoutBody,
  VerifyPackagePaymentParams,
  VerifyPackagePaymentBody,
} from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import { requireAdmin } from "../middlewares/requireAdmin";
import { sendNewCompanyNotification, sendProviderApprovedNotification, sendProviderSuspendedNotification, sendCompanyRejectedNotification } from "../lib/email";
import { createNotification } from "../lib/notify";
import { usersTable } from "@workspace/db";
import type { Request } from "express";

const router: IRouter = Router();

// Personal contact details (email/phone) are only returned to authenticated
// users. Public/unauthenticated requests get them redacted to empty strings so
// the data never leaves the server, while keeping the response schema valid.
function isAuthenticated(req: Request): boolean {
  if (req.session?.adminAuthenticated === true) return true;
  try {
    return Boolean(getAuth(req)?.userId);
  } catch {
    return false;
  }
}

function redactContact<T extends { email: string; phone: string }>(company: T): T {
  return { ...company, email: "", phone: "" };
}

router.get("/companies", async (req, res): Promise<void> => {
  const { city, type, status, workerType, featuredOnHome } = req.query;
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
  if (featuredOnHome === "true") {
    conditions.push(eq(companiesTable.featuredOnHome, true));
  }
  const companies = await db
    .select()
    .from(companiesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      sql`CASE WHEN ${companiesTable.planType} = 'premium' THEN 3 WHEN ${companiesTable.planType} = 'pro' THEN 2 WHEN ${companiesTable.planType} = 'basic' THEN 1 ELSE 0 END DESC`,
      desc(companiesTable.createdAt),
    );
  const payload = isAuthenticated(req) ? companies : companies.map(redactContact);
  res.json(ListCompaniesResponse.parse(payload));
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
    customServiceTags: parsed.data.customServiceTags?.map((tag: string) =>
      tag.trim().slice(0, 100)
    ).filter((tag: string) => tag.length > 0) ?? null,
    city: parsed.data.city,
    description: parsed.data.description ?? null,
    website: parsed.data.website ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    yearsExperience: parsed.data.yearsExperience ?? null,
    workerType: parsed.data.workerType ?? "company",
    hourlyRate: parsed.data.hourlyRate ?? null,
    profilePhoto: parsed.data.profilePhoto ?? null,
    planType: parsed.data.planType ?? null,
    status: "pending", // requires admin approval before appearing in the directory
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

  const payload = isAuthenticated(req) ? company : redactContact(company);
  res.json(GetCompanyResponse.parse(payload));
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

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  if (parsed.data.featuredOnHome != null) updateData.featuredOnHome = parsed.data.featuredOnHome;

  const [company] = await db
    .update(companiesTable)
    .set(updateData)
    .where(eq(companiesTable.id, params.data.id))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  // Notify service provider when admin changes company status
  if (parsed.data.status) {
    void (async () => {
      try {
        const [providerUser] = await db
          .select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName, language: usersTable.language })
          .from(usersTable)
          .where(eq(usersTable.email, company.email))
          .limit(1);
        if (!providerUser) return;
        const newStatus = parsed.data.status!;
        if (newStatus === "approved") {
          await createNotification({
            recipientUserId: providerUser.id,
            type: "provider_approved",
            title: "Ihr Profil wurde freigegeben",
            message: `Ihr Unternehmensprofil (${company.companyName}) ist jetzt aktiv und für Kunden sichtbar.`,
            relatedCompanyId: company.id,
          });
          await sendProviderApprovedNotification({
            providerEmail: providerUser.email,
            providerName: providerUser.fullName,
            companyName: company.companyName,
            language: providerUser.language,
          });
        } else if (newStatus === "rejected") {
          await createNotification({
            recipientUserId: providerUser.id,
            type: "provider_suspended",
            title: "Regjistrimi nuk u aprovua",
            message: `Aplikimi i kompanisë (${company.companyName}) nuk u aprovua.`,
            relatedCompanyId: company.id,
          });
          await sendCompanyRejectedNotification({
            providerEmail: providerUser.email,
            providerName: providerUser.fullName,
            companyName: company.companyName,
            language: providerUser.language,
          });
        } else if (newStatus === "suspended") {
          await createNotification({
            recipientUserId: providerUser.id,
            type: "provider_suspended",
            title: "Ihr Profil wurde deaktiviert",
            message: `Ihr Profil (${company.companyName}) wurde vorübergehend deaktiviert.`,
            relatedCompanyId: company.id,
          });
          await sendProviderSuspendedNotification({
            providerEmail: providerUser.email,
            providerName: providerUser.fullName,
            companyName: company.companyName,
            language: providerUser.language,
          });
        }
      } catch (err) {
        req.log.error({ err }, "Failed to send company status notification");
      }
    })();
  }

  res.json(UpdateCompanyResponse.parse(company));
});

router.post("/companies/:id/registration-checkout", (_req, res): void => {
  res.status(503).json({
    error: "Online payments are temporarily unavailable while a Kosovo bank integration is being prepared.",
    code: "PAYMENTS_DISABLED",
  });
});

router.post("/companies/:id/registration-payment/verify", (_req, res): void => {
  res.json({ paid: false, reason: "payments_disabled" });
});

router.post("/companies/:id/package-checkout", (_req, res): void => {
  res.status(503).json({
    error: "Online payments are temporarily unavailable while a Kosovo bank integration is being prepared.",
    code: "PAYMENTS_DISABLED",
  });
});

router.post("/companies/:id/package-payment/verify", (_req, res): void => {
  res.json({ paid: false, reason: "payments_disabled" });
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

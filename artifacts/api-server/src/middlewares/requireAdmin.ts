import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

const DEFAULT_ADMIN_EMAIL = "immovia.rd@gmail.com";

function getAllowedAdminEmails(): Set<string> {
  const configured = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(",");

  const source = configured || DEFAULT_ADMIN_EMAIL;

  return new Set(
    source
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const role =
      typeof user.publicMetadata?.role === "string"
        ? user.publicMetadata.role.toLowerCase()
        : "";

    const allowedEmails = getAllowedAdminEmails();
    const userEmails = user.emailAddresses.map((entry) =>
      entry.emailAddress.trim().toLowerCase(),
    );

    const isAdmin =
      role === "admin" || userEmails.some((email) => allowedEmails.has(email));

    if (!isAdmin) {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }

    const primaryEmail =
      user.emailAddresses.find(
        (entry) => entry.id === user.primaryEmailAddressId,
      )?.emailAddress ?? userEmails[0] ?? null;

    res.locals.adminUser = {
      id: user.id,
      email: primaryEmail,
      role: role || "admin",
    };

    next();
  } catch {
    res.status(503).json({ error: "Unable to verify administrator access" });
  }
}

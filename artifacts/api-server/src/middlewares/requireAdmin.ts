import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

const ADMIN_EMAIL = "diellzarabushaj@gmail.com";

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

    const userEmails = user.emailAddresses.map((entry) =>
      entry.emailAddress.trim().toLowerCase(),
    );

    const isAdmin = role === "admin" || userEmails.includes(ADMIN_EMAIL);

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

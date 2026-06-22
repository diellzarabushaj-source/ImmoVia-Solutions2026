import { Router } from "express";
import { createClient } from "@sanity/client";

const router = Router();

const PROJECT_ID = process.env["VITE_SANITY_PROJECT_ID"];
const DATASET = process.env["VITE_SANITY_DATASET"] ?? "production";
const API_VERSION = process.env["VITE_SANITY_API_VERSION"] ?? "2024-01-01";

function getSanityClient() {
  if (!PROJECT_ID) throw new Error("VITE_SANITY_PROJECT_ID is not configured");
  return createClient({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION, useCdn: true });
}

const LEGAL_PAGE_QUERY = `*[_type == "legalPage" && pageId == $pageId][0]`;
const FAQ_PAGE_QUERY = `*[_type == "faqPage"][0]`;

router.get("/legal/:pageId", async (req, res) => {
  const { pageId } = req.params;
  if (!["terms", "privacy", "faq"].includes(pageId as string)) {
    res.status(400).json({ error: "Invalid page ID" });
    return;
  }
  try {
    const client = getSanityClient();
    const page =
      pageId === "faq"
        ? await client.fetch(FAQ_PAGE_QUERY)
        : await client.fetch(LEGAL_PAGE_QUERY, { pageId });
    if (!page) {
      res.status(404).json({ error: "Page not found in Sanity" });
      return;
    }
    res.json(page);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch legal/faq page from Sanity");
    res.status(502).json({ error: "Failed to fetch page from Sanity" });
  }
});

export default router;

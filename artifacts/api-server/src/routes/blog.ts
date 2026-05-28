import { Router } from "express";
import { createClient } from "@sanity/client";

const router = Router();

const PROJECT_ID = process.env["VITE_SANITY_PROJECT_ID"];
const DATASET = process.env["VITE_SANITY_DATASET"] ?? "production";
const API_VERSION = process.env["VITE_SANITY_API_VERSION"] ?? "2024-01-01";

const BLOG_LIST_QUERY = `
  *[_type == "blogPost" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    category,
    publishedAt
  }
`;

const BLOG_POST_QUERY = `
  *[_type == "blogPost" && slug.current == $slug && status == "published"][0] {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    category,
    publishedAt,
    body
  }
`;

function getSanityClient() {
  if (!PROJECT_ID) throw new Error("VITE_SANITY_PROJECT_ID is not configured");
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    useCdn: true,
  });
}

router.get("/blog", async (req, res) => {
  try {
    const client = getSanityClient();
    const posts = await client.fetch(BLOG_LIST_QUERY);
    res.json(posts ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blog posts from Sanity");
    res.status(502).json({ error: "Failed to fetch blog posts" });
  }
});

router.get("/blog/:slug", async (req, res) => {
  try {
    const client = getSanityClient();
    const post = await client.fetch(BLOG_POST_QUERY, { slug: req.params["slug"] });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(post);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blog post from Sanity");
    res.status(502).json({ error: "Failed to fetch blog post" });
  }
});

export default router;

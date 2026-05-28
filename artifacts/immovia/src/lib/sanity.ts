import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export type SanityImageRef = {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  hotspot?: { x: number; y: number; height: number; width: number };
  alt?: string;
  caption?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PortableTextBlock = any;

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const DATASET = (import.meta.env.VITE_SANITY_DATASET as string | undefined) ?? "production";
const API_VERSION = (import.meta.env.VITE_SANITY_API_VERSION as string | undefined) ?? "2024-01-01";

export const isSanityConfigured = Boolean(PROJECT_ID);

// Client used ONLY for building image URLs (no API calls made).
let _imageBuilder: ReturnType<typeof imageUrlBuilder> | null = null;

function getImageBuilder() {
  if (!_imageBuilder && PROJECT_ID) {
    const client = createClient({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION, useCdn: true });
    _imageBuilder = imageUrlBuilder(client);
  }
  return _imageBuilder;
}

export function urlFor(source: SanityImageRef) {
  const builder = getImageBuilder();
  if (!builder) throw new Error("Sanity project ID not configured");
  return builder.image(source);
}

export interface BlogPostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  mainImage?: SanityImageRef;
  category?: string;
  publishedAt?: string;
}

export interface BlogPostFull extends BlogPostSummary {
  body?: PortableTextBlock[];
}

// All data fetching goes through the Express API proxy — no CORS issues.
export async function fetchBlogList(): Promise<BlogPostSummary[]> {
  const res = await fetch("/api/blog");
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json() as Promise<BlogPostSummary[]>;
}

export async function fetchBlogPost(slug: string): Promise<BlogPostFull | null> {
  const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch blog post");
  return res.json() as Promise<BlogPostFull>;
}

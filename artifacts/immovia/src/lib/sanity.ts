import { createClient, type SanityClient } from "@sanity/client";
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

let _client: SanityClient | null = null;

function getClient(): SanityClient {
  if (!_client) {
    if (!PROJECT_ID) throw new Error("VITE_SANITY_PROJECT_ID is not set");
    _client = createClient({
      projectId: PROJECT_ID,
      dataset: DATASET,
      apiVersion: API_VERSION,
      useCdn: true,
    });
  }
  return _client;
}

export function urlFor(source: SanityImageRef) {
  const client = getClient();
  return imageUrlBuilder(client).image(source);
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

export const BLOG_LIST_QUERY = `
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

export const BLOG_POST_QUERY = `
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

export async function fetchBlogList(): Promise<BlogPostSummary[]> {
  return getClient().fetch<BlogPostSummary[]>(BLOG_LIST_QUERY);
}

export async function fetchBlogPost(slug: string): Promise<BlogPostFull | null> {
  return getClient().fetch<BlogPostFull | null>(BLOG_POST_QUERY, { slug });
}

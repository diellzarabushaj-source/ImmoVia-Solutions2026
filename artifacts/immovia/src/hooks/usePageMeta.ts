import { useEffect } from "react";
import { useLocation } from "wouter";

const APP_URL = (
  import.meta.env.VITE_APP_URL || window.location.origin
).replace(/\/$/, "");
const DEFAULT_TITLE = "ImmoVia365";
const DEFAULT_DESCRIPTION =
  "ImmoVia365 — the platform connecting homeowners with vetted renovation and construction professionals across Albania, Kosovo, Germany, and Switzerland.";
const DEFAULT_OG_IMAGE = `${APP_URL}/og-share.png`;

export interface PageMetaOptions {
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
  noindex?: boolean;
}

function setMetaName(name: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProp(property: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function usePageMeta({
  title,
  description,
  ogImage,
  noindex = false,
}: PageMetaOptions = {}): void {
  const [location] = useLocation();

  useEffect(() => {
    const resolvedTitle = title ?? DEFAULT_TITLE;
    const resolvedDesc = description ?? DEFAULT_DESCRIPTION;
    const resolvedImage = ogImage ?? DEFAULT_OG_IMAGE;
    const canonicalUrl = `${APP_URL}${location}`;

    document.title = resolvedTitle;

    setMetaName("description", resolvedDesc);
    setMetaName("robots", noindex ? "noindex, nofollow" : "index, follow");
    setMetaName("twitter:title", resolvedTitle);
    setMetaName("twitter:description", resolvedDesc);
    setMetaName("twitter:image", resolvedImage);

    setMetaProp("og:title", resolvedTitle);
    setMetaProp("og:description", resolvedDesc);
    setMetaProp("og:url", canonicalUrl);
    setMetaProp("og:image", resolvedImage);

    setCanonical(canonicalUrl);
  }, [title, description, ogImage, noindex, location]);
}

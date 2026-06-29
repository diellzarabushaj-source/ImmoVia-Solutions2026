import { useState, useEffect } from "react";

export async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function resolveStorageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  if (src.startsWith("/api")) return src;
  return `/api/storage${src}`;
}

export function useLogoBase64(): string | null {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    fetchAsBase64("/logo-color.png").then(b => setLogo(b ?? null));
  }, []);
  return logo;
}

export function useBase64Images(storagePaths: (string | null | undefined)[]): (string | null)[] {
  const [images, setImages] = useState<(string | null)[]>([]);
  const key = storagePaths.map(p => p ?? "").join("|");
  useEffect(() => {
    const resolved = storagePaths.map(resolveStorageSrc).filter(Boolean) as string[];
    if (!resolved.length) { setImages([]); return; }
    let cancelled = false;
    Promise.all(resolved.map(fetchAsBase64)).then(result => {
      if (!cancelled) setImages(result);
    });
    return () => { cancelled = true; };
  }, [key]);
  return images;
}

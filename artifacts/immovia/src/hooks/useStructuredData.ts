import { useEffect } from "react";

const SCRIPT_ID = "page-structured-data";

export const APP_URL = (
  import.meta.env.VITE_APP_URL || window.location.origin
).replace(/\/$/, "");

export function useStructuredData(schema: object | object[] | null): void {
  const serialized = schema ? JSON.stringify(schema) : null;

  useEffect(() => {
    if (!serialized) {
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) existing.remove();
      return;
    }

    let el = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = SCRIPT_ID;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = serialized;

    return () => {
      const toRemove = document.getElementById(SCRIPT_ID);
      if (toRemove) toRemove.remove();
    };
  }, [serialized]);
}

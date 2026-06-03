import { useListCategories } from "@workspace/api-client-react";
import type { CategoryNested, CategoryNestedItem } from "@workspace/api-client-react";
import { useLanguage } from "@/lib/language-context";

export type { CategoryNested, CategoryNestedItem };

export interface NormTag {
  key: string;
  label: string;
  imageUrl?: string | null;
}

export interface NormCategory {
  key: string;
  label: string;
  imageUrl?: string | null;
  subcategories: NormTag[];
}

function apiToNorm(apiCats: CategoryNested[]): NormCategory[] {
  return apiCats.map((cat) => ({
    key: cat.slug,
    label: cat.name,
    imageUrl: cat.imageUrl ?? null,
    subcategories: cat.subcategories.map((sub) => ({
      key: sub.slug,
      label: sub.name,
      imageUrl: sub.imageUrl ?? null,
    })),
  }));
}

export function useCategories(type?: "service" | "project") {
  const { language } = useLanguage();
  const params: Record<string, string> = { lang: language };
  if (type) params["type"] = type;

  const { data, isLoading, isError } = useListCategories(params);

  const categories: NormCategory[] = data ? apiToNorm(data) : [];

  return { categories, isLoading, isError };
}

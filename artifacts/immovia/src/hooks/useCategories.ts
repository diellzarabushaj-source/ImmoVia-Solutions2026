import { useListCategories } from "@workspace/api-client-react";
import type { CategoryNested, CategoryNestedItem } from "@workspace/api-client-react";

export type { CategoryNested, CategoryNestedItem };

export interface NormTag {
  key: string;
  label: string;
}

export interface NormCategory {
  key: string;
  label: string;
  subcategories: NormTag[];
}

function apiToNorm(apiCats: CategoryNested[]): NormCategory[] {
  return apiCats.map((cat) => ({
    key: cat.slug,
    label: cat.name,
    subcategories: cat.subcategories.map((sub) => ({
      key: sub.slug,
      label: sub.name,
    })),
  }));
}

export function useCategories(type?: "service" | "project") {
  const params = type ? { type } : undefined;
  const { data, isLoading, isError } = useListCategories(params);

  const categories: NormCategory[] = data ? apiToNorm(data) : [];

  return { categories, isLoading, isError };
}

import { useListCategories } from "@workspace/api-client-react";
import type { CategoryNested, CategoryNestedItem } from "@workspace/api-client-react";
import { CATEGORIES, getCategoryLabel, getTagLabel, type Lang } from "@/lib/categories";

export type { CategoryNested, CategoryNestedItem };

export interface NormTag {
  key: string;
  label: (lang: Lang) => string;
}

export interface NormCategory {
  key: string;
  label: (lang: Lang) => string;
  subcategories: NormTag[];
}

function fallbackCategories(): NormCategory[] {
  return CATEGORIES.map((cat) => ({
    key: cat.key,
    label: (lang: Lang) => getCategoryLabel(cat, lang),
    subcategories: cat.tags.map((tag) => ({
      key: tag.key,
      label: (lang: Lang) => getTagLabel(tag, lang),
    })),
  }));
}

function apiToNorm(apiCats: CategoryNested[]): NormCategory[] {
  return apiCats.map((cat) => {
    const fallback = CATEGORIES.find((c) => c.key === cat.slug);
    const subcategories: NormTag[] =
      cat.subcategories.length > 0
        ? cat.subcategories.map((sub) => {
            const fbTag = fallback?.tags.find((t) => t.key === sub.slug);
            return {
              key: sub.slug,
              label: (lang: Lang) =>
                fbTag ? getTagLabel(fbTag, lang) : sub.name,
            };
          })
        : (fallback?.tags ?? []).map((tag) => ({
            key: tag.key,
            label: (lang: Lang) => getTagLabel(tag, lang),
          }));

    return {
      key: cat.slug,
      label: (lang: Lang) =>
        fallback ? getCategoryLabel(fallback, lang) : cat.name,
      subcategories,
    };
  });
}

export function useCategories() {
  const { data, isLoading, isError } = useListCategories();

  const categories: NormCategory[] =
    data && data.length > 0 ? apiToNorm(data) : fallbackCategories();

  return { categories, isLoading, isError, fromApi: !!(data && data.length > 0) };
}

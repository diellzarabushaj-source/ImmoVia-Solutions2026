import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MapPin, Clock, FileText, X, ArrowUpDown,
  ChevronDown, Lock, Hammer, Paintbrush, Zap, Wrench,
  ChefHat, Layers, Sofa, Leaf, HelpCircle, Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { CATEGORIES, getCategoryLabel, resolveCategoryLabel, type Lang } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { ProjectCard } from "@/components/project/ProjectCard";

const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "oldest", labelKey: "sortOldest" },
];

export default function Projects() {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const { user } = useAuth();
  usePageMeta({ title: `${t.listings.title ?? "Browse Projects"} — ImmoVia365`, description: t.listings.subtitle ?? undefined });
  const search = useSearch();
  const [, navigate] = useLocation();

  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(search).get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState(() => new URLSearchParams(search).get("type") ?? "");
  const [cityFilter, setCityFilter] = useState(() => new URLSearchParams(search).get("city") ?? "");
  const [sizeFilter, setSizeFilter] = useState(() => new URLSearchParams(search).get("size") ?? "");
  const [budgetFilter, setBudgetFilter] = useState(() => new URLSearchParams(search).get("budget") ?? "");
  const [sortBy, setSortBy] = useState(() => new URLSearchParams(search).get("sort") ?? "newest");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    const p = new URLSearchParams(search);
    setSearchTerm(p.get("q") ?? "");
    setTypeFilter(p.get("type") ?? "");
    setCityFilter(p.get("city") ?? "");
    setSizeFilter(p.get("size") ?? "");
    setBudgetFilter(p.get("budget") ?? "");
    setSortBy(p.get("sort") ?? "newest");
  }, [search]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (searchTerm) p.set("q", searchTerm);
    if (typeFilter) p.set("type", typeFilter);
    if (cityFilter) p.set("city", cityFilter);
    if (sizeFilter) p.set("size", sizeFilter);
    if (budgetFilter) p.set("budget", budgetFilter);
    if (sortBy !== "newest") p.set("sort", sortBy);
    const next = p.toString();
    if (next !== searchRef.current) navigate(`?${next}`, { replace: true });
  }, [searchTerm, typeFilter, cityFilter, sizeFilter, budgetFilter, sortBy, navigate]);

  const { data: projects, isLoading, isError } = useListProjects();

  const open = useMemo(
    () => (projects ?? []).filter(p => p.status === "open"),
    [projects]
  );

  const displayList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const c = cityFilter.trim().toLowerCase();
    const list = open.filter(p => {
      if (q && !(
        p.projectType.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )) return false;
      if (typeFilter && p.projectType !== typeFilter) return false;
      if (sizeFilter && p.size !== sizeFilter) return false;
      if (budgetFilter && p.budget !== budgetFilter) return false;
      if (c && !p.city.toLowerCase().includes(c)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [open, searchTerm, typeFilter, cityFilter, sizeFilter, budgetFilter, sortBy]);

  const hasFilters = !!(searchTerm || typeFilter || cityFilter || sizeFilter || budgetFilter);
  const activeFiltersCount = [!!searchTerm, !!typeFilter, !!cityFilter, !!sizeFilter, !!budgetFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setCityFilter("");
    setSizeFilter("");
    setBudgetFilter("");
    setSortBy("newest");
    setPage(1);
  };

  // Reset to page 1 when filters or sort changes
  useEffect(() => { setPage(1); }, [searchTerm, typeFilter, cityFilter, sizeFilter, budgetFilter, sortBy]);

  const totalPages = user ? Math.ceil(displayList.length / ITEMS_PER_PAGE) : 1;
  const paginatedList = user ? displayList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE) : displayList.slice(0, 6);
  const visibleProjects = paginatedList;
  const gatedProjects = !user && displayList.length > 6 ? displayList.slice(6, 9) : [];

  const goToPage = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);


  return (
    <div className="flex flex-col min-h-screen bg-muted/20">

      {/* ── SEARCH HERO ── */}
      <div className="bg-foreground text-white py-10 md:py-14 overflow-x-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{t.listings.title ?? "Browse Projects"}</h1>
            <p className="text-white/60 text-base">{t.listings.subtitle ?? "Find renovation and construction projects to apply for"}</p>
          </div>

          {/* Big search bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <input
              placeholder={t.listings.filterCity ?? "Search by type, city, or keyword…"}
              className="w-full pl-12 pr-10 h-14 text-base bg-white text-foreground border-0 shadow-xl rounded-2xl outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Service type pills — edge-to-edge horizontal scroll */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            <button
              onClick={() => setTypeFilter("")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                !typeFilter
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
              }`}
            >
              {t.companies.all ?? "All"}
            </button>
            {categories.filter(cat => cat.key !== "other").map(cat => (
              <button
                key={cat.key}
                onClick={() => setTypeFilter(prev => prev === cat.key ? "" : cat.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  typeFilter === cat.key
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                }`}
              >
                {cat.label(language as Lang)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-3">

          {/* City filter */}
          <div className="relative flex items-center flex-1 min-w-[180px] sm:flex-initial">
            <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              placeholder={t.listings.cityFilterPlaceholder ?? t.companies.cityPlaceholder ?? "Filter by city…"}
              className="pl-9 pr-16 h-10 text-sm w-full sm:w-56 rounded-lg border border-border bg-white outline-none focus:ring-1 focus:ring-primary"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
            />
            {cityFilter ? (
              <button
                onClick={() => setCityFilter("")}
                className="absolute right-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={t.listings.clearFilters ?? "Clear"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {/* Size filter */}
          <div className="relative">
            <select
              value={sizeFilter}
              onChange={e => setSizeFilter(e.target.value)}
              className="appearance-none bg-white border border-border rounded-lg px-3 pr-7 py-1.5 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t.listings.filterAllSizes ?? "All sizes"}</option>
              <option value="small">{t.listings.sizeSm}</option>
              <option value="medium">{t.listings.sizeMd}</option>
              <option value="large">{t.listings.sizeLg}</option>
              <option value="premium">{t.listings.sizePremium}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Budget filter */}
          <div className="relative">
            <select
              value={budgetFilter}
              onChange={e => setBudgetFilter(e.target.value)}
              className="appearance-none bg-white border border-border rounded-lg px-3 pr-7 py-1.5 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t.listings.filterAllBudgets ?? "All budgets"}</option>
              <option value="under-10k">{"< 10k"}</option>
              <option value="10k-50k">{"10k – 50k"}</option>
              <option value="50k-100k">{"50k – 100k"}</option>
              <option value="100k-500k">{"100k – 500k"}</option>
              <option value="over-500k">{"> 500k"}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative ml-auto">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-border rounded-lg pl-8 pr-8 py-1.5 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "newest"
                    ? (t.listings.sortNewest ?? "Newest first")
                    : (t.listings.sortOldest ?? "Oldest first")}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <X className="h-3 w-3" />
              {t.listings.clearFilters ?? "Clear filters"} ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="container mx-auto px-4 py-8">

        {/* Count bar */}
        {!isLoading && !isError && (
          <p className="text-sm text-muted-foreground mb-6">
            {displayList.length} {displayList.length === 1 ? (t.listings.result ?? "result") : (t.listings.results ?? "results")}
            {typeFilter && <> · <span className="text-primary font-medium">{resolveCategoryLabel(typeFilter, language as Lang)}</span></>}
          </p>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
                <div className="flex gap-3 items-start">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full mt-1" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-16 bg-destructive/5 rounded-2xl text-destructive">
            <p>{t.common.error}</p>
          </div>
        )}

        {/* No results */}
        {!isLoading && !isError && displayList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white rounded-2xl border border-dashed border-border"
          >
            <Search className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {hasFilters ? (t.listings.noResultsFilter ?? "No projects match your filters") : (t.listings.results ?? "No projects yet")}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {hasFilters
                ? (t.listings.noResultsFilterHint ?? "Try adjusting your filters or search terms")
                : (t.listings.noResultsHint ?? "Check back soon — new projects are posted every day")}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {t.listings.clearFilters ?? "Clear all filters"}
              </Button>
            )}
          </motion.div>
        )}

        {/* Project grid */}
        {!isLoading && !isError && displayList.length > 0 && (
          <div className="relative">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
            >
              <AnimatePresence>
                {visibleProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination — logged-in users only */}
            {user && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="h-9 px-4 rounded-lg border border-border text-sm font-medium transition-all hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                >
                  ← {t.listings.sortOldest ? "Zurück" : "Prev"}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`h-9 w-9 rounded-lg border text-sm font-medium transition-all ${
                      p === page
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="h-9 px-4 rounded-lg border border-border text-sm font-medium transition-all hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                >
                  Weiter →
                </button>
              </div>
            )}

            {/* Gate for non-logged-in users */}
            {!user && displayList.length > 6 && (
              <div className="relative mt-5">
                <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-muted/20 z-10 pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
                  {gatedProjects.map((project) => (
                    <div key={`ghost-${project.id}`}>
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="bg-white/95 backdrop-blur-sm border border-border rounded-2xl px-8 py-8 text-center shadow-lg max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-5">{t.listings.gateLabel}</p>
                    <Link href="/signup?account_type=service_provider">
                      <Button size="lg" className="w-full" data-testid="projects-gate-cta">
                        {t.listings.gateCta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

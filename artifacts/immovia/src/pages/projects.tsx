import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MapPin, Clock, FileText, X, ArrowUpDown,
  ChevronDown, Lock, Hammer, Building2, Sofa, TreePine,
  Wrench, Plug, Briefcase, Crosshair,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  renovation: Hammer,
  construction: Building2,
  interior: Sofa,
  exterior: TreePine,
  plumbing: Wrench,
  electric: Plug,
  other: Briefcase,
};

const SIZE_COLORS: Record<string, string> = {
  small: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  large: "bg-indigo-50 text-indigo-700",
  premium: "bg-primary/10 text-primary",
};

const SERVICE_OPTIONS = [
  "renovation", "construction", "interior", "exterior", "plumbing", "electric",
];

const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "oldest", labelKey: "sortOldest" },
];

function getPostedLabel(createdAt: string, listings: { today: string; yesterday: string; daysAgo: string }): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return listings.today;
  if (diffDays === 1) return listings.yesterday;
  return `${diffDays} ${listings.daysAgo}`;
}

type Project = {
  id: number;
  projectType: string;
  description: string;
  city: string;
  budget?: string | null;
  size?: string | null;
  createdAt: string;
  status: string;
};

function ProjectCard({ project, t }: {
  project: Project;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const Icon = SERVICE_ICONS[project.projectType] ?? Briefcase;
  const sz = project.size ?? "medium";
  const sizeKey = ({ small: "sizeSm", medium: "sizeMd", large: "sizeLg", premium: "sizePremium" } as Record<string, keyof typeof t.listings>)[sz] ?? "sizeMd";
  const sizeLabel = t.listings[sizeKey] as string;
  const sizeColor = SIZE_COLORS[sz] ?? SIZE_COLORS.medium;
  const typeLabel = (t.offers as Record<string, string>)[project.projectType] ?? project.projectType;
  const postedLabel = getPostedLabel(project.createdAt, t.listings);

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden h-full cursor-pointer group">
        <div className="px-5 pt-5 pb-4 border-b border-border/50 flex gap-3 items-start">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm capitalize leading-tight group-hover:text-primary transition-colors">{typeLabel}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>{project.city}</span>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sizeColor}`}>{sizeLabel}</span>
        </div>
        <div className="px-5 py-4 flex-1 flex flex-col gap-3">
          <p className="text-sm text-foreground/75 leading-relaxed line-clamp-2">{project.description}</p>
          <div className="flex items-center justify-between mt-auto">
            {project.budget ? (
              <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
                <FileText className="h-3.5 w-3.5" />
                <span>{project.budget}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{t.companies?.contractBased ?? "Contract-based"}</span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {postedLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Projects() {
  const { t } = useLanguage();
  usePageMeta({ title: `${t.listings.title ?? "Browse Projects"} — ImmoVia`, description: t.listings.subtitle ?? undefined });
  const { user } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();

  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(search).get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState(() => new URLSearchParams(search).get("type") ?? "");
  const [cityFilter, setCityFilter] = useState(() => new URLSearchParams(search).get("city") ?? "");
  const [sizeFilter, setSizeFilter] = useState(() => new URLSearchParams(search).get("size") ?? "");
  const [budgetFilter, setBudgetFilter] = useState(() => new URLSearchParams(search).get("budget") ?? "");
  const [sortBy, setSortBy] = useState(() => new URLSearchParams(search).get("sort") ?? "newest");
  const [userCity, setUserCity] = useState<string>(() => {
    try { return localStorage.getItem("immovia_user_city") ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    if (userCity) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "ImmoVia/1.0" } }
          );
          const data = await res.json() as { address?: { city?: string; town?: string; village?: string; county?: string } };
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? "";
          if (city) {
            setUserCity(city);
            try { localStorage.setItem("immovia_user_city", city); } catch {}
          }
        } catch { /* silent */ }
      },
      () => { /* silent — user denied */ },
      { timeout: 8000, maximumAge: 3600000 }
    );
  }, [userCity]);

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

  const open = useMemo(() => (projects ?? []).filter(p => p.status === "open"), [projects]);

  const matchesNonCity = (p: typeof open[number]) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      p.projectType.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchType = !typeFilter || p.projectType === typeFilter;
    const matchSize = !sizeFilter || p.size === sizeFilter;
    const matchBudget = !budgetFilter || p.budget === budgetFilter;
    return matchSearch && matchType && matchSize && matchBudget;
  };

  const sortList = (list: typeof open) => {
    const byDate = (a: typeof open[number], b: typeof open[number]) =>
      sortBy === "oldest"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (!userCity || cityFilter || sortBy === "oldest") return [...list].sort(byDate);
    const uc = userCity.toLowerCase();
    return [...list].sort((a, b) => {
      const aNear = a.city.toLowerCase() === uc ? 0 : 1;
      const bNear = b.city.toLowerCase() === uc ? 0 : 1;
      if (aNear !== bNear) return aNear - bNear;
      return byDate(a, b);
    });
  };

  const filtered = useMemo(() => {
    const list = open.filter(p => {
      const matchCity = !cityFilter || p.city.toLowerCase().includes(cityFilter.toLowerCase());
      return matchesNonCity(p) && matchCity;
    });
    return sortList(list);
  }, [open, searchTerm, typeFilter, cityFilter, sizeFilter, budgetFilter, sortBy, userCity]);

  // Fallback list (ignores cityFilter) — shown when explicit city filter yields zero matches.
  const fallbackWithoutCity = useMemo(() => {
    if (!cityFilter || filtered.length > 0) return [];
    return sortList(open.filter(matchesNonCity));
  }, [open, cityFilter, filtered.length, searchTerm, typeFilter, sizeFilter, budgetFilter, sortBy, userCity]);

  const isCityFallback = cityFilter && filtered.length === 0 && fallbackWithoutCity.length > 0;
  const displayList = isCityFallback ? fallbackWithoutCity : filtered;

  const hasFilters = !!(searchTerm || typeFilter || cityFilter || sizeFilter || budgetFilter);
  const activeFiltersCount = [!!searchTerm, !!typeFilter, !!cityFilter, !!sizeFilter, !!budgetFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setCityFilter("");
    setSizeFilter("");
    setBudgetFilter("");
    setSortBy("newest");
  };

  const visibleProjects = user ? displayList : displayList.slice(0, 6);
  const gatedProjects = !user && displayList.length > 6 ? displayList.slice(6, 9) : [];

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
            {SERVICE_OPTIONS.map(svc => (
              <button
                key={svc}
                onClick={() => setTypeFilter(prev => prev === svc ? "" : svc)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  typeFilter === svc
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                }`}
              >
                {(t.offers as Record<string, string>)[svc] ?? svc}
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
            ) : userCity ? (
              <button
                onClick={() => setCityFilter(userCity)}
                className="absolute right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10"
                title={t.listings.useMyLocation ?? "Use my location"}
                aria-label={t.listings.useMyLocation ?? "Use my location"}
              >
                <Crosshair className="h-3 w-3" />
                <span className="hidden sm:inline">{userCity}</span>
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
            {filtered.length} {filtered.length === 1 ? (t.listings.result ?? "result") : (t.listings.results ?? "results")}
            {typeFilter && <> · <span className="text-primary font-medium">{(t.offers as Record<string, string>)[typeFilter] ?? typeFilter}</span></>}
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

        {/* City fallback banner */}
        {!isLoading && !isError && isCityFallback && (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">
                {(t.listings.noProjectsInCity ?? "No projects in {city} yet").replace("{city}", cityFilter)}
              </p>
              <p className="text-muted-foreground mt-0.5">
                {t.listings.showingAllInstead ?? "Showing all open projects instead."}
              </p>
            </div>
            <button
              onClick={() => setCityFilter("")}
              className="text-xs text-primary hover:underline font-medium flex-shrink-0 self-center"
            >
              {t.listings.clearFilters ?? "Clear filters"}
            </button>
          </div>
        )}

        {/* Near you indicator */}
        {!isLoading && !isError && !isCityFallback && !cityFilter && userCity && displayList.some(p => p.city.toLowerCase() === userCity.toLowerCase()) && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>
              {(t.listings.sortedNearYou ?? "Showing projects near {city} first").replace("{city}", userCity)}
            </span>
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
                    <ProjectCard project={project} t={t} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Gate for non-logged-in users */}
            {!user && displayList.length > 6 && (
              <div className="relative mt-5">
                <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-muted/20 z-10 pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
                  {gatedProjects.map((project) => (
                    <div key={`ghost-${project.id}`}>
                      <ProjectCard project={project} t={t} />
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

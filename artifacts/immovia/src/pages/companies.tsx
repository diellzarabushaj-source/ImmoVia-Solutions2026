import { useState, useEffect, useMemo, useRef } from "react";
import { useSearch, Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { useAuth } from "@/contexts/AuthContext";
import { useListCompanies } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, MapPin, CalendarDays, Globe, Mail, Phone,
  Clock, FileText, User, Building2, SlidersHorizontal,
  ArrowUpDown, X, ChevronDown, LocateFixed, Loader2, ArrowRight, Lock, MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

import { useCategories } from "@/hooks/useCategories";
import { ProviderCard } from "@/components/provider/ProviderCard";



const KNOWN_CITIES = [
  // Albania
  "Tiranë", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Korçë", "Fier", "Berat", "Lushnjë", "Pogradec", "Gjirokastër", "Kavajë", "Kukës",
  // Kosovo
  "Prishtinë", "Prizren", "Pejë", "Mitrovicë", "Gjilan", "Ferizaj", "Gjakovë",
  // Germany
  "Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hannover", "Nürnberg", "Duisburg", "Bochum", "Wuppertal", "Bonn", "Bielefeld", "Mannheim", "Karlsruhe", "Augsburg", "Wiesbaden", "Mönchengladbach", "Gelsenkirchen", "Aachen", "Braunschweig", "Kiel", "Chemnitz", "Halle", "Magdeburg", "Freiburg", "Rostock", "Lübeck", "Oberhausen", "Erfurt", "Mainz",
  // Switzerland
  "Zürich", "Genf", "Basel", "Bern", "Lausanne", "Winterthur", "Luzern", "St. Gallen", "Lugano", "Biel", "Thun", "Köniz", "La Chaux-de-Fonds", "Schaffhausen", "Freiburg", "Chur", "Vernier", "Neuchâtel", "Uster", "Sion",
  // France
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Nîmes", "Aix-en-Provence", "Angers", "Villeurbanne", "Metz", "Clermont-Ferrand", "Tours", "Amiens", "Limoges", "Annecy", "Perpignan",
];

const SORT_OPTIONS = [
  { value: "default", labelKey: "sortDefault" },
  { value: "price_asc", labelKey: "sortPriceAsc" },
  { value: "price_desc", labelKey: "sortPriceDesc" },
  { value: "experience", labelKey: "sortExperience" },
];

const PLAN_RANK: Record<string, number> = { premium: 3, pro: 2, professional: 2, basic: 1 };

export default function Companies() {
  const { t, language } = useLanguage();
  const { categories } = useCategories("service");
  const { user } = useAuth();
  usePageMeta({
    title: "Geprüfte Dienstleister in der Schweiz | ImmoVia365",
    description: "Finden Sie geprüfte Handwerker und Dienstleister für Renovierung, Bau, Reinigung, Umzug und mehr. Jetzt Angebote in Zürich, Bern, Basel und weiteren Schweizer Städten einholen.",
  });
  useStructuredData([
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "ImmoVia365 — Dienstleister-Verzeichnis",
      "description": "Verzeichnis geprüfter Handwerker und Dienstleister für Renovierung, Bau, Reinigung, Umzug und mehr in der Schweiz.",
      "url": `${APP_URL}/companies`,
      "areaServed": "CH"
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Dienstleister", "item": `${APP_URL}/companies` }
      ]
    }
  ]);
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeServices, setActiveServices] = useState<string[]>(
    () => params.get("service")?.split(",").filter(Boolean) ?? []
  );
  const [workerTypeFilter, setWorkerTypeFilter] = useState<"" | "individual" | "company">(() => {
    const wt = params.get("workerType") ?? "";
    return (wt === "individual" || wt === "company") ? wt : "";
  });
  const [cityFilter, setCityFilter] = useState(() => params.get("city") ?? "");
  const [sortBy, setSortBy] = useState(() => params.get("sort") ?? "default");
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityHighlight, setCityHighlight] = useState(-1);
  const cityRef = useRef<HTMLDivElement>(null);

  // Inbound: sync URL → state (handles external navigation e.g. home page service cards)
  useEffect(() => {
    const p = new URLSearchParams(search);
    setActiveServices(p.get("service")?.split(",").filter(Boolean) ?? []);
    const wt = p.get("workerType") ?? "";
    setWorkerTypeFilter((wt === "individual" || wt === "company") ? wt : "");
    setCityFilter(p.get("city") ?? "");
    setSortBy(p.get("sort") ?? "default");
  }, [search]);

  // Outbound: sync state → URL (preserves shareable filter state)
  const searchRef = useRef(search);
  searchRef.current = search;
  useEffect(() => {
    const p = new URLSearchParams();
    if (activeServices.length) p.set("service", activeServices.join(","));
    if (cityFilter) p.set("city", cityFilter);
    if (workerTypeFilter) p.set("workerType", workerTypeFilter);
    if (sortBy !== "default") p.set("sort", sortBy);
    const next = p.toString();
    if (next !== searchRef.current) {
      navigate(`?${next}`, { replace: true });
    }
  }, [activeServices, cityFilter, workerTypeFilter, sortBy, navigate]);

  // Close city dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
        setCityHighlight(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Try silent auto-detect on mount (only fires if permission already granted)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.permissions?.query({ name: "geolocation" }).then(result => {
      if (result.state === "granted") {
        detectCity();
      }
    }).catch(() => {/* permissions API not available — skip */});
  }, []);

  const detectCity = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          if (city) setCityFilter(city);
        } catch {
          setGeoError(true);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setGeoError(true);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const { data: companies, isLoading, isError } = useListCompanies();
  const approved = useMemo(() => companies?.filter(c => c.status === "approved") ?? [], [companies]);

  // City suggestions: companies cities first (ranked), then known cities
  const citySuggestions = useMemo(() => {
    const q = cityFilter.toLowerCase().trim();
    if (!q) return [];
    const fromData = [...new Set(approved.map(c => c.city))];
    const all = [...new Set([...fromData, ...KNOWN_CITIES])];
    return all
      .filter(c => c.toLowerCase().includes(q) && c.toLowerCase() !== q)
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        const aInData = fromData.includes(a) ? 0 : 1;
        const bInData = fromData.includes(b) ? 0 : 1;
        return aInData - bInData;
      })
      .slice(0, 8);
  }, [cityFilter, approved]);

  const filtered = useMemo(() => {
    let list = approved.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        c.companyName.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        c.serviceTypes.some(s => s.toLowerCase().includes(term)) ||
        (c.description ?? "").toLowerCase().includes(term);
      const matchService = !activeServices.length || activeServices.some(s => c.serviceTypes.includes(s));
      const matchType = !workerTypeFilter || c.workerType === workerTypeFilter;
      const matchCity = !cityFilter || c.city.toLowerCase().includes(cityFilter.toLowerCase());
      return matchSearch && matchService && matchType && matchCity;
    });

    // Plan tier is ALWAYS the primary sort: Premium → Professional → Basic → unranked
    list = [...list].sort((a, b) => {
      const pa = PLAN_RANK[(a.planType ?? "").toLowerCase()] ?? 0;
      const pb = PLAN_RANK[(b.planType ?? "").toLowerCase()] ?? 0;
      if (pb !== pa) return pb - pa;
      // Secondary sort within same tier
      if (sortBy === "price_asc") return (a.hourlyRate ?? 9999) - (b.hourlyRate ?? 9999);
      if (sortBy === "price_desc") return (b.hourlyRate ?? 0) - (a.hourlyRate ?? 0);
      if (sortBy === "experience") return (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0);
      return 0;
    });

    return list;
  }, [approved, searchTerm, activeServices, workerTypeFilter, cityFilter, sortBy]);

  const activeFiltersCount = [activeServices.length > 0, !!workerTypeFilter, !!cityFilter].filter(Boolean).length;

  const activeMainCat = categories.find(c => activeServices.includes(c.key)) ?? null;

  const clearFilters = () => {
    setActiveServices([]);
    setWorkerTypeFilter("");
    setCityFilter("");
    setSearchTerm("");
    setSortBy("default");
  };

  const sortLabel = (key: string) => {
    const map: Record<string, string> = {
      default: t.companies.sortDefault ?? "Best Match",
      price_asc: t.companies.sortPriceAsc ?? "Price: Low → High",
      price_desc: t.companies.sortPriceDesc ?? "Price: High → Low",
      experience: t.companies.sortExperience ?? "Most Experienced",
    };
    return map[key] ?? key;
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">

      {/* ── SEARCH HERO ── */}
      <div className="bg-foreground text-white py-10 md:py-14 overflow-x-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{t.companies.title}</h1>
            <p className="text-white/60 text-base">{t.companies.subtitle ?? "Find trusted professionals for your project"}</p>
          </div>

          {/* Big search bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              placeholder={t.companies.search}
              className="pl-12 h-14 text-base bg-white text-foreground border-0 shadow-xl rounded-2xl"
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

          {/* Service pills — edge-to-edge horizontal scroll */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            <button
              onClick={() => setActiveServices([])}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeServices.length === 0
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
              }`}
            >
              {t.companies.all ?? "All"}
            </button>
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveServices(prev =>
                  prev.includes(cat.key) ? prev.filter(s => s !== cat.key) : [...prev, cat.key]
                )}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeServices.includes(cat.key)
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Sub-category chips — shown when a main category is active */}
          {activeMainCat && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
              {activeMainCat.subcategories.map(tag => (
                <button
                  key={tag.key}
                  onClick={() => setActiveServices(prev =>
                    prev.includes(tag.key) ? prev.filter(s => s !== tag.key) : [...prev, tag.key]
                  )}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    activeServices.includes(tag.key)
                      ? "bg-white text-primary border-white shadow-md"
                      : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white border-b border-border sticky top-20 md:top-24 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">

          {/* Row 1: worker type tabs + city */}
          <div className="flex gap-2 items-center">
            {/* Worker type tabs */}
            <div className="flex rounded-lg border border-border overflow-hidden text-sm flex-shrink-0">
              {[
                { val: "" as const, label: t.companies.all ?? "All" },
                { val: "individual" as const, label: t.companies.individual ?? "Individual" },
                { val: "company" as const, label: t.companies.company ?? "Company" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setWorkerTypeFilter(opt.val)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    workerTypeFilter === opt.val
                      ? "bg-primary text-white"
                      : "bg-white text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

          {/* City filter with autocomplete */}
          <div className="relative flex items-center gap-1" ref={cityRef}>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t.companies.cityPlaceholder ?? "City..."}
                className={`pl-7 pr-2 h-10 text-sm w-full sm:w-44 ${geoError ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
                value={cityFilter}
                autoComplete="off"
                onChange={e => {
                  setCityFilter(e.target.value);
                  setGeoError(false);
                  setCityOpen(true);
                  setCityHighlight(-1);
                }}
                onFocus={() => { if (cityFilter) setCityOpen(true); }}
                onKeyDown={e => {
                  if (!cityOpen || citySuggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCityHighlight(h => Math.min(h + 1, citySuggestions.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCityHighlight(h => Math.max(h - 1, 0));
                  } else if (e.key === "Enter" && cityHighlight >= 0) {
                    e.preventDefault();
                    setCityFilter(citySuggestions[cityHighlight]);
                    setCityOpen(false);
                    setCityHighlight(-1);
                  } else if (e.key === "Escape") {
                    setCityOpen(false);
                    setCityHighlight(-1);
                  }
                }}
              />
              {/* Dropdown */}
              {cityOpen && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  {citySuggestions.map((city, i) => {
                    const q = cityFilter.toLowerCase();
                    const idx = city.toLowerCase().indexOf(q);
                    return (
                      <button
                        key={city}
                        onMouseDown={e => { e.preventDefault(); setCityFilter(city); setCityOpen(false); setCityHighlight(-1); }}
                        onMouseEnter={() => setCityHighlight(i)}
                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                          i === cityHighlight ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span>
                          {idx >= 0 ? (
                            <>
                              {city.slice(0, idx)}
                              <span className="font-semibold text-primary">{city.slice(idx, idx + q.length)}</span>
                              {city.slice(idx + q.length)}
                            </>
                          ) : city}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={detectCity}
              disabled={locating}
              title={locating ? "Detecting location…" : (t.companies.detectLocation ?? "Use my location")}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors flex-shrink-0
                ${locating
                  ? "border-primary/30 bg-primary/5 text-primary cursor-wait"
                  : geoError
                    ? "border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10"
                    : "border-border bg-white text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                }`}
            >
              {locating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <LocateFixed className="h-3.5 w-3.5" />
              }
            </button>
          </div>
          </div>{/* closes row-1 flex */}

          {/* Row 2 on mobile: sort + clear */}
          <div className="flex items-center gap-2 sm:contents">
            {/* Sort */}
            <div className="relative flex-1 sm:flex-initial sm:ml-auto">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-border rounded-lg pl-8 pr-7 py-2 h-10 text-sm text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary w-full"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{sortLabel(opt.value)}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <X className="h-3 w-3" />
                {t.companies.clearFilters ?? "Clear"} ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="container mx-auto px-4 py-8">

        {/* Count bar */}
        {!isLoading && !isError && (
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} {filtered.length === 1 ? (t.companies.result ?? "result") : (t.companies.results ?? "results")}
            {activeServices.length > 0 && <> · <span className="text-primary font-medium">{activeServices.map(s => categories.find(c => c.key === s)?.label ?? s).join(", ")}</span></>}
            {workerTypeFilter && <> · <span className="text-primary font-medium">{workerTypeFilter === "individual" ? (t.companies.individual ?? "Individual") : (t.companies.company ?? "Company")}</span></>}
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <div className="flex gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5 mb-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16 bg-destructive/5 rounded-2xl text-destructive">
            <p>{t.common.error}</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white rounded-2xl border border-dashed border-border"
          >
            <Search className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold text-foreground mb-2">{t.companies.noResults}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t.companies.noResultsHint ?? "Try adjusting your filters or search terms"}
            </p>
            <Button variant="outline" onClick={clearFilters}>
              {t.companies.clearFilters ?? "Clear all filters"}
            </Button>
          </motion.div>
        )}

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {(user ? filtered : filtered.slice(0, 8)).map((company, idx) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="h-full"
              >
                <ProviderCard
                  provider={company}
                  onClick={() => navigate(`/companies/${company.id}`)}
                  showDescription
                  footer={
                    <div className="flex gap-2 items-center pt-3 border-t border-border/40">
                      {user ? (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); window.location.href = `mailto:${company.email}`; }}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/8"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {t.companies.contact ?? "Contact"}
                          </button>
                          {company.phone && (
                            <button
                              onClick={e => { e.stopPropagation(); window.location.href = `tel:${company.phone}`; }}
                              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/8"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {t.companies.call ?? "Call"}
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/companies/${company.id}?msg=1`); }}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/8"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {t.publicProfile.sendMessage}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); navigate("/sign-in"); }}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/8"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {t.publicProfile.contactLoginCta}
                        </button>
                      )}
                    </div>
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
          </div>

          {/* Gate overlay for non-logged-in users */}
          {!user && filtered.length > 8 && (
            <div className="relative mt-5">
              <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-background z-10 pointer-events-none" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
                {filtered.slice(8, 11).map((company) => {
                  return (
                    <div key={`ghost-${company.id}`}>
                      <ProviderCard provider={company} showDescription />
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.div
                  className="bg-white/95 backdrop-blur-sm border border-border rounded-2xl px-8 py-8 text-center shadow-lg max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 48px -8px rgba(26,58,110,0.22)", borderColor: "rgba(26,58,110,0.3)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-5">{t.professionals.gateLabel}</p>
                  <Link href="/signup?account_type=project_poster">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    >
                      <Button size="lg" className="w-full" data-testid="companies-gate-cta">
                        {t.professionals.gateCta}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

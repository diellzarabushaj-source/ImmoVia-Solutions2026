import { useRef, useMemo, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { Link, useSearch, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { useAuth } from "@/contexts/AuthContext";
import { useListCompanies, useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  HeadphonesIcon,
  Hammer,
  Building2,
  Sofa,
  TreePine,
  Wrench,
  Plug,
  Paintbrush,
  ChefHat,
  SquareStack,
  Leaf,
  HelpCircle,
  Star,
  Users,
  Globe,
  TrendingUp,
  ChevronRight,
  Search,
  Home as HomeIcon,
  Briefcase,
  Lock,
  MapPin,
  Clock,
  User,
  FileText,
  X,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProviderCard } from "@/components/provider/ProviderCard";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

function CountUpStat({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState("0");
  const match = value.match(/^([^\d]*)(\d[\d,]*)([^\d]*)$/);
  const prefix = match?.[1] ?? "";
  const rawNum = parseInt((match?.[2] ?? "0").replace(/,/g, ""), 10);
  const suffix = match?.[3] ?? "";
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const duration = 1800;
      const startTime = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = Math.round(eased * rawNum);
        setDisplayed(cur >= 1000 ? cur.toLocaleString() : String(cur));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.disconnect();
    }, { threshold: 0.6 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rawNum]);
  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-white tracking-tight tabular-nums">
      {prefix}{displayed}{suffix}
    </span>
  );
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  renovation:      Hammer,
  painting:        Paintbrush,
  electrical:      Zap,
  plumbing:        Wrench,
  kitchen:         ChefHat,
  flooring:        SquareStack,
  interior_design: Sofa,
  cleaning:        Leaf,
  other:           HelpCircle,
  construction:    Building2,
  interior:        Sofa,
  exterior:        TreePine,
  electric:        Plug,
};

export default function Home() {
  const { t, language } = useLanguage();
  usePageMeta({
    title: "Renovation & Bau in der Schweiz | ImmoVia365",
    description: "Geprüfte Dienstleister für Renovierung, Bau, Reinigung, Umzug und Gebäudeservices in der Schweiz. Zürich, Bern, Basel, Luzern und mehr — kostenlos Angebote einholen.",
  });
  useStructuredData([
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Was ist ImmoVia365?", "acceptedAnswer": { "@type": "Answer", "text": "ImmoVia365 ist eine Schweizer Online-Plattform, die Privatpersonen und Unternehmen mit geprüften Handwerkern und Dienstleistern für Renovierungen, Umzüge, Reinigung und Bauprojekte verbindet." } },
        { "@type": "Question", "name": "In welchen Schweizer Städten ist ImmoVia365 verfügbar?", "acceptedAnswer": { "@type": "Answer", "text": "ImmoVia365 ist in der gesamten Schweiz verfügbar, mit besonderem Fokus auf Zürich, Bern, Basel, Luzern, Genf, Lausanne, Winterthur und St. Gallen." } },
        { "@type": "Question", "name": "Wie finde ich einen Handwerker für mein Projekt?", "acceptedAnswer": { "@type": "Answer", "text": "Tragen Sie Ihr Projekt auf ImmoVia365 ein, und geprüfte Dienstleister aus Ihrer Region können Ihr Angebot einsehen und sich bei Ihnen melden. Sie können auch im Dienstleister-Verzeichnis direkt nach Anbietern in Ihrer Stadt suchen." } },
        { "@type": "Question", "name": "Ist die Registrierung für Auftraggeber kostenlos?", "acceptedAnswer": { "@type": "Answer", "text": "Ja, das Einreichen eines Projekts ist für Auftraggeber kostenlos. Dienstleister zahlen eine einmalige Registrierungsgebühr und können zwischen verschiedenen Abonnement-Paketen wählen." } }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` }]
    }
  ]);

  const { user } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();
  const { categories: serviceCategories } = useCategories("service");
  const { data: companies, isLoading: isLoadingCompanies } = useListCompanies();
  const { data: featuredCompanies, isLoading: isLoadingFeatured } = useListCompanies({ featuredOnHome: "true" });
  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const [listingTypeFilter, setListingTypeFilter] = useState(() => new URLSearchParams(search).get("type") ?? "");
  const [listingCityFilter, setListingCityFilter] = useState(() => new URLSearchParams(search).get("city") ?? "");
  const [listingSizeFilter, setListingSizeFilter] = useState(() => new URLSearchParams(search).get("size") ?? "");
  const [listingBudgetFilter, setListingBudgetFilter] = useState(() => new URLSearchParams(search).get("budget") ?? "");
  const [activeTab, setActiveTab] = useState<"service" | "project">("service");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestWrapRef = useRef<HTMLDivElement>(null);
  const listingSearchRef = useRef(search);
  listingSearchRef.current = search;

  useEffect(() => {
    const p = new URLSearchParams(search);
    setListingTypeFilter(p.get("type") ?? "");
    setListingCityFilter(p.get("city") ?? "");
    setListingSizeFilter(p.get("size") ?? "");
    setListingBudgetFilter(p.get("budget") ?? "");
  }, [search]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (listingTypeFilter) p.set("type", listingTypeFilter);
    if (listingCityFilter) p.set("city", listingCityFilter);
    if (listingSizeFilter) p.set("size", listingSizeFilter);
    if (listingBudgetFilter) p.set("budget", listingBudgetFilter);
    const next = p.toString();
    if (next !== listingSearchRef.current) navigate(`?${next}`, { replace: true });
  }, [listingTypeFilter, listingCityFilter, listingSizeFilter, listingBudgetFilter, navigate]);

  const previewCompanies = useMemo(
    () => companies?.filter(c => c.status === "approved").slice(0, 6) ?? [],
    [companies]
  );
  const carouselCompanies = useMemo(() => {
    if (isLoadingFeatured) return null;
    const base = (featuredCompanies ?? []).filter(c => c.status === "approved");
    if (base.length === 0) return null;
    const times = Math.max(4, Math.ceil(8 / base.length));
    return Array.from({ length: times }, () => base).flat();
  }, [isLoadingFeatured, featuredCompanies]);

  const hasListingFilter = !!(listingTypeFilter || listingCityFilter || listingSizeFilter || listingBudgetFilter);
  const previewProjects = useMemo(() => {
    let list = (projects ?? []).filter(p => p.status === "open");
    if (listingTypeFilter) list = list.filter(p => p.projectType === listingTypeFilter);
    if (listingCityFilter) list = list.filter(p => p.city.toLowerCase().includes(listingCityFilter.toLowerCase()));
    if (listingSizeFilter) list = list.filter(p => p.size === listingSizeFilter);
    if (listingBudgetFilter) list = list.filter(p => p.budget === listingBudgetFilter);
    return list.slice(0, 9);
  }, [projects, listingTypeFilter, listingCityFilter, listingSizeFilter, listingBudgetFilter]);

  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 18 });
  const vidX = useTransform(springX, [-0.5, 0.5], ["5%", "-5%"]);
  const vidY = useTransform(springY, [-0.5, 0.5], ["5%", "-5%"]);
  const tiltX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-5, 5]);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const scrollVidY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const fetchSuggestions = (val: string, tab: string) => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(val.trim())}&tab=${tab}`);
        const data = await res.json() as string[];
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 260);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "ImmoVia365/1.0" } }
          );
          const data = await res.json() as { address?: { city?: string; town?: string; village?: string; county?: string } };
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? "";
          if (city) setSearchCity(city);
        } catch {
          // silent fail
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
    if (searchCategory) params.set("service", searchCategory);
    if (searchCity.trim()) params.set("city", searchCity.trim());
    const qs = params.toString();
    navigate(activeTab === "service" ? `/companies${qs ? `?${qs}` : ""}` : `/projects${qs ? `?${qs}` : ""}`);
  };

  const services = serviceCategories.map(cat => ({
    icon: SERVICE_ICONS[cat.key] ?? Briefcase,
    title: cat.label,
    desc: cat.subcategories.slice(0, 3).map(sub => sub.label).join(" · "),
    photo: cat.imageUrl ?? undefined,
    serviceKey: cat.key,
  }));

  const whyUs = [
    { icon: Shield, title: t.why.verified, desc: t.why.verifiedDesc },
    { icon: Zap, title: t.why.fast, desc: t.why.fastDesc },
    { icon: CheckCircle2, title: t.why.secure, desc: t.why.secureDesc },
    { icon: HeadphonesIcon, title: t.why.support, desc: t.why.supportDesc },
  ];

  const stats = [
    { value: "5,000+", label: t.stats.projects, icon: TrendingUp },
    { value: "320+", label: t.stats.professionals, icon: Users },
    { value: "3", label: t.stats.countries, icon: Globe },
    { value: "98%", label: t.stats.satisfaction, icon: Star },
  ];

  const testimonials = [
    { text: t.testimonials.t1, author: t.testimonials.t1Author, city: t.testimonials.t1City, rating: 5 },
    { text: t.testimonials.t2, author: t.testimonials.t2Author, city: t.testimonials.t2City, rating: 5 },
    { text: t.testimonials.t3, author: t.testimonials.t3Author, city: t.testimonials.t3City, rating: 5 },
  ];

  const scrollTestimonials = [
    { text: t.testimonials.t1, name: t.testimonials.t1Author, role: t.testimonials.t1City, avatar: "https://randomuser.me/api/portraits/men/11.jpg" },
    { text: t.testimonials.t2, name: t.testimonials.t2Author, role: t.testimonials.t2City, avatar: "https://randomuser.me/api/portraits/women/22.jpg" },
    { text: t.testimonials.t3, name: t.testimonials.t3Author, role: t.testimonials.t3City, avatar: "https://randomuser.me/api/portraits/men/33.jpg" },
    { text: t.testimonials.t1, name: "Lena Weber", role: "Zürich", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { text: t.testimonials.t2, name: "Florim Berisha", role: "Bern", avatar: "https://randomuser.me/api/portraits/men/55.jpg" },
    { text: t.testimonials.t3, name: "Sophie Martin", role: "Geneva", avatar: "https://randomuser.me/api/portraits/women/66.jpg" },
    { text: t.testimonials.t1, name: "Klaus Richter", role: "Basel", avatar: "https://randomuser.me/api/portraits/men/77.jpg" },
    { text: t.testimonials.t2, name: "Elira Hoxha", role: "Pristina", avatar: "https://randomuser.me/api/portraits/women/88.jpg" },
    { text: t.testimonials.t3, name: "Thomas Baumann", role: "Vienna", avatar: "https://randomuser.me/api/portraits/men/99.jpg" },
  ];

  return (
    <div className="flex flex-col w-full">

      {/* ══════════════════════════════════════════════════════════
          HERO — cinematic, full-viewport editorial
      ══════════════════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        className="relative overflow-hidden bg-foreground text-white min-h-[92vh] flex items-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video background with parallax */}
        <motion.div className="absolute inset-[-12%]" style={{ y: scrollVidY }}>
          <motion.div className="absolute inset-0" style={{ x: vidX, y: vidY }}>
            <video
              autoPlay muted loop playsInline
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80&fit=crop"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-workers-on-a-construction-site-with-cranes-in-the-background-42737-large.mp4" type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-construction-site-structure-of-a-house-being-built-40742-large.mp4" type="video/mp4" />
            </video>
            {/* Layered cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/75 to-foreground/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/20" />
            <div className="absolute inset-0 bg-primary/8 mix-blend-multiply" />
          </motion.div>
        </motion.div>

        {/* Fine grid texture */}
        <div
          className="absolute inset-0 opacity-[0.028] pointer-events-none z-[1]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)", backgroundSize: "60px 60px" }}
        />

        {/* Ambient light orbs */}
        <div className="absolute top-[-15%] right-[5%] w-[50%] h-[90%] rounded-full bg-primary opacity-[0.14] blur-[160px] pointer-events-none z-[1]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[35%] h-[60%] rounded-full bg-blue-400 opacity-[0.07] blur-[120px] pointer-events-none z-[1]" />

        {/* Content */}
        <div className="container mx-auto px-6 lg:px-8 relative z-10 py-24 md:py-32 lg:py-40 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="initial" animate="animate" variants={stagger}>

              {/* Overline badge */}
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 mb-8">
                <span className="block w-8 h-px bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                  {t.hero.badge}
                </span>
              </motion.div>

              {/* Headline — editorial scale */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold tracking-tight leading-[1.06] text-white mb-6"
                style={{ textShadow: "0 4px 40px rgba(0,0,0,0.5)" }}
              >
                {t.search.headline}
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeUp}
                className="text-base md:text-xl font-light text-white/65 mb-10 max-w-xl leading-relaxed"
              >
                {t.search.subtitle}
              </motion.p>

              {/* ── Search Card ── */}
              <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.45)] overflow-hidden mb-8 text-left max-w-3xl">

                {/* Tabs */}
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setActiveTab("service")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px min-h-[54px] ${
                      activeTab === "service"
                        ? "text-primary border-primary bg-primary/5"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>{t.search.tab1}</span>
                  </button>
                  <div className="w-px bg-border my-2" />
                  <button
                    onClick={() => setActiveTab("project")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px min-h-[54px] ${
                      activeTab === "project"
                        ? "text-primary border-primary bg-primary/5"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>{t.search.tab2}</span>
                  </button>
                </div>

                {/* Inputs */}
                <div className="p-5 md:p-6">
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {activeTab === "service" ? t.search.tab1Helper : t.search.tab2Helper}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {/* Row 1 — keyword input */}
                    <div className="relative w-full" ref={suggestWrapRef}>
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <input
                        value={searchKeyword}
                        onChange={e => { setSearchKeyword(e.target.value); fetchSuggestions(e.target.value, activeTab); }}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onKeyDown={e => {
                          if (e.key === "Enter") { setShowSuggestions(false); handleSearch(); }
                          if (e.key === "Escape") setShowSuggestions(false);
                        }}
                        placeholder={activeTab === "service" ? t.search.keywordPlaceholder1 : t.search.keywordPlaceholder2}
                        className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        autoComplete="off"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                          {suggestions.map((s, i) => (
                            <li
                              key={i}
                              onMouseDown={() => { setSearchKeyword(s); setShowSuggestions(false); }}
                              className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-primary/6 cursor-pointer transition-colors"
                            >
                              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Row 2 — category + city + button */}
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <select
                        value={searchCategory}
                        onChange={e => setSearchCategory(e.target.value)}
                        className="h-12 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:flex-1 transition"
                      >
                        <option value="">{t.search.categoryAll}</option>
                        {serviceCategories.map(cat => (
                          <option key={cat.key} value={cat.key}>{cat.label}</option>
                        ))}
                      </select>
                      <div className="relative sm:flex-1">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          value={searchCity}
                          onChange={e => setSearchCity(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSearch()}
                          placeholder={t.search.locationPlaceholder}
                          className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={isLocating}
                          title="Detect my location"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                        >
                          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        onClick={handleSearch}
                        className="h-12 px-7 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 flex-shrink-0 transition-all duration-200"
                        data-testid="hero-smart-search-btn"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {activeTab === "service" ? t.search.btn1 : t.search.btn2}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>


            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-foreground/40 to-transparent pointer-events-none z-[2]" />
      </motion.section>

      {/* ══════════════════════════════════════════════════════════
          STATS — dark navy band, massive numerals
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-foreground text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className={`flex flex-col items-center text-center py-10 md:py-12 px-4 relative cursor-default ${
                  i < 3 ? "md:after:absolute md:after:right-0 md:after:top-1/4 md:after:bottom-1/4 md:after:w-px md:after:bg-white/10 md:after:content-['']" : ""
                } ${i < 2 ? "after:absolute after:right-0 after:top-1/4 after:bottom-1/4 after:w-px after:bg-white/10 after:content-['']" : ""}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.09, duration: 0.5 }}
                viewport={{ once: true }}
              >
                {/* Icon with pulsing glow ring */}
                <div className="relative mb-4">
                  <motion.div
                    className="absolute inset-[-6px] rounded-full bg-primary/20 blur-sm"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.15, 0.4] }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                  />
                  <div className="relative w-9 h-9 rounded-full bg-white/6 border border-white/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <CountUpStat value={stat.value} />
                <span className="text-xs font-medium text-white/40 uppercase tracking-[0.15em] mt-2">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BROWSE MARKETPLACE — 4-col flip cards
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.browse.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-xl">{t.browse.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: FileText,
                label: t.browse.card2Label,
                title: t.browse.projectsTitle,
                desc: t.browse.projectsDesc,
                cta: t.browse.projectsCta,
                href: "/projects",
                testId: "browse-card-view-projects",
                accent: "#3b82f6",
                photo: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&fit=crop",
                darkBack: false,
              },
              {
                icon: Briefcase,
                label: t.browse.card2Label,
                title: t.browse.card2Title,
                desc: t.browse.card2Desc,
                cta: t.browse.card2Cta,
                href: "/signup?account_type=project_poster",
                testId: "browse-card-register-poster",
                accent: "#60a5fa",
                photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80&fit=crop",
                darkBack: true,
              },
              {
                icon: Users,
                label: t.browse.card4Label,
                title: t.browse.providersTitle,
                desc: t.browse.providersDesc,
                cta: t.browse.providersCta,
                href: "/companies",
                testId: "browse-card-view-providers",
                accent: "#93c5fd",
                photo: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80&fit=crop",
                darkBack: false,
              },
              {
                icon: Building2,
                label: t.browse.card4Label,
                title: t.browse.card4Title,
                desc: t.browse.card4Desc,
                cta: t.browse.card4Cta,
                href: "/signup?account_type=service_provider",
                testId: "browse-card-register-provider",
                accent: "#38bdf8",
                photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop",
                darkBack: true,
              },
            ].map((card, i) => (
              <Link href={card.href} key={i} className="relative h-80 block" style={{ perspective: "1000px" }}>
              <motion.div
                className="relative h-80 cursor-pointer"
                style={{ perspective: "1000px" }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                viewport={{ once: true }}
                onMouseEnter={() => setFlippedCard(i)}
                onMouseLeave={() => setFlippedCard(null)}
              >
                {/* Flip container */}
                <div
                  className="relative w-full h-full transition-transform duration-[600ms] ease-in-out"
                  style={{ transformStyle: "preserve-3d", transform: flippedCard === i ? "rotateY(180deg)" : "none" }}
                >
                  {/* ── FRONT — foto + overlay ── */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {/* Photo */}
                    <img
                      src={card.photo}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-5">
                      <div>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.18em]">{card.label}</span>
                        <div className="mt-3 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                          <card.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-snug mb-1 drop-shadow-md">{card.title}</h3>
                        <p className="text-white/70 text-[11px] leading-relaxed line-clamp-2">{card.desc}</p>
                      </div>
                    </div>
                    {/* Hover hint */}
                    <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* ── BACK — white or navy ── */}
                  <div
                    className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-4 p-6"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: card.darkBack
                        ? "linear-gradient(145deg,#0d2151 0%,#1a3a6e 60%,#1e4b8a 100%)"
                        : "#ffffff",
                      boxShadow: card.darkBack
                        ? "0 20px 40px -12px rgba(13,33,81,0.5)"
                        : "0 20px 40px -12px rgba(59,130,246,0.15)",
                      border: card.darkBack ? "none" : "2px solid rgba(59,130,246,0.15)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: card.darkBack ? "rgba(255,255,255,0.12)" : `${card.accent}18` }}
                    >
                      <card.icon className={`w-6 h-6 ${card.darkBack ? "text-white" : "text-primary"}`} />
                    </div>
                    <p className={`text-base font-bold text-center leading-snug ${card.darkBack ? "text-white" : "text-foreground"}`}>
                      {card.title}
                    </p>
                    <Button
                      className={`w-full font-semibold pointer-events-none ${
                        card.darkBack
                          ? "bg-white text-foreground"
                          : "bg-foreground text-white"
                      }`}
                      data-testid={card.testId}
                      tabIndex={-1}
                    >
                      {card.cta}
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SERVICE CATEGORIES — full-bleed photo cards
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#f7f8fb]">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.professionals.title}</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-lg">{t.professionals.title}</h2>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed md:text-right">{t.professionals.subtitle}</p>
            </div>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={`/companies?service=${s.serviceKey}`}>
                  <div
                    className="group relative rounded-2xl overflow-hidden cursor-pointer h-80 shadow-sm hover:shadow-2xl transition-all duration-500"
                    data-testid={`service-card-${i}`}
                  >
                    {s.photo ? (
                      <img
                        src={s.photo}
                        alt={s.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: "linear-gradient(145deg,#0d2151,#1a3a6e,#1e4b8a)" }} />
                    )}

                    {/* Layered gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5 transition-opacity duration-300 group-hover:from-black/80" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Icon */}
                    <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white/12 backdrop-blur-sm border border-white/15 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/0 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-white/15 translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>

                    {/* Text at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-white/50 text-[10px] uppercase tracking-[0.16em] font-semibold mb-1.5">{t.offers.cta}</p>
                      <h3 className="font-bold text-white text-xl leading-tight mb-1">{s.title}</h3>
                      <p className="text-white/55 text-xs leading-relaxed line-clamp-1 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">{s.desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PROJECT LISTINGS PREVIEW
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.listings.title}</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-lg">{t.listings.title}</h2>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed md:text-right">{t.listings.subtitle}</p>
            </div>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 mb-10 bg-[#f7f8fb] rounded-2xl px-5 py-4 border border-border/60">
            <select
              value={listingTypeFilter}
              onChange={e => setListingTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
            >
              <option value="">{t.listings.filterAllTypes ?? "All types"}</option>
              {serviceCategories.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
            <div className="relative w-full sm:w-auto">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={listingCityFilter}
                onChange={e => setListingCityFilter(e.target.value)}
                placeholder={t.listings.filterCity ?? "Filter by city"}
                className="h-9 rounded-lg border border-border bg-white pl-7 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-40 md:w-44"
              />
              {listingCityFilter && (
                <button onClick={() => setListingCityFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <select
              value={listingSizeFilter}
              onChange={e => setListingSizeFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
            >
              <option value="">{t.listings.filterAllSizes ?? "All sizes"}</option>
              <option value="small">{t.listings.sizeSm}</option>
              <option value="medium">{t.listings.sizeMd}</option>
              <option value="large">{t.listings.sizeLg}</option>
              <option value="premium">{t.listings.sizePremium}</option>
            </select>
            <select
              value={listingBudgetFilter}
              onChange={e => setListingBudgetFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
            >
              <option value="">{t.listings.filterAllBudgets ?? "All budgets"}</option>
              <option value="under-10k">{"< 10k"}</option>
              <option value="10k-50k">{"10k – 50k"}</option>
              <option value="50k-100k">{"50k – 100k"}</option>
              <option value="100k-500k">{"100k – 500k"}</option>
              <option value="over-500k">{"> 500k"}</option>
            </select>
            <div className="flex items-center gap-2 sm:ml-auto">
              {hasListingFilter && (
                <button
                  onClick={() => { setListingTypeFilter(""); setListingCityFilter(""); setListingSizeFilter(""); setListingBudgetFilter(""); }}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <X className="h-3 w-3" />
                  {t.listings.clearFilters ?? "Clear filters"}
                </button>
              )}
              {!isLoadingProjects && (
                <span className="text-xs text-muted-foreground">
                  {previewProjects.length} {previewProjects.length === 1 ? (t.listings.result ?? "result") : (t.listings.results ?? "results")}
                </span>
              )}
            </div>
          </div>

          {isLoadingProjects && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
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

          {!isLoadingProjects && previewProjects.length === 0 && hasListingFilter && (
            <div className="text-center py-20 bg-[#f7f8fb] rounded-3xl border border-dashed border-border">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-25" />
              <p className="text-foreground font-semibold mb-1">{t.listings.noResultsFilter ?? "No projects match your filters"}</p>
              <p className="text-sm text-muted-foreground mb-5">{t.listings.noResultsFilterHint ?? "Try different filters or clear them."}</p>
              <button
                onClick={() => { setListingTypeFilter(""); setListingCityFilter(""); setListingSizeFilter(""); setListingBudgetFilter(""); }}
                className="text-sm text-primary hover:underline font-medium"
              >
                {t.listings.clearFilters ?? "Clear filters"}
              </button>
            </div>
          )}

          {!isLoadingProjects && previewProjects.length > 0 && (
            <div className="relative">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                variants={stagger}
                initial="initial"
                animate="animate"
              >
                {previewProjects.map((project) => (
                  <motion.div key={project.id} variants={fadeUp}>
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </motion.div>

              {!user && (
                <div className="relative mt-5">
                  <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white z-10 pointer-events-none" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-25 pointer-events-none select-none" aria-hidden="true">
                    {previewProjects.slice(0, 3).map((project, idx) => (
                      <div key={`ghost-${idx}`}><ProjectCard project={project} /></div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <motion.div
                      className="bg-white/98 backdrop-blur-sm border border-border rounded-3xl px-10 py-10 text-center shadow-2xl shadow-black/10 max-w-sm mx-auto"
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{ y: -4, boxShadow: "0 20px 48px -8px rgba(26,58,110,0.22)", borderColor: "rgba(26,58,110,0.3)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-5">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-6 leading-relaxed">{t.listings.gateLabel}</p>
                      <Link href="/signup?account_type=service_provider">
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                        >
                          <Button size="lg" className="w-full" data-testid="listings-gate-cta">
                            {t.listings.gateCta}
                          </Button>
                        </motion.div>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              )}
              {user && (
                <div className="text-center mt-12">
                  <Link href="/projects">
                    <Button variant="outline" size="lg" className="border-border hover:border-primary hover:text-primary transition-colors" data-testid="listings-see-all">
                      {t.listings.seeAll}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TRUSTED BY — infinite ticker (only when featured companies exist)
      ══════════════════════════════════════════════════════════ */}
      {carouselCompanies && <section className="py-24 md:py-28 bg-[#f7f8fb] border-y border-border overflow-hidden">
        <style>{`
          @keyframes immovia-ticker {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .immovia-ticker-track {
            animation: immovia-ticker 42s linear infinite;
            will-change: transform;
          }
          .immovia-ticker-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="container mx-auto px-6 lg:px-8 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">
              { language === "de" ? "Geprüfte Fachleute" : language === "sq" ? "Profesionistë të verifikuar" : language === "fr" ? "Professionnels certifiés" : "Verified Professionals" }
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-xl">
              { language === "de" ? "Vertrauen von lokalen Fachleuten" : language === "sq" ? "Të besuar nga profesionistët lokalë" : language === "fr" ? "La confiance des professionnels locaux" : "Trusted by local professionals" }
            </h2>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-36 z-10 pointer-events-none bg-gradient-to-r from-[#f7f8fb] to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-36 z-10 pointer-events-none bg-gradient-to-l from-[#f7f8fb] to-transparent" />
          <div className="overflow-hidden">
            <div className="immovia-ticker-track flex gap-4 w-max">
              {carouselCompanies.map((company, idx) => (
                <div key={`live-${idx}`} className="flex-shrink-0 w-64">
                  <ProviderCard provider={company} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS — helmet background + steps
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-16 md:py-20 scroll-mt-20 md:scroll-mt-24 overflow-hidden">
        {/* Background helmet — right-aligned, transparent */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          <img
            src="/helmet-branded.png"
            alt=""
            className="absolute right-[-4%] top-1/2 -translate-y-1/2 w-[520px] max-w-[55vw] object-contain opacity-[0.15]"
          />
        </div>

        {/* Very light tinted background */}
        <div className="absolute inset-0 bg-[#f4f7fc] pointer-events-none" style={{ zIndex: -1 }} />

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.howItWorks.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">{t.howItWorks.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6 mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Project Posters */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/30 to-transparent" />
              <div className="pl-8">
                <div className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{t.howItWorks.posterTitle}</div>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{t.howItWorks.posterSubtitle}</p>
                <div className="flex flex-col gap-5">
                  {([
                    { step: t.howItWorks.posterStep1, icon: User },
                    { step: t.howItWorks.posterStep2, icon: FileText },
                    { step: t.howItWorks.posterStep3, icon: Clock },
                    { step: t.howItWorks.posterStep4, icon: Users },
                    { step: t.howItWorks.posterStep5, icon: CheckCircle2 },
                  ] as { step: string; icon: React.ElementType }[]).map(({ step, icon: StepIcon }, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-3 group cursor-default rounded-xl px-3 py-2 -mx-3 transition-colors duration-200 hover:bg-primary/5"
                      whileHover={{ x: 6 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/30 transition-all duration-200">{i + 1}</div>
                      </div>
                      <div className="flex items-start gap-2.5 flex-1 pt-1">
                        <StepIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                        <p className="text-sm text-foreground leading-relaxed group-hover:text-foreground/90 font-medium transition-colors duration-200">{step}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/signup?account_type=project_poster" className="group inline-block">
                    <Button data-testid="hiw-poster-cta" className="transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.98]">
                      {t.howItWorks.posterCta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* For Service Providers */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400 via-blue-400/30 to-transparent" />
              <div className="pl-8">
                <div className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{t.howItWorks.providerTitle}</div>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{t.howItWorks.providerSubtitle}</p>
                <div className="flex flex-col gap-5">
                  {([
                    { step: t.howItWorks.providerStep1, icon: User },
                    { step: t.howItWorks.providerStep2, icon: Clock },
                    { step: t.howItWorks.providerStep3, icon: Search },
                    { step: t.howItWorks.providerStep4, icon: ArrowRight },
                    { step: t.howItWorks.providerStep5, icon: HeadphonesIcon },
                  ] as { step: string; icon: React.ElementType }[]).map(({ step, icon: StepIcon }, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-3 group cursor-default rounded-xl px-3 py-2 -mx-3 transition-colors duration-200 hover:bg-blue-50"
                      whileHover={{ x: 6 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-foreground text-white flex items-center justify-center text-xs font-bold group-hover:scale-110 group-hover:shadow-md group-hover:shadow-foreground/20 transition-all duration-200">{i + 1}</div>
                      </div>
                      <div className="flex items-start gap-2.5 flex-1 pt-1">
                        <StepIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                        <p className="text-sm text-foreground leading-relaxed group-hover:text-foreground/90 font-medium transition-colors duration-200">{step}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/signup?account_type=service_provider" className="group inline-block">
                    <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.03] active:scale-[0.98]" data-testid="hiw-provider-cta">
                      {t.howItWorks.providerCta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHY IMMOVIA — numbered editorial cards
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-foreground text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.why.title}</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-xl">{t.why.title}</h2>
              <p className="text-white/45 max-w-xs text-sm leading-relaxed md:text-right">{t.why.subtitle}</p>
            </div>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`flex flex-col gap-5 p-8 md:p-10 border-white/8 ${
                  i < 3 ? "lg:border-r" : ""
                } ${i < 2 ? "sm:border-r" : ""} border-b lg:border-b-0 sm:last:border-b-0`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-5xl font-bold text-white/6 leading-none select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base mb-3 leading-snug">{item.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS — auto-scrolling columns
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-[#f7f8fb] overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.testimonials.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">{t.testimonials.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6 mx-auto" />
          </motion.div>
        </div>

        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[640px] overflow-hidden">
          <TestimonialsColumn testimonials={scrollTestimonials.slice(0, 3)} duration={18} />
          <TestimonialsColumn testimonials={scrollTestimonials.slice(3, 6)} duration={22} className="hidden md:block" />
          <TestimonialsColumn testimonials={scrollTestimonials.slice(6, 9)} duration={16} className="hidden lg:block" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ACCOUNT TYPES — features-1 style, white bg, 2 CTAs
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-6">

          {/* Header */}
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.accountTypes.title}</p>
            <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-foreground">{t.accountTypes.title}</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">{t.cta.subtitle}</p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1 — Client / Project Poster */}
            <motion.div
              className="group rounded-xl border border-border bg-card text-center shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              viewport={{ once: true }}
            >
              {/* Card header with decorator */}
              <div className="flex flex-col space-y-1.5 p-6 pb-3 items-center">
                {/* CardDecorator — grid mask + icon */}
                <div
                  aria-hidden
                  className="relative mx-auto w-36 h-36"
                  style={{ maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)" }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center bg-background border-t border-l border-border">
                    <HomeIcon className="w-6 h-6 text-foreground" aria-hidden />
                  </div>
                </div>

                <h3 className="mt-4 font-semibold text-base text-foreground">{t.accountTypes.posterLabel}</h3>
              </div>

              {/* Card content */}
              <div className="px-6 pt-0 pb-2 flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t.accountTypes.posterDesc}</p>
                <div className="space-y-2 text-left mb-6">
                  {[t.accountTypes.posterSub1, t.accountTypes.posterSub2].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-7">
                <Link href="/signup?account_type=project_poster">
                  <Button size="default" className="w-full font-semibold" data-testid="footer-cta-project">
                    {t.cta.button}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 2 — Service Provider */}
            <motion.div
              className="group rounded-xl border border-border bg-card text-center shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
            >
              {/* Card header with decorator */}
              <div className="flex flex-col space-y-1.5 p-6 pb-3 items-center">
                <div
                  aria-hidden
                  className="relative mx-auto w-36 h-36"
                  style={{ maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)" }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center bg-background border-t border-l border-border">
                    <Briefcase className="w-6 h-6 text-foreground" aria-hidden />
                  </div>
                </div>

                <h3 className="mt-4 font-semibold text-base text-foreground">{t.accountTypes.providerLabel}</h3>
              </div>

              {/* Card content */}
              <div className="px-6 pt-0 pb-2 flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t.accountTypes.providerDesc}</p>
                <div className="space-y-2 text-left mb-6">
                  {[t.accountTypes.providerSub1, t.accountTypes.providerSub2].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-7">
                <Link href="/signup?account_type=service_provider">
                  <Button size="default" variant="outline" className="w-full font-semibold border-primary/30 text-primary hover:bg-primary/5" data-testid="footer-cta-company">
                    {t.cta.companyButton}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}

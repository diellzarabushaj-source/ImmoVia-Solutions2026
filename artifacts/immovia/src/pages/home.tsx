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
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.04] text-white mb-6"
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
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1 min-w-0" ref={suggestWrapRef}>
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
                    <select
                      value={searchCategory}
                      onChange={e => setSearchCategory(e.target.value)}
                      className="h-12 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-44 transition"
                    >
                      <option value="">{t.search.categoryAll}</option>
                      {serviceCategories.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.label}</option>
                      ))}
                    </select>
                    <div className="relative sm:w-44">
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
                      className="h-12 px-7 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 sm:flex-shrink-0 transition-all duration-200"
                      data-testid="hero-smart-search-btn"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {activeTab === "service" ? t.search.btn1 : t.search.btn2}
                    </Button>
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
                className={`flex flex-col items-center text-center py-10 md:py-12 px-4 relative ${
                  i < 3 ? "md:after:absolute md:after:right-0 md:after:top-1/4 md:after:bottom-1/4 md:after:w-px md:after:bg-white/10 md:after:content-['']" : ""
                } ${i < 2 ? "after:absolute after:right-0 after:top-1/4 after:bottom-1/4 after:w-px after:bg-white/10 after:content-['']" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-4 h-4 text-primary mb-3 opacity-70" />
                <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className="text-xs font-medium text-white/40 uppercase tracking-[0.15em] mt-2">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BROWSE MARKETPLACE — editorial 2×2 grid
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.browse.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-xl">{t.browse.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
            {/* Card 1: Browse Projects */}
            <motion.div
              className="group relative rounded-3xl overflow-hidden flex flex-col bg-slate-50 border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.0 }}
              viewport={{ once: true }}
            >
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=75&fit=crop"
                  alt="Browse open projects"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
                <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 leading-snug">{t.browse.projectsTitle}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.projectsDesc}</p>
                </div>
                <Link href="/projects">
                  <Button variant="outline" className="w-full border-border text-foreground hover:border-primary hover:text-primary transition-colors" data-testid="browse-card-view-projects">
                    {t.browse.projectsCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 2: Post a Project */}
            <motion.div
              className="group relative rounded-3xl overflow-hidden flex flex-col"
              style={{ background: "linear-gradient(145deg, #0d2151 0%, #1a3a6e 60%, #1e4b8a 100%)" }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              viewport={{ once: true }}
            >
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=75&fit=crop"
                  alt="Post a new project"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d2151]/95 via-[#0d2151]/30 to-transparent" />
                <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Briefcase className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute top-5 right-5">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t.browse.card2Label}</span>
                </div>
              </div>
              <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 leading-snug">{t.browse.card2Title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{t.browse.card2Desc}</p>
                </div>
                <Link href="/signup?account_type=project_poster">
                  <Button className="w-full bg-white text-foreground hover:bg-white/92 font-semibold" data-testid="browse-card-register-poster">
                    {t.browse.card2Cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 3: Browse Service Providers */}
            <motion.div
              className="group relative rounded-3xl overflow-hidden flex flex-col bg-slate-50 border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              viewport={{ once: true }}
            >
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=75&fit=crop"
                  alt="Browse approved Service Providers"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
                <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 leading-snug">{t.browse.providersTitle}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.providersDesc}</p>
                </div>
                <Link href="/companies">
                  <Button variant="outline" className="w-full border-border text-foreground hover:border-primary hover:text-primary transition-colors" data-testid="browse-card-view-providers">
                    {t.browse.providersCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 4: Offer Services */}
            <motion.div
              className="group relative rounded-3xl overflow-hidden flex flex-col"
              style={{ background: "linear-gradient(145deg, #0d2151 0%, #1a3a6e 60%, #1e4b8a 100%)" }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              viewport={{ once: true }}
            >
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75&fit=crop"
                  alt="Create a Service Provider profile"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d2151]/95 via-[#0d2151]/30 to-transparent" />
                <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute top-5 right-5">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t.browse.card4Label}</span>
                </div>
              </div>
              <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 leading-snug">{t.browse.card4Title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{t.browse.card4Desc}</p>
                </div>
                <Link href="/signup?account_type=service_provider">
                  <Button className="w-full bg-white text-foreground hover:bg-white/92 font-semibold" data-testid="browse-card-register-provider">
                    {t.browse.card4Cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
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
          <div className="flex flex-wrap items-center gap-2.5 mb-10 bg-[#f7f8fb] rounded-2xl px-5 py-3.5 border border-border/60">
            <select
              value={listingTypeFilter}
              onChange={e => setListingTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t.listings.filterAllTypes ?? "All types"}</option>
              {serviceCategories.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={listingCityFilter}
                onChange={e => setListingCityFilter(e.target.value)}
                placeholder={t.listings.filterCity ?? "Filter by city"}
                className="h-9 rounded-lg border border-border bg-white pl-7 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36 md:w-44"
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
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t.listings.filterAllBudgets ?? "All budgets"}</option>
              <option value="under-10k">{"< 10k"}</option>
              <option value="10k-50k">{"10k – 50k"}</option>
              <option value="50k-100k">{"50k – 100k"}</option>
              <option value="100k-500k">{"100k – 500k"}</option>
              <option value="over-500k">{"> 500k"}</option>
            </select>
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
              <span className="text-xs text-muted-foreground ml-auto">
                {previewProjects.length} {previewProjects.length === 1 ? (t.listings.result ?? "result") : (t.listings.results ?? "results")}
              </span>
            )}
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
                    <div className="bg-white/98 backdrop-blur-sm border border-border rounded-3xl px-10 py-10 text-center shadow-2xl shadow-black/10 max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-5">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-6 leading-relaxed">{t.listings.gateLabel}</p>
                      <Link href="/signup?account_type=service_provider">
                        <Button size="lg" className="w-full" data-testid="listings-gate-cta">
                          {t.listings.gateCta}
                        </Button>
                      </Link>
                    </div>
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
          TRUSTED BY — infinite ticker
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 bg-[#f7f8fb] border-y border-border overflow-hidden">
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
              {carouselCompanies ? (
                carouselCompanies.map((company, idx) => (
                  <div key={`live-${idx}`} className="flex-shrink-0 w-64">
                    <ProviderCard provider={company} />
                  </div>
                ))
              ) : ([
                { initials: "ZR", name: "Zurich Renovation GmbH", category: language === "de" ? "Renovierung" : language === "sq" ? "Rinovim" : language === "fr" ? "Rénovation" : "Renovation", city: "Zürich", rating: 4.9, color: "#0f172a", accent: "#3b82f6", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f172a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">ZR</text><path d="M15 28 L18 23 L22 27 L26 22 L29 28" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="31" cy="25" r="1.5" fill="#3b82f6"/></svg>) },
                { initials: "SH", name: "SwissHome Services", category: language === "de" ? "Hausdienstleistungen" : language === "sq" ? "Shërbime Shtëpie" : language === "fr" ? "Services Maison" : "Home Services", city: "Bern", rating: 4.8, color: "#1e3a5f", accent: "#60a5fa", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#1e3a5f"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SH</text><path d="M16 29 L16 24 L22 20 L28 24 L28 29 Z" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M19 29 L19 26 L25 26 L25 29" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>) },
                { initials: "AM", name: "Alpine Maler AG", category: language === "de" ? "Malerarbeiten" : language === "sq" ? "Pikturë" : language === "fr" ? "Peinture" : "Painting", city: "Luzern", rating: 4.9, color: "#0c2340", accent: "#93c5fd", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0c2340"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">AM</text><path d="M19 29 L19 24 L22 21 L25 24" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="22" cy="29" r="2.2" fill="#93c5fd"/></svg>) },
                { initials: "BB", name: "Basel Bau Partner", category: language === "de" ? "Bauwesen" : language === "sq" ? "Ndërtim" : language === "fr" ? "Construction" : "Construction", city: "Basel", rating: 4.7, color: "#162032", accent: "#38bdf8", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#162032"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BB</text><rect x="15" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/><rect x="23" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/><rect x="19" y="21" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/></svg>) },
                { initials: "GI", name: "Geneva Interior Studio", category: language === "de" ? "Innendesign" : language === "sq" ? "Dizajn Interior" : language === "fr" ? "Design d'Intérieur" : "Interior Design", city: "Geneva", rating: 4.8, color: "#1a1a2e", accent: "#818cf8", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#1a1a2e"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">GI</text><line x1="15" y1="23" x2="29" y2="23" stroke="#818cf8" strokeWidth="1.5"/><line x1="15" y1="26.5" x2="25" y2="26.5" stroke="#818cf8" strokeWidth="1.5"/><line x1="15" y1="30" x2="27" y2="30" stroke="#818cf8" strokeWidth="1.5"/><circle cx="29" cy="27" r="2" fill="#818cf8"/></svg>) },
                { initials: "BE", name: "Bern Elektro Service", category: language === "de" ? "Elektroinstallation" : language === "sq" ? "Elektricitet" : language === "fr" ? "Électricité" : "Electrical", city: "Bern", rating: 4.9, color: "#0f172a", accent: "#facc15", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f172a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BE</text><path d="M23.5 20.5 L20 25.5 L23 25.5 L20.5 30.5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>) },
                { initials: "LS", name: "Luzern Sanitär Team", category: language === "de" ? "Sanitär" : language === "sq" ? "Hidraulikë" : language === "fr" ? "Plomberie" : "Plumbing", city: "Luzern", rating: 4.8, color: "#0e3460", accent: "#7dd3fc", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0e3460"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">LS</text><path d="M22 21 C19 24 17 26 17 28 C17 30.2 19.2 32 22 32 C24.8 32 27 30.2 27 28 C27 26 25 24 22 21Z" stroke="#7dd3fc" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>) },
                { initials: "TG", name: "Ticino Gartenbau", category: language === "de" ? "Garten & Outdoor" : language === "sq" ? "Kopsht & Natyrë" : language === "fr" ? "Jardin & Extérieur" : "Garden & Outdoor", city: "Lugano", rating: 4.7, color: "#14291a", accent: "#86efac", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#14291a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">TG</text><path d="M22 30 L22 25" stroke="#86efac" strokeWidth="1.8" strokeLinecap="round"/><path d="M22 25 C22 25 19 22 17 20 C19 20 21 21 22 22 C22 21 21.5 19 22 18 C22.5 19 22 21 22 22 C23 21 25 20 27 20 C25 22 22 25 22 25Z" fill="#86efac"/></svg>) },
                { initials: "LC", name: "Lausanne Cleaning Experts", category: language === "de" ? "Reinigung" : language === "sq" ? "Pastrim" : language === "fr" ? "Nettoyage" : "Cleaning", city: "Lausanne", rating: 4.8, color: "#0c1e3c", accent: "#a5f3fc", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0c1e3c"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">LC</text><path d="M22 22 L22 24" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 23.5 L20 24.8" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/><path d="M25.5 23.5 L24 24.8" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/><circle cx="22" cy="27.5" r="2.5" stroke="#a5f3fc" strokeWidth="1.5" fill="none"/></svg>) },
                { initials: "SG", name: "St. Gallen Smart Home", category: language === "de" ? "Smart Home" : language === "sq" ? "Shtëpi Inteligjente" : language === "fr" ? "Maison Connectée" : "Smart Home", city: "St. Gallen", rating: 4.9, color: "#0f1f3d", accent: "#6ee7b7", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f1f3d"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SG</text><path d="M15 24 Q22 20 29 24" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none"/><path d="M17.5 26.5 Q22 23.5 26.5 26.5" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none"/><circle cx="22" cy="29" r="1.8" fill="#6ee7b7"/></svg>) },
              ].concat([
                { initials: "ZR", name: "Zurich Renovation GmbH", category: language === "de" ? "Renovierung" : language === "sq" ? "Rinovim" : language === "fr" ? "Rénovation" : "Renovation", city: "Zürich", rating: 4.9, color: "#0f172a", accent: "#3b82f6", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f172a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">ZR</text><path d="M15 28 L18 23 L22 27 L26 22 L29 28" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="31" cy="25" r="1.5" fill="#3b82f6"/></svg>) },
                { initials: "SH", name: "SwissHome Services", category: language === "de" ? "Hausdienstleistungen" : language === "sq" ? "Shërbime Shtëpie" : language === "fr" ? "Services Maison" : "Home Services", city: "Bern", rating: 4.8, color: "#1e3a5f", accent: "#60a5fa", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#1e3a5f"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SH</text><path d="M16 29 L16 24 L22 20 L28 24 L28 29 Z" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M19 29 L19 26 L25 26 L25 29" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>) },
                { initials: "AM", name: "Alpine Maler AG", category: language === "de" ? "Malerarbeiten" : language === "sq" ? "Pikturë" : language === "fr" ? "Peinture" : "Painting", city: "Luzern", rating: 4.9, color: "#0c2340", accent: "#93c5fd", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0c2340"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">AM</text><path d="M19 29 L19 24 L22 21 L25 24" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="22" cy="29" r="2.2" fill="#93c5fd"/></svg>) },
                { initials: "BB", name: "Basel Bau Partner", category: language === "de" ? "Bauwesen" : language === "sq" ? "Ndërtim" : language === "fr" ? "Construction" : "Construction", city: "Basel", rating: 4.7, color: "#162032", accent: "#38bdf8", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#162032"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BB</text><rect x="15" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/><rect x="23" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/><rect x="19" y="21" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/></svg>) },
                { initials: "GI", name: "Geneva Interior Studio", category: language === "de" ? "Innendesign" : language === "sq" ? "Dizajn Interior" : language === "fr" ? "Design d'Intérieur" : "Interior Design", city: "Geneva", rating: 4.8, color: "#1a1a2e", accent: "#818cf8", logo: (<svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#1a1a2e"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">GI</text><line x1="15" y1="23" x2="29" y2="23" stroke="#818cf8" strokeWidth="1.5"/><line x1="15" y1="26.5" x2="25" y2="26.5" stroke="#818cf8" strokeWidth="1.5"/><line x1="15" y1="30" x2="27" y2="30" stroke="#818cf8" strokeWidth="1.5"/><circle cx="29" cy="27" r="2" fill="#818cf8"/></svg>) },
              ]).map((company, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-56 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 p-5 flex flex-col gap-3 select-none"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">{company.logo}</div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      { language === "de" ? "Geprüft" : language === "sq" ? "Verifikuar" : language === "fr" ? "Vérifié" : "Verified" }
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-snug">{company.name}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-primary bg-primary/6 rounded-full px-2.5 py-0.5">{company.category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {company.city}
                    </div>
                    <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {company.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS — numbered editorial steps
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 md:py-32 bg-white scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.howItWorks.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-xl">{t.howItWorks.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
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
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{t.howItWorks.posterSubtitle}</p>
                <div className="flex flex-col gap-6">
                  {([
                    { step: t.howItWorks.posterStep1, icon: User },
                    { step: t.howItWorks.posterStep2, icon: FileText },
                    { step: t.howItWorks.posterStep3, icon: Clock },
                    { step: t.howItWorks.posterStep4, icon: Users },
                    { step: t.howItWorks.posterStep5, icon: CheckCircle2 },
                  ] as { step: string; icon: React.ElementType }[]).map(({ step, icon: StepIcon }, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      </div>
                      <div className="flex items-start gap-3 flex-1 pt-1">
                        <StepIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 opacity-70" />
                        <p className="text-sm text-foreground leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/signup?account_type=project_poster">
                    <Button data-testid="hiw-poster-cta">
                      {t.howItWorks.posterCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
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
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{t.howItWorks.providerSubtitle}</p>
                <div className="flex flex-col gap-6">
                  {([
                    { step: t.howItWorks.providerStep1, icon: User },
                    { step: t.howItWorks.providerStep2, icon: Clock },
                    { step: t.howItWorks.providerStep3, icon: Search },
                    { step: t.howItWorks.providerStep4, icon: ArrowRight },
                    { step: t.howItWorks.providerStep5, icon: HeadphonesIcon },
                  ] as { step: string; icon: React.ElementType }[]).map(({ step, icon: StepIcon }, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-foreground text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      </div>
                      <div className="flex items-start gap-3 flex-1 pt-1">
                        <StepIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 opacity-70" />
                        <p className="text-sm text-foreground leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/signup?account_type=service_provider">
                    <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/6" data-testid="hiw-provider-cta">
                      {t.howItWorks.providerCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
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
          TESTIMONIALS — pull-quote editorial style
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-[#f7f8fb]">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.testimonials.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-xl">{t.testimonials.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {testimonials.map((t_, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white border border-border rounded-3xl p-8 flex flex-col gap-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Opening quote mark */}
                <div className="text-6xl leading-none font-serif text-primary/15 select-none mt-[-8px]">"</div>

                {/* Stars */}
                <div className="flex gap-0.5 -mt-6">
                  {Array.from({ length: t_.rating }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground/75 text-sm leading-[1.8] flex-1 italic">
                  {t_.text}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-border pt-5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {t_.author.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground leading-tight">{t_.author}</p>
                    <p className="text-xs text-muted-foreground">{t_.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ACCOUNT TYPES — inline with CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">{t.accountTypes.title}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-xl">{t.accountTypes.title}</h2>
            <div className="w-10 h-0.5 bg-primary mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
            <motion.div
              className="group relative rounded-3xl border border-border p-9 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/6 transition-all duration-300 bg-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-6">
                <HomeIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-3">{t.accountTypes.posterLabel}</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-7">{t.accountTypes.posterDesc}</p>
              <div className="space-y-3 mb-0">
                <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.posterSub1}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.posterSub2}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-3xl bg-primary/3 translate-x-4 translate-y-4" />
            </motion.div>

            <motion.div
              className="group relative rounded-3xl border border-border p-9 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/6 transition-all duration-300 bg-white overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-6">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-3">{t.accountTypes.providerLabel}</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-7">{t.accountTypes.providerDesc}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.providerSub1}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.providerSub2}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-3xl bg-primary/3 translate-x-4 translate-y-4" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA — full-bleed cinematic dark
      ══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-36 overflow-hidden" style={{ background: "linear-gradient(145deg,#060e24 0%,#0d1f4d 50%,#0f2660 100%)" }}>
        {/* Ambient orbs */}
        <div className="absolute top-[-20%] right-[-5%] w-[55%] h-[130%] rounded-full bg-primary opacity-[0.12] blur-[180px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[100%] rounded-full bg-blue-500 opacity-[0.07] blur-[150px] pointer-events-none" />

        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-5">ImmoVia365</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.06] tracking-tight">{t.cta.title}</h2>
            <p className="text-white/45 text-lg leading-relaxed">{t.cta.subtitle}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            viewport={{ once: true }}
          >
            {/* Project Poster card */}
            <div className="relative rounded-3xl p-8 flex flex-col gap-5 overflow-hidden border border-primary/30 bg-primary/15 backdrop-blur-sm hover:bg-primary/20 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/15 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-white/45 uppercase tracking-widest mb-2">{t.hero.persona1Label}</div>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">{t.cta.button}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{t.cta.subtitle}</p>
              </div>
              <Link href="/signup?account_type=project_poster">
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/92 font-semibold w-full shadow-lg"
                  data-testid="footer-cta-project"
                >
                  {t.cta.button}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Service Provider card */}
            <div className="relative rounded-3xl p-8 flex flex-col gap-5 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/8 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-white/12 border border-white/12 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-white/45 uppercase tracking-widest mb-2">{t.hero.persona2Label}</div>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">{t.cta.companyTitle}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{t.cta.companySubtitle}</p>
              </div>
              <Link href="/signup?account_type=service_provider">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/12 font-semibold w-full"
                  data-testid="footer-cta-company"
                >
                  {t.cta.companyButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

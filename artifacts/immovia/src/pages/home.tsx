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
  renovation:     Hammer,
  painting:       Paintbrush,
  electrical:     Zap,
  plumbing:       Wrench,
  kitchen:        ChefHat,
  flooring:       SquareStack,
  interior_design: Sofa,
  cleaning:       Leaf,
  other:          HelpCircle,
  construction:   Building2,
  interior:       Sofa,
  exterior:       TreePine,
  electric:       Plug,
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
  // Inbound URL → state
  useEffect(() => {
    const p = new URLSearchParams(search);
    setListingTypeFilter(p.get("type") ?? "");
    setListingCityFilter(p.get("city") ?? "");
    setListingSizeFilter(p.get("size") ?? "");
    setListingBudgetFilter(p.get("budget") ?? "");
  }, [search]);
  // Outbound state → URL
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

  // ── Parallax & 3-D mouse tracking ──
  const heroRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 18 });

  // Video shifts opposite to cursor (parallax depth illusion)
  const vidX = useTransform(springX, [-0.5, 0.5], ["5%", "-5%"]);
  const vidY = useTransform(springY, [-0.5, 0.5], ["5%", "-5%"]);

  // Content tilts subtly in the same direction
  const tiltX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  // Scroll: video rises as you scroll down (parallax)
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
          // silent fail — user can type manually
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

      {/* ── HERO ── */}
      <motion.section
        ref={heroRef}
        className="relative overflow-hidden bg-foreground text-white py-16 md:py-24 lg:py-32"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── VIDEO BACKGROUND (scroll + mouse parallax) ── */}
        <motion.div className="absolute inset-[-12%]" style={{ y: scrollVidY }}>
          <motion.div className="absolute inset-0" style={{ x: vidX, y: vidY }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80&fit=crop"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-workers-on-a-construction-site-with-cranes-in-the-background-42737-large.mp4" type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-construction-site-structure-of-a-house-being-built-40742-large.mp4" type="video/mp4" />
            </video>
            {/* Deep cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/65 to-foreground/88" />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
          </motion.div>
        </motion.div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none z-[1]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* Glow orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[80%] rounded-full bg-primary opacity-[0.12] blur-[130px] pointer-events-none z-[1]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[70%] rounded-full bg-blue-400 opacity-[0.08] blur-[110px] pointer-events-none z-[1]" />

        {/* Content — subtle 3-D tilt follows cursor */}
        <motion.div
          className="container mx-auto px-4 relative z-10"
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1400, transformStyle: "preserve-3d" }}
        >
          <div className="max-w-3xl mx-auto">
          <motion.div className="text-center" initial="initial" animate="animate" variants={stagger}>

            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              <Star className="w-3 h-3 text-primary fill-primary" />
              {t.hero.badge}
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.08] text-white"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}>
              {t.search.headline}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base md:text-lg font-light text-white/80 mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
              {t.search.subtitle}
            </motion.p>

            {/* ── Smart Search Card ── */}
            <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden mb-6 text-left">

              {/* Tabs */}
              <div className="flex">
                <button
                  onClick={() => setActiveTab("service")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-200 border-b-2 min-h-[52px] ${
                    activeTab === "service"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="leading-tight text-center">{t.search.tab1}</span>
                </button>
                <button
                  onClick={() => setActiveTab("project")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-200 border-b-2 min-h-[52px] ${
                    activeTab === "project"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                  }`}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="leading-tight text-center">{t.search.tab2}</span>
                </button>
              </div>

              {/* Inputs */}
              <div className="p-5">
                <p className="text-xs text-muted-foreground mb-4">
                  {activeTab === "service" ? t.search.tab1Helper : t.search.tab2Helper}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 min-w-0" ref={suggestWrapRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <input
                      value={searchKeyword}
                      onChange={e => {
                        setSearchKeyword(e.target.value);
                        fetchSuggestions(e.target.value, activeTab);
                      }}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { setShowSuggestions(false); handleSearch(); }
                        if (e.key === "Escape") setShowSuggestions(false);
                      }}
                      placeholder={activeTab === "service" ? t.search.keywordPlaceholder1 : t.search.keywordPlaceholder2}
                      className="w-full h-11 rounded-xl border border-border bg-muted/30 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                        {suggestions.map((s, i) => (
                          <li
                            key={i}
                            onMouseDown={() => {
                              setSearchKeyword(s);
                              setShowSuggestions(false);
                            }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-primary/8 cursor-pointer transition-colors"
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
                    className="h-11 rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-44"
                  >
                    <option value="">{t.search.categoryAll}</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                  <div className="relative sm:w-44">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      value={searchCity}
                      onChange={e => setSearchCity(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                      placeholder={t.search.locationPlaceholder}
                      className="w-full h-11 rounded-xl border border-border bg-muted/30 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isLocating}
                      title="Detect my location"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                    >
                      {isLocating
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <LocateFixed className="h-4 w-4" />
                      }
                    </button>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 sm:flex-shrink-0"
                    data-testid="hero-smart-search-btn"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {activeTab === "service" ? t.search.btn1 : t.search.btn2}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Sub-CTA */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-white/65 text-sm" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {t.search.ctaText}
              </span>
              <div className="flex gap-2 flex-wrap justify-center">
                <Link href="/signup?account_type=project_poster">
                  <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold" data-testid="hero-cta-project">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    {t.search.ctaPost}
                  </Button>
                </Link>
                <Link href="/signup?account_type=service_provider">
                  <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/15 backdrop-blur-sm font-semibold" data-testid="hero-cta-company">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                    {t.search.ctaOffer}
                  </Button>
                </Link>
              </div>
            </motion.div>

          </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground mt-1">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE MARKETPLACE ── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.browse.title}</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Card 1: Browse Projects (browse only) */}
            <motion.div
              className="bg-muted/40 border border-border rounded-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.0 }}
              viewport={{ once: true }}
            >
              <div className="relative h-44 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=75&fit=crop"
                  alt="Browse open projects"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-muted/80 to-transparent" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{t.browse.projectsTitle}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.projectsDesc}</p>
                </div>
                <Link href="/projects">
                  <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/8" data-testid="browse-card-view-projects">
                    {t.browse.projectsCta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 2: Post a Project (registration) */}
            <motion.div
              className="bg-primary rounded-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="relative h-44 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=75&fit=crop"
                  alt="Post a new project"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/20" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{t.browse.card2Label}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{t.browse.card2Title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{t.browse.card2Desc}</p>
                </div>
                <Link href="/signup?account_type=project_poster">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 font-semibold" data-testid="browse-card-register-poster">
                    {t.browse.card2Cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 3: Browse Service Providers (browse only) */}
            <motion.div
              className="bg-muted/40 border border-border rounded-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="relative h-44 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=75&fit=crop"
                  alt="Browse approved Service Providers"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-muted/80 to-transparent" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{t.browse.providersTitle}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.providersDesc}</p>
                </div>
                <Link href="/companies">
                  <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/8" data-testid="browse-card-view-providers">
                    {t.browse.providersCta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Card 4: Offer Services (registration) */}
            <motion.div
              className="bg-primary rounded-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="relative h-44 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75&fit=crop"
                  alt="Create a Service Provider profile"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/20" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{t.browse.card4Label}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{t.browse.card4Title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{t.browse.card4Desc}</p>
                </div>
                <Link href="/signup?account_type=service_provider">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 font-semibold" data-testid="browse-card-register-provider">
                    {t.browse.card4Cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── OUR PROFESSIONALS ── */}
      <section className="py-14 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.professionals.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.professionals.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={`/companies?service=${s.serviceKey}`}>
                  <div
                    className="group relative rounded-2xl overflow-hidden cursor-pointer h-72 shadow-md hover:shadow-xl transition-all duration-300"
                    data-testid={`service-card-${i}`}
                  >
                    {/* Photo background — only rendered when imageUrl exists */}
                    {s.photo ? (
                      <img
                        src={s.photo}
                        alt={s.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a6e] via-[#2a5298] to-[#1a3a6e]" />
                    )}
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                    {/* Icon badge top-left */}
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-bold text-white text-lg leading-tight mb-1">{s.title}</h3>
                      <p className="text-white/75 text-xs leading-relaxed line-clamp-2 mb-3">{s.desc}</p>
                      <div className="flex items-center justify-end">
                        <span className="flex items-center gap-1 text-xs text-white/80 group-hover:text-white transition-colors font-medium">
                          {t.offers.cta}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PROJECT LISTINGS PREVIEW ── */}
      <section className="py-14 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.listings.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.listings.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8 bg-white rounded-xl px-4 py-3 border border-border shadow-sm">
            <select
              value={listingTypeFilter}
              onChange={e => setListingTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="h-9 rounded-lg border border-border bg-muted/40 pl-7 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36 md:w-44"
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
              className="h-9 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="h-9 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-foreground font-semibold mb-1">{t.listings.noResultsFilter ?? "No projects match your filters"}</p>
              <p className="text-sm text-muted-foreground mb-4">{t.listings.noResultsFilterHint ?? "Try different filters or clear them."}</p>
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
                {previewProjects.map((project, idx) => (
                  <motion.div key={project.id} variants={fadeUp}>
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </motion.div>

            {!user && (
                <div className="relative mt-5">
                  <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-muted/30 z-10 pointer-events-none" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
                    {previewProjects.slice(0, 3).map((project, idx) => (
                      <div key={`ghost-${idx}`}>
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
                        <Button size="lg" className="w-full" data-testid="listings-gate-cta">
                          {t.listings.gateCta}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              {user && (
                <div className="text-center mt-10">
                  <Link href="/projects">
                    <Button variant="outline" size="lg" data-testid="listings-see-all">
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

      {/* ── TRUSTED BY PROFESSIONALS ── */}
      <section className="py-14 md:py-20 bg-slate-50 border-y border-border overflow-hidden">
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

        {/* Heading */}
        <div className="container mx-auto px-4 mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
              { language === "de" ? "Geprüfte Fachleute" : language === "sq" ? "Profesionistë të verifikuar" : language === "fr" ? "Professionnels certifiés" : "Verified Professionals" }
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              { language === "de" ? "Vertrauen von lokalen Fachleuten" : language === "sq" ? "Të besuar nga profesionistët lokalë" : language === "fr" ? "La confiance des professionnels locaux" : "Trusted by local professionals" }
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              { language === "de" ? "Beispielunternehmen und Fachleute, die über ImmoVia365 Renovierungs- und Heimwerkerprojekte annehmen." : language === "sq" ? "Kompani dhe profesionistë shembullorë të gatshëm të marrin projekte nëpërmjet ImmoVia365." : language === "fr" ? "Des entreprises et professionnels exemplaires prêts à recevoir des projets via ImmoVia365." : "Example professionals and companies ready to receive renovation, repair, and home service projects through ImmoVia365." }
            </p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>
        </div>

        {/* Carousel — gradient fade edges */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-28 z-10 pointer-events-none bg-gradient-to-r from-slate-50 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-28 z-10 pointer-events-none bg-gradient-to-l from-slate-50 to-transparent" />

          <div className="overflow-hidden">
            <div className="immovia-ticker-track flex gap-5 w-max">
              {carouselCompanies ? (
                carouselCompanies.map((company, idx) => (
                  <div key={`live-${idx}`} className="flex-shrink-0 w-64">
                    <ProviderCard provider={company} />
                  </div>
                ))
              ) : ([
                {
                  initials: "ZR",
                  name: "Zurich Renovation GmbH",
                  category: language === "de" ? "Renovierung" : language === "sq" ? "Rinovim" : language === "fr" ? "Rénovation" : "Renovation",
                  city: "Zürich",
                  rating: 4.9,
                  color: "#0f172a",
                  accent: "#3b82f6",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#0f172a"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">ZR</text>
                      <path d="M15 28 L18 23 L22 27 L26 22 L29 28" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <circle cx="31" cy="25" r="1.5" fill="#3b82f6"/>
                    </svg>
                  ),
                },
                {
                  initials: "SH",
                  name: "SwissHome Services",
                  category: language === "de" ? "Hausdienstleistungen" : language === "sq" ? "Shërbime Shtëpie" : language === "fr" ? "Services Maison" : "Home Services",
                  city: "Bern",
                  rating: 4.8,
                  color: "#1e3a5f",
                  accent: "#60a5fa",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#1e3a5f"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SH</text>
                      <path d="M16 29 L16 24 L22 20 L28 24 L28 29 Z" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M19 29 L19 26 L25 26 L25 29" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  ),
                },
                {
                  initials: "AM",
                  name: "Alpine Maler AG",
                  category: language === "de" ? "Malerarbeiten" : language === "sq" ? "Pikturë" : language === "fr" ? "Peinture" : "Painting",
                  city: "Luzern",
                  rating: 4.9,
                  color: "#0c2340",
                  accent: "#93c5fd",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#0c2340"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">AM</text>
                      <path d="M19 29 L19 24 L22 21 L25 24" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <circle cx="22" cy="29" r="2.2" fill="#93c5fd"/>
                      <path d="M22 26.8 L22 27.5" stroke="#0c2340" strokeWidth="1"/>
                    </svg>
                  ),
                },
                {
                  initials: "BB",
                  name: "Basel Bau Partner",
                  category: language === "de" ? "Bauwesen" : language === "sq" ? "Ndërtim" : language === "fr" ? "Construction" : "Construction",
                  city: "Basel",
                  rating: 4.7,
                  color: "#162032",
                  accent: "#38bdf8",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#162032"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BB</text>
                      <rect x="15" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/>
                      <rect x="23" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/>
                      <rect x="19" y="21" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/>
                    </svg>
                  ),
                },
                {
                  initials: "GI",
                  name: "Geneva Interior Studio",
                  category: language === "de" ? "Innendesign" : language === "sq" ? "Dizajn Interior" : language === "fr" ? "Design d'Intérieur" : "Interior Design",
                  city: "Geneva",
                  rating: 4.8,
                  color: "#1a1a2e",
                  accent: "#818cf8",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#1a1a2e"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">GI</text>
                      <line x1="15" y1="23" x2="29" y2="23" stroke="#818cf8" strokeWidth="1.5"/>
                      <line x1="15" y1="26.5" x2="25" y2="26.5" stroke="#818cf8" strokeWidth="1.5"/>
                      <line x1="15" y1="30" x2="27" y2="30" stroke="#818cf8" strokeWidth="1.5"/>
                      <circle cx="29" cy="27" r="2" fill="#818cf8"/>
                    </svg>
                  ),
                },
                {
                  initials: "BE",
                  name: "Bern Elektro Service",
                  category: language === "de" ? "Elektroinstallation" : language === "sq" ? "Elektricitet" : language === "fr" ? "Électricité" : "Electrical",
                  city: "Bern",
                  rating: 4.9,
                  color: "#0f172a",
                  accent: "#facc15",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#0f172a"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BE</text>
                      <path d="M23.5 20.5 L20 25.5 L23 25.5 L20.5 30.5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  ),
                },
                {
                  initials: "LS",
                  name: "Luzern Sanitär Team",
                  category: language === "de" ? "Sanitär" : language === "sq" ? "Hidraulikë" : language === "fr" ? "Plomberie" : "Plumbing",
                  city: "Luzern",
                  rating: 4.8,
                  color: "#0e3460",
                  accent: "#7dd3fc",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#0e3460"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">LS</text>
                      <path d="M22 21 C19 24 17 26 17 28 C17 30.2 19.2 32 22 32 C24.8 32 27 30.2 27 28 C27 26 25 24 22 21Z" stroke="#7dd3fc" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
                {
                  initials: "TG",
                  name: "Ticino Gartenbau",
                  category: language === "de" ? "Garten & Outdoor" : language === "sq" ? "Kopsht & Natyrë" : language === "fr" ? "Jardin & Extérieur" : "Garden & Outdoor",
                  city: "Lugano",
                  rating: 4.7,
                  color: "#14291a",
                  accent: "#86efac",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#14291a"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">TG</text>
                      <path d="M22 30 L22 25" stroke="#86efac" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M22 25 C22 25 19 22 17 20 C19 20 21 21 22 22 C22 21 21.5 19 22 18 C22.5 19 22 21 22 22 C23 21 25 20 27 20 C25 22 22 25 22 25Z" fill="#86efac"/>
                    </svg>
                  ),
                },
                {
                  initials: "LC",
                  name: "Lausanne Cleaning Experts",
                  category: language === "de" ? "Reinigung" : language === "sq" ? "Pastrim" : language === "fr" ? "Nettoyage" : "Cleaning",
                  city: "Lausanne",
                  rating: 4.8,
                  color: "#0c1e3c",
                  accent: "#a5f3fc",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#0c1e3c"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">LC</text>
                      <path d="M22 22 L22 24" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M18.5 23.5 L20 24.8" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M25.5 23.5 L24 24.8" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="22" cy="27.5" r="2.5" stroke="#a5f3fc" strokeWidth="1.5" fill="none"/>
                      <circle cx="17.5" cy="28.5" r="1.5" stroke="#a5f3fc" strokeWidth="1.2" fill="none"/>
                      <circle cx="26.5" cy="28.5" r="1.5" stroke="#a5f3fc" strokeWidth="1.2" fill="none"/>
                    </svg>
                  ),
                },
                {
                  initials: "SG",
                  name: "St. Gallen Smart Home",
                  category: language === "de" ? "Smart Home" : language === "sq" ? "Shtëpi Inteligjente" : language === "fr" ? "Maison Connectée" : "Smart Home",
                  city: "St. Gallen",
                  rating: 4.9,
                  color: "#0f1f3d",
                  accent: "#6ee7b7",
                  logo: (
                    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full">
                      <rect width="44" height="44" rx="10" fill="#0f1f3d"/>
                      <text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SG</text>
                      <path d="M15 24 Q22 20 29 24" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                      <path d="M17.5 26.5 Q22 23.5 26.5 26.5" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                      <circle cx="22" cy="29" r="1.8" fill="#6ee7b7"/>
                    </svg>
                  ),
                },
              ].concat([
                {
                  initials: "ZR", name: "Zurich Renovation GmbH",
                  category: language === "de" ? "Renovierung" : language === "sq" ? "Rinovim" : language === "fr" ? "Rénovation" : "Renovation",
                  city: "Zürich", rating: 4.9, color: "#0f172a", accent: "#3b82f6",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f172a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">ZR</text><path d="M15 28 L18 23 L22 27 L26 22 L29 28" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="31" cy="25" r="1.5" fill="#3b82f6"/></svg>,
                },
                {
                  initials: "SH", name: "SwissHome Services",
                  category: language === "de" ? "Hausdienstleistungen" : language === "sq" ? "Shërbime Shtëpie" : language === "fr" ? "Services Maison" : "Home Services",
                  city: "Bern", rating: 4.8, color: "#1e3a5f", accent: "#60a5fa",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#1e3a5f"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SH</text><path d="M16 29 L16 24 L22 20 L28 24 L28 29 Z" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M19 29 L19 26 L25 26 L25 29" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
                },
                {
                  initials: "AM", name: "Alpine Maler AG",
                  category: language === "de" ? "Malerarbeiten" : language === "sq" ? "Pikturë" : language === "fr" ? "Peinture" : "Painting",
                  city: "Luzern", rating: 4.9, color: "#0c2340", accent: "#93c5fd",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0c2340"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">AM</text><path d="M19 29 L19 24 L22 21 L25 24" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="22" cy="29" r="2.2" fill="#93c5fd"/></svg>,
                },
                {
                  initials: "BB", name: "Basel Bau Partner",
                  category: language === "de" ? "Bauwesen" : language === "sq" ? "Ndërtim" : language === "fr" ? "Construction" : "Construction",
                  city: "Basel", rating: 4.7, color: "#162032", accent: "#38bdf8",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#162032"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BB</text><rect x="15" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/><rect x="23" y="25" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/><rect x="19" y="21" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.6" fill="none"/></svg>,
                },
                {
                  initials: "GI", name: "Geneva Interior Studio",
                  category: language === "de" ? "Innendesign" : language === "sq" ? "Dizajn Interior" : language === "fr" ? "Design d'Intérieur" : "Interior Design",
                  city: "Geneva", rating: 4.8, color: "#1a1a2e", accent: "#818cf8",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#1a1a2e"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">GI</text><line x1="15" y1="23" x2="29" y2="23" stroke="#818cf8" strokeWidth="1.5"/><line x1="15" y1="26.5" x2="25" y2="26.5" stroke="#818cf8" strokeWidth="1.5"/><line x1="15" y1="30" x2="27" y2="30" stroke="#818cf8" strokeWidth="1.5"/><circle cx="29" cy="27" r="2" fill="#818cf8"/></svg>,
                },
                {
                  initials: "BE", name: "Bern Elektro Service",
                  category: language === "de" ? "Elektroinstallation" : language === "sq" ? "Elektricitet" : language === "fr" ? "Électricité" : "Electrical",
                  city: "Bern", rating: 4.9, color: "#0f172a", accent: "#facc15",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f172a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">BE</text><path d="M23.5 20.5 L20 25.5 L23 25.5 L20.5 30.5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
                },
                {
                  initials: "LS", name: "Luzern Sanitär Team",
                  category: language === "de" ? "Sanitär" : language === "sq" ? "Hidraulikë" : language === "fr" ? "Plomberie" : "Plumbing",
                  city: "Luzern", rating: 4.8, color: "#0e3460", accent: "#7dd3fc",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0e3460"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">LS</text><path d="M22 21 C19 24 17 26 17 28 C17 30.2 19.2 32 22 32 C24.8 32 27 30.2 27 28 C27 26 25 24 22 21Z" stroke="#7dd3fc" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
                },
                {
                  initials: "TG", name: "Ticino Gartenbau",
                  category: language === "de" ? "Garten & Outdoor" : language === "sq" ? "Kopsht & Natyrë" : language === "fr" ? "Jardin & Extérieur" : "Garden & Outdoor",
                  city: "Lugano", rating: 4.7, color: "#14291a", accent: "#86efac",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#14291a"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">TG</text><path d="M22 30 L22 25" stroke="#86efac" strokeWidth="1.8" strokeLinecap="round"/><path d="M22 25 C22 25 19 22 17 20 C19 20 21 21 22 22 C22 21 21.5 19 22 18 C22.5 19 22 21 22 22 C23 21 25 20 27 20 C25 22 22 25 22 25Z" fill="#86efac"/></svg>,
                },
                {
                  initials: "LC", name: "Lausanne Cleaning Experts",
                  category: language === "de" ? "Reinigung" : language === "sq" ? "Pastrim" : language === "fr" ? "Nettoyage" : "Cleaning",
                  city: "Lausanne", rating: 4.8, color: "#0c1e3c", accent: "#a5f3fc",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0c1e3c"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">LC</text><path d="M22 22 L22 24" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 23.5 L20 24.8" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/><path d="M25.5 23.5 L24 24.8" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round"/><circle cx="22" cy="27.5" r="2.5" stroke="#a5f3fc" strokeWidth="1.5" fill="none"/></svg>,
                },
                {
                  initials: "SG", name: "St. Gallen Smart Home",
                  category: language === "de" ? "Smart Home" : language === "sq" ? "Shtëpi Inteligjente" : language === "fr" ? "Maison Connectée" : "Smart Home",
                  city: "St. Gallen", rating: 4.9, color: "#0f1f3d", accent: "#6ee7b7",
                  logo: <svg viewBox="0 0 44 44" fill="none" className="w-full h-full"><rect width="44" height="44" rx="10" fill="#0f1f3d"/><text x="22" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">SG</text><path d="M15 24 Q22 20 29 24" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none"/><path d="M17.5 26.5 Q22 23.5 26.5 26.5" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" fill="none"/><circle cx="22" cy="29" r="1.8" fill="#6ee7b7"/></svg>,
                },
              ]).map((company, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-56 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200 p-5 flex flex-col gap-3 select-none"
                >
                  {/* Logo + verified */}
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
                      {company.logo}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      { language === "de" ? "Geprüft" : language === "sq" ? "Verifikuar" : language === "fr" ? "Vérifié" : "Verified" }
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <p className="font-bold text-foreground text-sm leading-snug">{company.name}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5">
                      {company.category}
                    </span>
                  </div>

                  {/* City + Rating */}
                  <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/60">
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

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-14 md:py-24 bg-white scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.howItWorks.title}</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Project Posters */}
            <motion.div
              className="bg-muted/40 rounded-2xl border border-border p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{t.howItWorks.posterTitle}</div>
                <p className="text-sm text-muted-foreground">{t.howItWorks.posterSubtitle}</p>
              </div>
              <div className="flex flex-col gap-3">
                {([
                  { step: t.howItWorks.posterStep1, icon: User },
                  { step: t.howItWorks.posterStep2, icon: FileText },
                  { step: t.howItWorks.posterStep3, icon: Clock },
                  { step: t.howItWorks.posterStep4, icon: Users },
                  { step: t.howItWorks.posterStep5, icon: CheckCircle2 },
                ] as { step: string; icon: React.ElementType }[]).map(({ step, icon: StepIcon }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex items-start gap-2 flex-1 pt-1">
                      <StepIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/signup?account_type=project_poster">
                <Button className="w-full sm:w-auto" data-testid="hiw-poster-cta">
                  {t.howItWorks.posterCta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* For Service Providers */}
            <motion.div
              className="bg-muted/40 rounded-2xl border border-border p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{t.howItWorks.providerTitle}</div>
                <p className="text-sm text-muted-foreground">{t.howItWorks.providerSubtitle}</p>
              </div>
              <div className="flex flex-col gap-3">
                {([
                  { step: t.howItWorks.providerStep1, icon: User },
                  { step: t.howItWorks.providerStep2, icon: Clock },
                  { step: t.howItWorks.providerStep3, icon: Search },
                  { step: t.howItWorks.providerStep4, icon: ArrowRight },
                  { step: t.howItWorks.providerStep5, icon: HeadphonesIcon },
                ] as { step: string; icon: React.ElementType }[]).map(({ step, icon: StepIcon }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex items-start gap-2 flex-1 pt-1">
                      <StepIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/signup?account_type=service_provider">
                <Button variant="outline" className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/8" data-testid="hiw-provider-cta">
                  {t.howItWorks.providerCta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY IMMOVIA ── */}
      <section className="py-14 md:py-24 bg-secondary/40">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.why.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.why.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white rounded-xl border border-border p-6 flex flex-col gap-4"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.testimonials.title}</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {testimonials.map((t_, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-muted/30 border border-border rounded-xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t_.rating }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed flex-1 italic">"{t_.text}"</p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm text-foreground">{t_.author}</p>
                  <p className="text-xs text-muted-foreground">{t_.city}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ACCOUNT TYPES ── */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.accountTypes.title}</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <motion.div
              className="bg-white border border-border rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{t.accountTypes.posterLabel}</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t.accountTypes.posterDesc}</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <User className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.posterSub1}
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.posterSub2}
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-white border border-border rounded-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{t.accountTypes.providerLabel}</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t.accountTypes.providerDesc}</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <User className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.providerSub1}
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.accountTypes.providerSub2}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 md:py-24 bg-foreground text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary opacity-[0.06] blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.cta.title}</h2>
            <p className="text-white/65 text-lg leading-relaxed">{t.cta.subtitle}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            {/* Project Poster card */}
            <div className="bg-primary rounded-2xl p-7 flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{t.hero.persona1Label}</div>
                <h3 className="text-xl font-bold text-white mb-1">{t.cta.button}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{t.cta.subtitle}</p>
              </div>
              <Link href="/signup?account_type=project_poster">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold w-full"
                  data-testid="footer-cta-project"
                >
                  {t.cta.button}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Service Provider card */}
            <div className="bg-white/8 border border-white/15 rounded-2xl p-7 flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{t.hero.persona2Label}</div>
                <h3 className="text-xl font-bold text-white mb-1">{t.cta.companyTitle}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{t.cta.companySubtitle}</p>
              </div>
              <Link href="/signup?account_type=service_provider">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/15 font-semibold w-full"
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

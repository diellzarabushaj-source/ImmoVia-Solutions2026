import { useRef, useMemo, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { Link, useSearch, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
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
} from "lucide-react";
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

function CompanyPreviewCard({ company, t }: { company: { id: number; companyName: string; profilePhoto?: string | null; workerType?: string | null; city: string; yearsExperience?: number | null; hourlyRate?: number | null; serviceTypes: string[]; description?: string | null }; t: ReturnType<typeof useLanguage>["t"] }) {
  const isIndividual = company.workerType === "individual";
  const colors = ["from-blue-600 to-blue-800", "from-indigo-600 to-indigo-800", "from-primary to-blue-700", "from-sky-600 to-sky-800", "from-slate-600 to-slate-800"];
  const color = colors[company.companyName.charCodeAt(0) % colors.length];
  const initials = company.companyName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link href={`/companies/${company.id}`}>
      <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer group h-full">
        <div className="p-4 flex gap-3 items-start border-b border-border/50">
          {company.profilePhoto ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-border">
              <img src={`/api/storage${company.profilePhoto}`} alt={company.companyName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-bold text-foreground text-sm leading-tight flex-1 min-w-0 truncate group-hover:text-primary transition-colors">
                {company.companyName}
              </h3>
              <Badge variant={isIndividual ? "outline" : "secondary"} className={`flex-shrink-0 text-xs flex items-center gap-1 ${isIndividual ? "border-primary/40 text-primary" : ""}`}>
                {isIndividual ? <><User className="h-3 w-3" />{t.companies?.individual ?? "Individual"}</> : <><Building2 className="h-3 w-3" />{t.companies?.company ?? "Company"}</>}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
              <MapPin className="h-3 w-3" />
              <span>{company.city}</span>
            </div>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-3">
          {isIndividual && company.hourlyRate ? (
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm">{company.hourlyRate} €</span>
              <span className="text-xs font-normal text-muted-foreground">/{t.companies?.hour ?? "hr"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span>{t.companies?.contractBased ?? "Contract-based"}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {company.serviceTypes.slice(0, 3).map((svc: string) => (
              <span key={svc} className="px-2 py-0.5 rounded-full bg-primary/8 text-primary text-xs font-medium capitalize">
                {(t.offers as Record<string, string>)[svc] ?? svc}
              </span>
            ))}
            {company.serviceTypes.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">+{company.serviceTypes.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

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

function getPostedLabel(createdAt: string, listings: { today: string; yesterday: string; daysAgo: string }): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return listings.today;
  if (diffDays === 1) return listings.yesterday;
  return `${diffDays} ${listings.daysAgo}`;
}

function ProjectPreviewCard({ project, t }: {
  project: { id: number; projectType: string; description: string; city: string; budget?: string | null; size?: string | null; createdAt: string };
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
      {/* Header strip */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50 flex gap-3 items-start">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm capitalize leading-tight">{typeLabel}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>{project.city}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sizeColor}`}>{sizeLabel}</span>
      </div>
      {/* Body */}
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

export default function Home() {
  const { t } = useLanguage();
  usePageMeta({ title: "ImmoVia", description: t.hero.subtitle });
  const { user } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();
  const { data: companies, isLoading: isLoadingCompanies } = useListCompanies();
  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const [listingTypeFilter, setListingTypeFilter] = useState(() => new URLSearchParams(search).get("type") ?? "");
  const [listingCityFilter, setListingCityFilter] = useState(() => new URLSearchParams(search).get("city") ?? "");
  const [listingSizeFilter, setListingSizeFilter] = useState(() => new URLSearchParams(search).get("size") ?? "");
  const [listingBudgetFilter, setListingBudgetFilter] = useState(() => new URLSearchParams(search).get("budget") ?? "");
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

  const services = [
    {
      icon: Hammer,
      title: t.offers.renovation,
      desc: t.offers.renovationDesc,
      price: t.offers.renovationPrice,
      photo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&fit=crop",
      serviceKey: "renovation",
    },
    {
      icon: Building2,
      title: t.offers.construction,
      desc: t.offers.constructionDesc,
      price: t.offers.constructionPrice,
      photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop",
      serviceKey: "construction",
    },
    {
      icon: Sofa,
      title: t.offers.interior,
      desc: t.offers.interiorDesc,
      price: t.offers.interiorPrice,
      photo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80&fit=crop",
      serviceKey: "interior",
    },
    {
      icon: TreePine,
      title: t.offers.exterior,
      desc: t.offers.exteriorDesc,
      price: t.offers.exteriorPrice,
      photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
      serviceKey: "exterior",
    },
    {
      icon: Wrench,
      title: t.offers.plumbing,
      desc: t.offers.plumbingDesc,
      price: t.offers.plumbingPrice,
      photo: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=600&q=80&fit=crop",
      serviceKey: "plumbing",
    },
    {
      icon: Plug,
      title: t.offers.electric,
      desc: t.offers.electricDesc,
      price: t.offers.electricPrice,
      photo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&fit=crop",
      serviceKey: "electric",
    },
  ];

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
          <motion.div className="max-w-4xl mx-auto text-center" initial="initial" animate="animate" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              <Star className="w-3 h-3 text-primary fill-primary" />
              {t.hero.badge}
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-[1.05]"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}>
              {t.hero.title.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? "text-primary drop-shadow-lg" : i === 2 ? "text-blue-300 drop-shadow-lg" : "text-white"}>
                  {line}{i < t.hero.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl font-light text-white mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
              {t.hero.subtitle}
            </motion.p>

            {/* Persona cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10">
              {/* Project Poster persona */}
              <Link href="/signup?account_type=project_poster">
                <div className="group rounded-xl p-5 text-left border border-white/20 cursor-pointer transition-all duration-200 hover:border-blue-400/50"
                  style={{ background: "rgba(10,20,50,0.60)", backdropFilter: "blur(14px)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/30 border border-primary/40 flex items-center justify-center flex-shrink-0">
                      <HomeIcon className="w-4 h-4 text-blue-300" />
                    </div>
                    <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">{t.hero.persona1Label}</span>
                  </div>
                  <h3 className="text-white text-base font-bold mb-1 leading-snug">{t.hero.persona1Title}</h3>
                  <p className="text-white/65 text-xs leading-relaxed mb-2">{t.hero.persona1Desc}</p>
                  <p className="text-white/40 text-[10px] leading-relaxed mb-3">{t.hero.persona1Small}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 group-hover:gap-2 transition-all">
                    {t.hero.persona1Cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>

              {/* Service Provider persona */}
              <Link href="/signup?account_type=service_provider">
                <div className="group rounded-xl p-5 text-left border border-white/20 cursor-pointer transition-all duration-200 hover:border-blue-400/50"
                  style={{ background: "rgba(10,20,50,0.60)", backdropFilter: "blur(14px)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/30 border border-primary/40 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-blue-300" />
                    </div>
                    <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">{t.hero.persona2Label}</span>
                  </div>
                  <h3 className="text-white text-base font-bold mb-1 leading-snug">{t.hero.persona2Title}</h3>
                  <p className="text-white/65 text-xs leading-relaxed mb-2">{t.hero.persona2Desc}</p>
                  <p className="text-white/40 text-[10px] leading-relaxed mb-3">{t.hero.persona2Small}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 group-hover:gap-2 transition-all">
                    {t.hero.persona2Cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link href="/signup?account_type=project_poster">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base px-8 shadow-lg shadow-primary/30" data-testid="hero-cta-project">
                  <FileText className="mr-2 h-4 w-4" />
                  {t.hero.ctaProject}
                </Button>
              </Link>
              <Link href="/signup?account_type=service_provider">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white/40 hover:bg-white/20 text-white text-base px-8 backdrop-blur-sm" data-testid="hero-cta-company">
                  {t.hero.ctaCompany}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-xs font-medium">
              {[t.hero.trustBadge1, t.hero.trustBadge2, t.hero.trustBadge3].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary drop-shadow" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>
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

      {/* ── SPLIT CTA — Choose your path ── */}
      <section className="py-10 md:py-14 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">

            {/* Left — Project Poster path */}
            <motion.div
              className="relative rounded-2xl overflow-hidden bg-foreground text-white p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-5 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/30 border border-primary/40 flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-blue-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{t.splitCta.posterQ}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{t.browse.projectsDesc}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/#project-listings">
                    <Button variant="outline" className="w-full sm:w-auto border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                      <Search className="mr-2 h-4 w-4" />
                      {t.splitCta.posterBrowse}
                    </Button>
                  </Link>
                  <Link href="/signup?account_type=project_poster">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30">
                      {t.splitCta.posterRegister}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right — Service Provider path */}
            <motion.div
              className="relative rounded-2xl overflow-hidden bg-white border border-border p-8 flex flex-col gap-5 shadow-sm"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-5 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t.splitCta.providerQ}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.providersDesc}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/companies">
                    <Button variant="outline" className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/8">
                      <Users className="mr-2 h-4 w-4" />
                      {t.splitCta.providerBrowse}
                    </Button>
                  </Link>
                  <Link href="/signup?account_type=service_provider">
                    <Button className="w-full sm:w-auto font-semibold">
                      {t.splitCta.providerRegister}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

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
              className="bg-muted/40 border border-border rounded-2xl p-8 flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.0 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">{t.browse.projectsTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.projectsDesc}</p>
              </div>
              <Link href="/#project-listings">
                <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/8" data-testid="browse-card-view-projects">
                  {t.browse.projectsCta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Card 2: Post a Project (registration) */}
            <motion.div
              className="bg-primary rounded-2xl p-8 flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
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
            </motion.div>

            {/* Card 3: Browse Service Providers (browse only) */}
            <motion.div
              className="bg-muted/40 border border-border rounded-2xl p-8 flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">{t.browse.providersTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.browse.providersDesc}</p>
              </div>
              <Link href="/companies">
                <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/8" data-testid="browse-card-view-providers">
                  {t.browse.providersCta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Card 4: Offer Services (registration) */}
            <motion.div
              className="bg-primary rounded-2xl p-8 flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SERVICES / OFFERS ── */}
      <section className="py-14 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.offers.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.offers.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
          >
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={`/companies?service=${s.serviceKey}`}>
                  <div
                    className="group relative rounded-2xl overflow-hidden cursor-pointer h-72 shadow-md hover:shadow-xl transition-all duration-300"
                    data-testid={`service-card-${i}`}
                  >
                    {/* Photo background */}
                    <img
                      src={s.photo}
                      alt={s.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold bg-primary/90 text-white px-2.5 py-1 rounded-full">
                          {s.price}
                        </span>
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

      {/* ── PROFESSIONALS PREVIEW ── */}
      <section className="py-14 md:py-24 bg-white">
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

          {isLoadingCompanies && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border p-4 flex gap-3 items-start">
                  <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingCompanies && previewCompanies.length > 0 && (
            <div className="relative">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                variants={stagger}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-40px" }}
              >
                {previewCompanies.map((company, idx) => (
                  <motion.div key={company.id} variants={fadeUp}>
                    <CompanyPreviewCard company={company} t={t} />
                  </motion.div>
                ))}
              </motion.div>

              {!user && (
                <div className="relative mt-5">
                  <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white z-10 pointer-events-none" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
                    {previewCompanies.slice(0, 3).map((company, idx) => (
                      <div key={`ghost-${idx}`}>
                        <CompanyPreviewCard company={company} t={t} />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="bg-white/90 backdrop-blur-sm border border-border rounded-2xl px-8 py-8 text-center shadow-lg max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-5">{t.professionals.gateLabel}</p>
                      <Link href="/signup">
                        <Button size="lg" className="w-full" data-testid="professionals-gate-cta">
                          {t.professionals.gateCta}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {user && (
                <div className="text-center mt-10">
                  <Link href="/companies">
                    <Button variant="outline" size="lg" data-testid="professionals-see-all">
                      {t.professionals.seeAll}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
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
              {["renovation","construction","interior","exterior","plumbing","electric"].map(tp => (
                <option key={tp} value={tp}>{(t.offers as Record<string,string>)[tp] ?? tp}</option>
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
                whileInView="animate"
                viewport={{ once: true, margin: "-40px" }}
              >
                {previewProjects.map((project, idx) => (
                  <motion.div key={project.id} variants={fadeUp}>
                    <ProjectPreviewCard project={project} t={t} />
                  </motion.div>
                ))}
              </motion.div>

              {!user && (
                <div className="relative mt-5">
                  <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-muted/30 z-10 pointer-events-none" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
                    {previewProjects.slice(0, 3).map((project, idx) => (
                      <div key={`ghost-${idx}`}>
                        <ProjectPreviewCard project={project} t={t} />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="bg-white/95 backdrop-blur-sm border border-border rounded-2xl px-8 py-8 text-center shadow-lg max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-5">{t.listings.gateLabel}</p>
                      <Link href="/signup">
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
                  <Link href="/submit-project">
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

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-14 md:py-24 bg-white">
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
                {[t.howItWorks.posterStep1, t.howItWorks.posterStep2, t.howItWorks.posterStep3, t.howItWorks.posterStep4, t.howItWorks.posterStep5].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm text-foreground leading-relaxed pt-1">{step}</p>
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
                {[t.howItWorks.providerStep1, t.howItWorks.providerStep2, t.howItWorks.providerStep3, t.howItWorks.providerStep4, t.howItWorks.providerStep5].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm text-foreground leading-relaxed pt-1">{step}</p>
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
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
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
            whileInView="animate"
            viewport={{ once: true }}
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

      {/* ── DUAL CTA ── */}
      <section className="py-14 md:py-20 bg-foreground text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Homeowner CTA */}
            <motion.div
              className="bg-primary rounded-2xl p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Hammer className="w-8 h-8 text-white/70" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cta.title}</h3>
                <p className="text-white/75 text-sm leading-relaxed">{t.cta.subtitle}</p>
              </div>
              <Link href="/submit-project">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold w-full sm:w-auto"
                  data-testid="footer-cta-project"
                >
                  {t.cta.button}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Company CTA */}
            <motion.div
              className="bg-white/8 border border-white/15 rounded-2xl p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cta.companyTitle}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{t.cta.companySubtitle}</p>
              </div>
              <Link href="/register-company">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold w-full sm:w-auto"
                  data-testid="footer-cta-company"
                >
                  {t.cta.companyButton}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}

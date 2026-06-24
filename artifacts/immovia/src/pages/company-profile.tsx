import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useCategories } from "@/hooks/useCategories";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock,
  FileText,
  Mail,
  Phone,
  Globe,
  FileCheck,
  Star,
  User,
  Building2,
  BadgeCheck,
  ArrowRight,
  Loader2,
  Image,
  MessageSquare,
  Heart,
  Lock as LockIcon,
} from "lucide-react";
import { motion } from "framer-motion";

interface Company {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  city: string;
  description: string | null;
  website: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  workerType: string;
  hourlyRate: number | null;
  profilePhoto: string | null;
  status: string;
}

const GALLERY_PLACEHOLDERS = [
  "/gallery-1.jpg",
  "/gallery-2.jpg",
  "/gallery-3.jpg",
  "/gallery-4.jpg",
  "/gallery-5.jpg",
  "/gallery-6.jpg",
];

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25 fill-muted"}`}
        />
      ))}
    </div>
  );
}

function CompanyAvatar({ name, profilePhoto, workerType, size = "xl" }: { name: string; profilePhoto?: string | null; workerType?: string; size?: "xl" | "lg" }) {
  const colors = ["from-blue-600 to-blue-900", "from-indigo-600 to-indigo-900", "from-primary to-blue-700", "from-sky-600 to-sky-900"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = size === "xl" ? "w-24 h-24 md:w-32 md:h-32" : "w-20 h-20";
  const iconCls = size === "xl" ? "h-12 w-12 md:h-14 md:w-14" : "h-10 w-10";
  if (profilePhoto) {
    return (
      <div className={`${cls} rounded-2xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0`}>
        <img src={profilePhoto.startsWith("/api") ? profilePhoto : `/api/storage${profilePhoto}`} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const isIndividual = workerType === "individual";
  return (
    <div className={`${cls} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white flex-shrink-0 border-4 border-white shadow-lg`}>
      {isIndividual
        ? <User className={iconCls} strokeWidth={1.5} />
        : <Building2 className={iconCls} strokeWidth={1.5} />
      }
    </div>
  );
}

export default function CompanyProfile() {
  const [, params] = useRoute("/companies/:id");
  const { t, language } = useLanguage();
  const { categories } = useCategories("service");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const id = params?.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "ratelimited" | "error">("loading");

  usePageMeta({
    title: company ? `${company.companyName} — ${company.city} | ImmoVia365` : null,
    description: company?.description ? company.description.slice(0, 160) : null,
  });
  useStructuredData(company ? [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": company.companyName,
      "description": company.description ?? undefined,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": company.city,
        "addressCountry": "CH"
      },
      "url": `${APP_URL}/companies/${company.id}`,
      "areaServed": company.city
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Dienstleister", "item": `${APP_URL}/companies` },
        { "@type": "ListItem", "position": 3, "name": company.companyName, "item": `${APP_URL}/companies/${company.id}` }
      ]
    }
  ] : null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [galleryErrors, setGalleryErrors] = useState<Set<number>>(new Set());
  const [viewerPlanSlug, setViewerPlanSlug] = useState<string | null>(null);

  // Check if this provider is already saved (project posters only)
  useEffect(() => {
    if (!user || isServiceProvider(user) || !company) return;
    fetch("/api/customer/favorites", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((rows: Array<{ companyId: number }>) => {
        setIsSaved(rows.some(r => r.companyId === company.id));
      })
      .catch(() => {});
  }, [user, company]);

  const toggleSave = async () => {
    if (!user || !company || saveLoading) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        await fetch(`/api/customer/favorites/${company.id}`, { method: "DELETE", credentials: "include" });
        setIsSaved(false);
      } else {
        await fetch(`/api/customer/favorites/${company.id}`, { method: "POST", credentials: "include" });
        setIsSaved(true);
      }
    } catch {
      // silent
    } finally {
      setSaveLoading(false);
    }
  };

  // Fetch viewer's plan — only SP users can access this endpoint
  useEffect(() => {
    if (!user || !isServiceProvider(user)) return;
    fetch("/api/billing/provider/me")
      .then(r => r.ok ? r.json() : null)
      .then((d: { planSlug?: string } | null) => { if (d?.planSlug) setViewerPlanSlug(d.planSlug); })
      .catch(() => {});
  }, [user]);

  // Only Premium (top plan) can see the provider's website
  const canSeeWebsite = viewerPlanSlug === "premium";
  // Professional + Premium can see contact info (email / phone)
  const canSeeContact = viewerPlanSlug != null && (viewerPlanSlug === "premium" || viewerPlanSlug.includes("pro"));

  const openChat = () => {
    if (!user) { setLocation("/sign-in"); return; }
    if (!company) return;
    window.dispatchEvent(
      new CustomEvent("immovia:open-chat", {
        detail: { companyId: company.id, companyName: company.companyName },
      })
    );
  };

  useEffect(() => {
    if (!id) return;
    setStatus("loading");
    fetch(`/api/companies/${id}`)
      .then(async r => {
        if (r.status === 429) { setStatus("ratelimited"); return; }
        if (r.status === 404) { setStatus("notfound"); return; }
        if (!r.ok) { setStatus("error"); return; }
        const data = await r.json() as Company;
        setCompany(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "ratelimited") {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">
          {language === "sq" ? "Shumë kërkesa" : language === "de" ? "Zu viele Anfragen" : language === "fr" ? "Trop de requêtes" : "Too many requests"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {language === "sq" ? "Ju lutem prisni disa sekonda dhe provoni sërisht." : language === "de" ? "Bitte warten Sie kurz und versuchen Sie es erneut." : language === "fr" ? "Veuillez patienter quelques secondes et réessayer." : "Please wait a moment and try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setStatus("loading")} variant="default">
            {language === "sq" ? "Provo Sërisht" : language === "de" ? "Erneut versuchen" : language === "fr" ? "Réessayer" : "Try Again"}
          </Button>
          <Link href="/companies">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{t.publicProfile.backToCompanies}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">
          {language === "sq" ? "Gabim gjatë ngarkimit" : language === "de" ? "Ladefehler" : language === "fr" ? "Erreur de chargement" : "Loading error"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {language === "sq" ? "Profili nuk mund të ngarkohet. Provoni sërisht." : language === "de" ? "Das Profil konnte nicht geladen werden. Bitte versuchen Sie es erneut." : language === "fr" ? "Le profil n'a pas pu être chargé. Veuillez réessayer." : "The profile could not be loaded. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setStatus("loading")} variant="default">
            {language === "sq" ? "Provo Sërisht" : language === "de" ? "Erneut versuchen" : language === "fr" ? "Réessayer" : "Try Again"}
          </Button>
          <Link href="/companies">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{t.publicProfile.backToCompanies}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "notfound" || !company) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t.publicProfile.notFound}</h1>
        <Link href="/companies">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{t.publicProfile.backToCompanies}</Button>
        </Link>
      </div>
    );
  }

  const isIndividual = company.workerType === "individual";
  const validGallery = GALLERY_PLACEHOLDERS.filter((_, i) => !galleryErrors.has(i));

  return (
    <div className="min-h-screen bg-muted/20">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#0b1d3a] via-[#112a50] to-[#0e2245] pt-6 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/companies">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.publicProfile.backToCompanies}
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile card — overlaps hero */}
      <div className="container mx-auto px-4 max-w-5xl -mt-14">
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <CompanyAvatar name={company.companyName} profilePhoto={company.profilePhoto} workerType={company.workerType} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {company.companyName}
                  </h1>
                  <Badge
                    variant={isIndividual ? "outline" : "secondary"}
                    className={`flex items-center gap-1 text-xs mt-1 ${isIndividual ? "border-primary/40 text-primary" : ""}`}
                  >
                    {isIndividual
                      ? <><User className="w-3 h-3" />{t.companies.individual}</>
                      : <><Building2 className="w-3 h-3" />{t.companies.company}</>
                    }
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                    <BadgeCheck className="w-3 h-3" />
                    {t.publicProfile.verified}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    {company.city}
                  </span>
                  {company.yearsExperience && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-primary/70" />
                      {company.yearsExperience} {t.publicProfile.yearsExperience}
                    </span>
                  )}
                  {isIndividual && company.hourlyRate ? (
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                      <Clock className="w-4 h-4" />
                      {company.hourlyRate} €/{t.companies.hour}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary/70" />
                      {t.companies.contractBased}
                    </span>
                  )}
                  {company.licenseNumber && (
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-primary/70" />
                      {t.publicProfile.license}: {company.licenseNumber}
                    </span>
                  )}
                </div>

                {/* Service badges */}
                <div className="flex flex-wrap gap-1.5">
                  {company.serviceTypes.map(svc => (
                    <span key={svc} className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium capitalize">
                      {categories.find(c => c.key === svc)?.label ?? svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
              {user ? (
                canSeeContact ? (
                  <>
                    <Button asChild>
                      <a href={`mailto:${company.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.companies.contact}
                      </a>
                    </Button>
                    {company.phone && (
                      <Button asChild variant="outline">
                        <a href={`tel:${company.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {t.companies.call}
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-xs bg-primary/8 text-primary px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {language === "de" ? "Professional / Premium erforderlich"
                      : language === "fr" ? "Professional / Premium requis"
                      : language === "sq" ? "Nevojitet Professional / Premium"
                      : "Professional / Premium required"}
                  </span>
                )
              ) : (
                <Button onClick={() => setLocation("/sign-in")}>
                  <Mail className="w-4 h-4 mr-2" />
                  {t.publicProfile.contactLoginCta}
                </Button>
              )}
              {company.website && canSeeWebsite && (
                <Button asChild variant="outline">
                  <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </Button>
              )}
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/8" onClick={openChat}>
                <MessageSquare className="w-4 h-4 mr-2" />
                {t.publicProfile.sendMessage}
              </Button>
              {user && !isServiceProvider(user) && (
                <Button
                  variant={isSaved ? "secondary" : "outline"}
                  className={isSaved ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : "border-primary/30 text-primary hover:bg-primary/8"}
                  onClick={toggleSave}
                  disabled={saveLoading}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                  {isSaved ? t.publicProfile.savedProvider : t.publicProfile.saveProvider}
                </Button>
              )}
              <Button asChild variant="outline" className="ml-auto border-primary/30 text-primary hover:bg-primary/8">
                <Link href="/submit-project">
                  {t.publicProfile.submitProject}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">

          {/* Left column — main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            {company.description && (
              <motion.div
                className="bg-white rounded-2xl border border-border shadow-sm p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {t.publicProfile.about}
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">{company.description}</p>
              </motion.div>
            )}

            {/* Gallery */}
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                {t.publicProfile.gallery}
              </h2>
              {!user ? (
                /* Blur gate — non-logged-in visitors see blurred content + unlock overlay */
                <div className="relative rounded-xl overflow-hidden">
                  {/* Blurred background content */}
                  <div className="pointer-events-none select-none" style={{ opacity: 0.5, filter: "blur(6px)" }} aria-hidden="true">
                    {validGallery.length === 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {GALLERY_PLACEHOLDERS.map((src, i) => (
                          <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {GALLERY_PLACEHOLDERS.map((src, i) => (
                          <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Unlock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/30 backdrop-blur-[2px]">
                    <div className="bg-white/95 backdrop-blur-sm border border-border rounded-2xl px-8 py-7 text-center shadow-xl max-w-xs mx-auto">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <LockIcon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-foreground mb-1">{t.publicProfile.galleryGateTitle}</p>
                      <p className="text-xs text-muted-foreground mb-5">{t.publicProfile.contactLoginPrompt}</p>
                      <div className="flex flex-col gap-2">
                        <Link href="/sign-in">
                          <Button size="sm" className="w-full">
                            {t.publicProfile.galleryGateCta}
                          </Button>
                        </Link>
                        <Link href="/signup">
                          <Button size="sm" variant="outline" className="w-full">
                            {t.nav.register}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : validGallery.length === 0 ? (
                <div className="rounded-xl bg-muted/40 border-2 border-dashed border-border p-10 text-center text-muted-foreground text-sm">
                  {t.publicProfile.noPortfolio}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GALLERY_PLACEHOLDERS.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(src)}
                      className="group aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border hover:border-primary/30 transition-all"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setGalleryErrors(prev => new Set(prev).add(i))}
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Reviews */}
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                {t.publicProfile.reviews}
              </h2>
              <div className="rounded-xl bg-muted/40 border-2 border-dashed border-border p-10 text-center text-muted-foreground text-sm">
                {t.publicProfile.noReviews}
              </div>
            </motion.div>
          </div>

          {/* Right column — sticky contact cards */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">

            {/* Contact Information card */}
            {user ? (
              <motion.div
                className="rounded-2xl overflow-hidden shadow-xl shadow-primary/10"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -3, boxShadow: "0 12px 32px -6px rgba(26,58,110,0.22)" }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 22 }}
                style={{ background: "linear-gradient(145deg,#0d2151 0%,#1a3a6e 55%,#1e4b8a 100%)" }}
              >
                <div className="px-6 pt-6 pb-4 border-b border-white/10">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.22em] mb-1">ImmoVia365</p>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-200 flex-shrink-0" />
                    {t.publicProfile.contactInfo}
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {canSeeContact ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-white" />
                        </div>
                        <a href={`mailto:${company.email}`} className="text-sm font-medium text-white/80 hover:text-white break-all transition-colors">
                          {company.email}
                        </a>
                      </div>
                      {company.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                          <a href={`tel:${company.phone}`} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                            {company.phone}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-xs text-white/50 mb-1">
                        {language === "de" ? "Sichtbar ab" : language === "fr" ? "Visible à partir du plan" : language === "sq" ? "E dukshme nga plani" : "Visible from plan"}
                      </p>
                      <span className="text-xs font-bold text-blue-200">Professional / Premium</span>
                    </div>
                  )}
                  {company.website && canSeeWebsite && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                        target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-white/80 hover:text-white truncate transition-colors">
                        {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  )}
                  {company.city && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white/80">{company.city}</span>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    <Button asChild className="w-full bg-white text-foreground hover:bg-white/92 font-semibold shadow-lg shadow-black/20 h-11">
                      <a href={`mailto:${company.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.companies.contact}
                      </a>
                    </Button>
                    {company.phone && (
                      <Button asChild className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/15 font-semibold h-10" variant="outline">
                        <a href={`tel:${company.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {t.companies.call}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Unauthenticated — vivid blue pulsing card */
              <motion.div
                className="rounded-2xl overflow-hidden cursor-pointer relative"
                initial={{ opacity: 0, x: 16, boxShadow: "0 8px 32px -6px rgba(37,99,235,0.35)" }}
                animate={{ opacity: 1, x: 0, boxShadow: "0 8px 32px -6px rgba(37,99,235,0.35)" }}
                whileHover={{ y: -5, scale: 1.01, boxShadow: "0 40px 80px -12px rgba(37,99,235,0.65), 0 0 0 1px rgba(99,179,237,0.3)" }}
                transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 20 }}
                style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 40%,#2563eb 70%,#3b82f6 100%)" }}
              >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle,rgba(147,197,253,0.2) 0%,transparent 70%)", transform: "translate(30%,-30%)" }} />
                <div className="px-6 pt-6 pb-4 border-b border-white/10 relative">
                  <img src="/logo-white.png" alt="ImmoVia365" className="h-7 w-auto object-contain mb-3 opacity-90" />
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-tight">
                    <Mail className="w-5 h-5 text-blue-200 flex-shrink-0" />
                    {t.publicProfile.contactInfo}
                  </h3>
                </div>
                <div className="p-6 text-center relative">
                  {company.city && (
                    <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-4">
                      <MapPin className="w-3.5 h-3.5" />{company.city}
                    </div>
                  )}
                  <div className="mb-4 select-none pointer-events-none space-y-2 text-sm text-white/30" style={{ filter: "blur(5px)" }}>
                    <div className="flex items-center gap-2 justify-center"><Phone className="w-4 h-4" /><span>+41 79 ••• •• ••</span></div>
                    <div className="flex items-center gap-2 justify-center"><Mail className="w-4 h-4" /><span>info@•••••••.ch</span></div>
                  </div>
                  <div className="relative flex items-center justify-center mx-auto mb-5 w-20 h-20">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-300/40"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="w-16 h-16 rounded-full bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                      <LockIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-100/80 mb-6 leading-relaxed">{t.publicProfile.contactLoginPrompt}</p>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                    <Button
                      className="w-full h-12 font-bold text-[15px] shadow-xl shadow-black/30 border border-white/20"
                      style={{ background: "linear-gradient(135deg,#ffffff 0%,#e0f2fe 100%)", color: "#1e3a8a" }}
                      onClick={() => setLocation("/sign-in")}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {t.publicProfile.contactLoginCta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Submit Project card */}
            <motion.div
              className="rounded-2xl overflow-hidden shadow-xl shadow-primary/10"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -3, boxShadow: "0 28px 56px -8px rgba(30,75,138,0.45)" }}
              transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 24 }}
              style={{ background: "linear-gradient(145deg,#0d2151 0%,#1a3a6e 55%,#1e4b8a 100%)" }}
            >
              <div className="px-6 pt-6 pb-4 border-b border-white/10">
                <img src="/logo-white.png" alt="ImmoVia365" className="h-7 w-auto object-contain mb-3 opacity-90" />
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  {t.publicProfile.haveProject}
                </h3>
              </div>
              <div className="p-5">
                <Button asChild className="w-full bg-white text-foreground hover:bg-white/92 font-semibold shadow-lg shadow-black/20 h-11">
                  <Link href="/submit-project">
                    {t.publicProfile.sendProject}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <Button variant="outline" size="sm" className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setLightbox(null)}>
              {t.publicProfile.close}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

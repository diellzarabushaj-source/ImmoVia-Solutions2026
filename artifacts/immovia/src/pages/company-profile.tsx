import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { CATEGORIES, getCategoryLabel, type Lang } from "@/lib/categories";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const id = params?.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  usePageMeta({
    title: company ? `${company.companyName} — ${company.city} | ImmoVia` : null,
    description: company?.description ? company.description.slice(0, 160) : null,
  });
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [galleryErrors, setGalleryErrors] = useState<Set<number>>(new Set());

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
        if (!r.ok) { setStatus("notfound"); return; }
        const data = await r.json() as Company;
        setCompany(data);
        setStatus("ready");
      })
      .catch(() => setStatus("notfound"));
  }, [id]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                      {getCategoryLabel(CATEGORIES.find(c => c.key === svc) ?? CATEGORIES[CATEGORIES.length - 1], language as Lang)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
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
              {company.website && (
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
              {validGallery.length === 0 ? (
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

          {/* Right column — sticky contact card */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-5 lg:sticky lg:top-24"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-bold text-foreground mb-4">{t.publicProfile.contactInfo}</h3>
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${company.email}`} className="text-foreground/80 hover:text-primary break-all">
                    {company.email}
                  </a>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href={`tel:${company.phone}`} className="text-foreground/80 hover:text-primary">
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank" rel="noreferrer"
                      className="text-foreground/80 hover:text-primary truncate">
                      {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </div>
                )}
                {company.city && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground/80">{company.city}</span>
                  </div>
                )}
              </div>

              <Button asChild className="w-full mb-2">
                <a href={`mailto:${company.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {t.companies.contact}
                </a>
              </Button>
              {company.phone && (
                <Button asChild variant="outline" className="w-full mb-4">
                  <a href={`tel:${company.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {t.companies.call}
                  </a>
                </Button>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-3">{t.publicProfile.haveProject}</p>
                <Button asChild variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/8">
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

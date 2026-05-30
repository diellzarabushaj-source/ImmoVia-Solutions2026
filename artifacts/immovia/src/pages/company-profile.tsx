import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  Send,
  CheckCircle,
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

const MOCK_REVIEWS = [
  { id: 1, author: "Besnik H.", rating: 5, date: "Mars 2025", text: "Punë shumë cilësore! E rekomandoj pa hezitim." },
  { id: 2, author: "Liridon K.", rating: 4, date: "Shkurt 2025", text: "Profesionalizëm i lartë dhe afate të respektuara." },
  { id: 3, author: "Arjeta M.", rating: 5, date: "Janar 2025", text: "Rezultat i shkëlqyeshëm, klienti ishte shumë i kënaqur." },
];

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
  const { t } = useLanguage();
  const id = params?.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  usePageMeta({
    title: company ? `${company.companyName} — ${company.city} | ImmoVia` : null,
    description: company?.description ? company.description.slice(0, 160) : null,
  });
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [galleryErrors, setGalleryErrors] = useState<Set<number>>(new Set());
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  const sendMessage = async () => {
    if (!msgText.trim() || !id) return;
    setMsgSending(true);
    try {
      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: Number(id), body: msgText.trim() }),
      });
      setMsgSent(true);
      setMsgText("");
      setTimeout(() => { setShowMsgModal(false); setMsgSent(false); }, 2000);
    } catch { /* ignore */ } finally {
      setMsgSending(false);
    }
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
  const avgRating = 4.8;
  const reviewCount = MOCK_REVIEWS.length;
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

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <StarRating value={avgRating} />
                  <span className="text-sm font-bold text-foreground">{avgRating}</span>
                  <span className="text-sm text-muted-foreground">({reviewCount} vlerësime)</span>
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
                      {t.offers[svc as keyof typeof t.offers] ?? svc}
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
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/8" onClick={() => setShowMsgModal(true)}>
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
                  Rreth
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
                Galeria e Punëve
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Vlerësimet
                </h2>
                <div className="flex items-center gap-2">
                  <StarRating value={avgRating} />
                  <span className="text-sm font-bold">{avgRating}</span>
                  <span className="text-xs text-muted-foreground">({reviewCount})</span>
                </div>
              </div>
              <div className="space-y-4">
                {MOCK_REVIEWS.map(r => (
                  <div key={r.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{r.author}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                      <StarRating value={r.rating} />
                    </div>
                    <p className="text-sm text-foreground/80 italic">"{r.text}"</p>
                  </div>
                ))}
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
              <h3 className="font-bold text-foreground mb-4">Informacionet e Kontaktit</h3>
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
                <p className="text-xs text-muted-foreground mb-3">Ke një projekt për këtë profesionist?</p>
                <Button asChild variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/8">
                  <Link href="/submit-project">
                    Dërgo Projekt
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Message modal */}
      <Dialog open={showMsgModal} onOpenChange={(o) => { setShowMsgModal(o); if (!o) { setMsgSent(false); setMsgText(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              {t.publicProfile.sendMessage} — {company.companyName}
            </DialogTitle>
          </DialogHeader>
          {msgSent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="font-medium text-green-700">{"Message sent!"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                rows={5}
                placeholder={"Write your message…"}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                className="resize-none"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right">{msgText.length}/1000</p>
            </div>
          )}
          {!msgSent && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMsgModal(false)} disabled={msgSending}>
                {t.common.cancel}
              </Button>
              <Button onClick={sendMessage} disabled={msgSending || !msgText.trim()}>
                {msgSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {t.publicProfile.sendMessage}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

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

import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useCategories } from "@/hooks/useCategories";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Clock,
  FileText,
  Lock,
  Loader2,
  Hammer,
  Building2,
  Sofa,
  TreePine,
  Wrench,
  Plug,
  Briefcase,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Image,
  User,
  Phone,
  Mail,
  Unlock,
  Star,
  Eye,
  ShieldCheck,
  FileDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { resolvePhotoSrc } from "@/lib/display";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { billingApi, type AppStats, type UnlockedByResponse } from "@/lib/billing-api";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProjectBriefPDF, type ProjectBriefData } from "@/lib/pdf/ProjectBriefPDF";
import { useLogoBase64, useBase64Images } from "@/lib/pdf/useLogoBase64";

interface Project {
  id: number;
  title?: string | null;
  fullName: string;
  email: string;
  phone: string;
  projectType: string;
  description: string;
  city: string;
  budget: string | null;
  timeline: string | null;
  size: string | null;
  photos: string[];
  status: string;
  createdAt: string;
  posterName?: string | null;
  posterType?: string | null;
  posterAvatarUrl?: string | null;
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
  small: "bg-slate-100 text-slate-700",
  medium: "bg-blue-50 text-blue-700",
  large: "bg-indigo-50 text-indigo-700",
  premium: "bg-primary/10 text-primary",
};

function DownloadProjectPDF({ project, categoryLabels }: { project: Project; categoryLabels: string[] }) {
  const logo = useLogoBase64();
  const rawPhotos = (project.photos ?? []).filter(Boolean).slice(0, 6);
  const photoBase64s = useBase64Images(rawPhotos);
  const validPhotos = photoBase64s.filter((p): p is string => !!p);
  const data: ProjectBriefData = {
    title: project.title,
    projectType: project.projectType,
    description: project.description,
    city: project.city,
    budget: project.budget,
    timeline: project.timeline,
    size: project.size,
    status: project.status,
    photos: validPhotos,
    categoryLabels,
    logoBase64: logo,
    generatedAt: new Date().toLocaleDateString("de-CH"),
  };
  const slug = (project.title ?? project.projectType).replace(/[\s,]+/g, "-").slice(0, 40);
  const filename = `${slug}-ImmoVia365.pdf`;
  return (
    <PDFDownloadLink document={<ProjectBriefPDF data={data} />} fileName={filename}>
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary/30 text-primary hover:bg-primary/8 justify-center"
          disabled={loading}
          asChild={false}
        >
          <FileDown className="w-4 h-4 mr-2" />
          {loading ? "PDF…" : "Projektmappe herunterladen"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

function getPostedLabel(createdAt: string, listings: { today: string; yesterday: string; daysAgo: string }): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return listings.today;
  if (diffDays === 1) return listings.yesterday;
  return `${diffDays} ${listings.daysAgo}`;
}

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const { t, language } = useLanguage();
  const { categories } = useCategories("project");
  const id = params?.id;
  const { user } = useAuth();
  const isProvider = isServiceProvider(user);

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockedBy, setUnlockedBy] = useState<UnlockedByResponse | null>(null);

  usePageMeta({
    title: project
      ? `${t.projectDetail.seoProject} ${categories.find(c => c.key === project.projectType)?.label ?? project.projectType} ${t.projectDetail.seoIn} ${project.city} — ImmoVia365`
      : null,
    description: project?.description ? project.description.slice(0, 160) : null,
  });
  useStructuredData(project ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Projekte", "item": `${APP_URL}/projects` },
      { "@type": "ListItem", "position": 3, "name": project.projectType, "item": `${APP_URL}/projects/${project.id}` }
    ]
  } : null);
  const [fetchStatus, setFetchStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setFetchStatus("loading");
    fetch(`/api/projects/${id}`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) { setFetchStatus("notfound"); return; }
        const data = await r.json() as Project;
        if (data.status === "cancelled" || data.status === "rejected") {
          setFetchStatus("notfound");
          return;
        }
        setProject(data);
        setFetchStatus("ready");
      })
      .catch(() => setFetchStatus("notfound"));
  }, [id]);

  useEffect(() => {
    if (!isProvider) return;
    billingApi.appStats().then(setStats).catch(() => setStats(null));
  }, [isProvider]);

  useEffect(() => {
    if (!id || !user) return;
    setUnlockedBy(null);
    billingApi.unlockedBy(Number(id)).then(setUnlockedBy).catch(() => setUnlockedBy(null));
  }, [id, user]);

  const UNLOCK_STRINGS: Record<string, {
    unlockBtn: (r: number) => string; unlockingBtn: string; limitReached: string;
    upgradeTitle: string; upgradeText: string; upgradeBtn: string;
    contactName: string; contactPhone: string; contactEmail: string;
    registerOnly: string; remainingLabel: (u: number, l: number) => string; unlimitedLabel: string;
    pdfLocked: string; pdfLoginRequired: string; unlockBtnPremium: string;
  }> = {
    sq: {
      unlockBtn: (r) => `Zhblloko Kontaktin (${r} mbetur)`, unlockingBtn: "Duke zhbllokuar...",
      limitReached: "Kufiri mujor i arritur", upgradeTitle: "Kërkohet plan i paguar",
      upgradeText: "Aktivizoni Basic, Professional ose Premium për të parë numrin e telefonit dhe të dhënat e kontaktit.",
      upgradeBtn: "Shiko Planet", contactName: "Emri", contactPhone: "Telefon", contactEmail: "E-mail",
      registerOnly: "Vetëm ofruesit e shërbimit mund të shohin detajet e kontaktit.",
      remainingLabel: (u, l) => `${l - u} zhbllokime mbetur këtë muaj`,
      unlimitedLabel: "Zhbllokime të pakufizuara (Premium)",
      pdfLocked: "Zhblloko kontaktin fillimisht për të shkarkuar dosjen",
      pdfLoginRequired: "Kyçu në platformë për të shkarkuar dosjen",
      unlockBtnPremium: "Zhblloko Kontaktin (Premium — i pakufizuar)",
    },
    en: {
      unlockBtn: (r) => `Unlock Contact (${r} remaining)`, unlockingBtn: "Unlocking...",
      limitReached: "Monthly unlock limit reached", upgradeTitle: "A paid plan is required",
      upgradeText: "Activate Basic, Professional or Premium to see the client's phone number and contact details.",
      upgradeBtn: "View Plans", contactName: "Name", contactPhone: "Phone", contactEmail: "Email",
      registerOnly: "Only service providers can view contact details.",
      remainingLabel: (u, l) => `${l - u} unlocks remaining this month`,
      unlimitedLabel: "Unlimited unlocks (Premium)",
      pdfLocked: "Unlock the contact first to download the project brief",
      pdfLoginRequired: "Sign in to download the project brief",
      unlockBtnPremium: "Unlock Contact (Premium — unlimited)",
    },
    de: {
      unlockBtn: (r) => `Kontakt freischalten (${r} verbleibend)`, unlockingBtn: "Wird freigeschaltet...",
      limitReached: "Monatliches Freischalt-Limit erreicht", upgradeTitle: "Bezahltes Abo erforderlich",
      upgradeText: "Aktivieren Sie Basic, Professional oder Premium, um Telefonnummer und Kontaktdaten zu sehen.",
      upgradeBtn: "Pläne ansehen", contactName: "Name", contactPhone: "Telefon", contactEmail: "E-Mail",
      registerOnly: "Nur Dienstleister können Kontaktdaten einsehen.",
      remainingLabel: (u, l) => `${l - u} Freischaltungen verbleibend`,
      unlimitedLabel: "Unbegrenzte Freischaltungen (Premium)",
      pdfLocked: "Kontakt zuerst freischalten, um die Projektmappe herunterzuladen",
      pdfLoginRequired: "Anmelden, um die Projektmappe herunterzuladen",
      unlockBtnPremium: "Kontakt freischalten (Premium — unbegrenzt)",
    },
    fr: {
      unlockBtn: (r) => `Débloquer le contact (${r} restants)`, unlockingBtn: "Déverrouillage...",
      limitReached: "Limite mensuelle atteinte", upgradeTitle: "Un abonnement payant est requis",
      upgradeText: "Activez Basic, Professionnel ou Premium pour voir le téléphone et les coordonnées du client.",
      upgradeBtn: "Voir les offres", contactName: "Nom", contactPhone: "Téléphone", contactEmail: "E-mail",
      registerOnly: "Seuls les prestataires peuvent voir les coordonnées.",
      remainingLabel: (u, l) => `${l - u} déblocages restants ce mois`,
      unlimitedLabel: "Déblocages illimités (Premium)",
      pdfLocked: "Déverrouillez le contact d'abord pour télécharger le dossier",
      pdfLoginRequired: "Connectez-vous pour télécharger le dossier",
      unlockBtnPremium: "Débloquer le contact (Premium — illimité)",
    },
  };
  const us = UNLOCK_STRINGS[language] ?? UNLOCK_STRINGS.en;

  const POSTER_STRINGS: Record<string, {
    panelTitle: (n: number) => string;
    revealedBadge: string;
    anonLabel: string;
    noneYet: string;
  }> = {
    sq: {
      panelTitle: (n) => n === 1 ? "1 ofrues ka parë kontaktin tuaj" : `${n} ofrues kanë parë kontaktin tuaj`,
      revealedBadge: "Premium",
      anonLabel: "Ofruesi anonim (Professional)",
      noneYet: "Asnjë ofrues nuk ka parë kontaktin tuaj ende.",
    },
    en: {
      panelTitle: (n) => n === 1 ? "1 provider viewed your contact" : `${n} providers viewed your contact`,
      revealedBadge: "Premium",
      anonLabel: "Anonymous provider (Professional)",
      noneYet: "No provider has viewed your contact yet.",
    },
    de: {
      panelTitle: (n) => n === 1 ? "1 Anbieter hat Ihre Kontaktdaten gesehen" : `${n} Anbieter haben Ihre Kontaktdaten gesehen`,
      revealedBadge: "Premium",
      anonLabel: "Anonymer Anbieter (Professional)",
      noneYet: "Noch kein Anbieter hat Ihre Kontaktdaten gesehen.",
    },
    fr: {
      panelTitle: (n) => n === 1 ? "1 prestataire a vu vos coordonnées" : `${n} prestataires ont vu vos coordonnées`,
      revealedBadge: "Premium",
      anonLabel: "Prestataire anonyme (Professionnel)",
      noneYet: "Aucun prestataire n'a encore consulté vos coordonnées.",
    },
  };
  const ps = POSTER_STRINGS[language] ?? POSTER_STRINGS.en;

  const hasContacts = Boolean(project?.phone || project?.email);
  const planSlug = stats?.planSlug ?? "";

  const handleUnlock = async () => {
    if (!id || !project) return;
    setUnlockLoading(true);
    setUnlockError(null);
    try {
      const data = await billingApi.unlockProjectContact(Number(id));
      setProject(prev => prev ? { ...prev, phone: data.phone, email: data.email, fullName: data.fullName } : prev);
      if (stats) setStats({ ...stats, contactUnlocksUsed: stats.contactUnlocksUsed + 1 });
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Failed to unlock contact");
    } finally {
      setUnlockLoading(false);
    }
  };

  if (fetchStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchStatus === "notfound" || !project) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t.projectDetail.notFound}</h1>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{t.projectDetail.backToHome}</Button>
        </Link>
      </div>
    );
  }

  const Icon = SERVICE_ICONS[project.projectType] ?? Briefcase;
  const typeLabel = (t.offers as Record<string, string>)[project.projectType] ?? project.projectType;
  const sz = project.size ?? "medium";
  const sizeKey = ({ small: "sizeSm", medium: "sizeMd", large: "sizeLg", premium: "sizePremium" } as Record<string, keyof typeof t.listings>)[sz] ?? "sizeMd";
  const sizeLabel = t.listings[sizeKey] as string;
  const sizeColor = SIZE_COLORS[sz] ?? SIZE_COLORS.medium;
  const postedLabel = getPostedLabel(project.createdAt, t.listings);

  const statusLabel = {
    pending: t.projectDetail.statusPending,
    reviewing: t.projectDetail.statusReviewing,
    matched: t.projectDetail.statusMatched,
  }[project.status] ?? project.status;

  const statusColor = {
    pending: "bg-emerald-50 text-emerald-700 border-emerald-200",
    reviewing: "bg-amber-50 text-amber-700 border-amber-200",
    matched: "bg-blue-50 text-blue-700 border-blue-200",
  }[project.status] ?? "bg-slate-50 text-slate-700 border-slate-200";

  const photos = (project.photos ?? []).filter(Boolean);

  return (
    <div className="min-h-screen bg-muted/20">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#0b1d3a] via-[#112a50] to-[#0e2245] pt-6 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.projectDetail.backToHome}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main card — overlaps hero */}
      <div className="container mx-auto px-4 max-w-5xl -mt-14 pb-28 lg:pb-16">
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-6 md:p-8">
            {/* Icon + title row */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight w-full">
                    {project.title ?? typeLabel}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    <Icon className="w-3 h-3" />
                    {typeLabel}
                  </span>
                  <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {statusLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    {project.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary/70" />
                    {postedLabel}
                  </span>
                  {project.budget && (
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                      <FileText className="w-4 h-4" />
                      {project.budget}
                    </span>
                  )}
                  {project.timeline && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-primary/70" />
                      {project.timeline}
                    </span>
                  )}
                </div>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${sizeColor}`}>
                  {sizeLabel}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — description + photos */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t.projectDetail.description}
              </h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{project.description}</p>
            </motion.div>

            {/* Details grid */}
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                {t.projectDetail.projectType}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.projectType}</dt>
                  <dd className="text-sm font-medium text-foreground capitalize">{typeLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.city}</dt>
                  <dd className="text-sm font-medium text-foreground">{project.city}</dd>
                </div>
                {project.budget && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.budget}</dt>
                    <dd className="text-sm font-bold text-primary">{project.budget}</dd>
                  </div>
                )}
                {project.timeline && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.timeline}</dt>
                    <dd className="text-sm font-medium text-foreground">{project.timeline}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.size}</dt>
                  <dd>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sizeColor}`}>{sizeLabel}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.posted}</dt>
                  <dd className="text-sm font-medium text-foreground">{postedLabel}</dd>
                </div>
              </dl>
            </motion.div>

            {/* Photos */}
            {photos.length > 0 && (
              <motion.div
                className="bg-white rounded-2xl border border-border shadow-sm p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  {t.projectDetail.photos}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      className="aspect-square rounded-xl overflow-hidden border border-border hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => setLightboxSrc(src.startsWith("http") ? src : src.startsWith("/api") ? src : `/api/storage${src}`)}
                    >
                      <img
                        src={src.startsWith("http") ? src : src.startsWith("/api") ? src : `/api/storage${src}`}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — apply sidebar */}
          <div className="space-y-4">
            {/* Poster identity — only populated by the API for authenticated users */}
            {project.posterName && project.posterName.trim() && (
              <motion.div
                className="bg-white rounded-2xl border border-border shadow-sm p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-sm font-bold text-foreground mb-3">{t.projectDetail.postedBy}</h2>
                <div className="flex items-center gap-3">
                  {project.posterAvatarUrl ? (
                    <img
                      src={resolvePhotoSrc(project.posterAvatarUrl)}
                      alt={project.posterName}
                      className="w-11 h-11 rounded-full object-cover border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                      {project.posterName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{project.posterName}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {project.posterType === "company" ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {project.posterType === "company" ? (t.companies?.company ?? "Company") : (t.companies?.individual ?? "Individual")}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
            {/* "Who unlocked your contact" — shown only to the project owner */}
            {unlockedBy !== null && (
              <motion.div
                className="bg-white rounded-2xl border border-border shadow-sm p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  {ps.panelTitle(unlockedBy.total)}
                </h2>
                {unlockedBy.total === 0 ? (
                  <p className="text-xs text-muted-foreground">{ps.noneYet}</p>
                ) : (
                  <ul className="space-y-2">
                    {unlockedBy.providers.map((p, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {p.isRevealed
                            ? <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                            : <User className="w-3.5 h-3.5 text-primary/60" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {p.isRevealed ? p.name : ps.anonLabel}
                          </p>
                        </div>
                        {p.isRevealed && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 shrink-0">
                            {ps.revealedBadge}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {/* PDF download card — gated for SPs: must unlock contact first */}
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Projektmappe</p>
              {!user ? (
                <div className="flex items-center gap-2 w-full rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground select-none">
                  <Lock className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                  <span>{us.pdfLoginRequired}</span>
                </div>
              ) : isProvider && !hasContacts ? (
                <div className="flex items-center gap-2 w-full rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground select-none">
                  <Lock className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                  <span>{us.pdfLocked}</span>
                </div>
              ) : (
                <DownloadProjectPDF
                  project={project}
                  categoryLabels={project.projectType
                    .split(",")
                    .map(k => k.trim())
                    .map(k => categories.find(c => c.key === k)?.label ?? k)}
                />
              )}
            </motion.div>

            <motion.div
              className="rounded-2xl overflow-hidden lg:sticky lg:top-24 shadow-xl shadow-primary/10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3, boxShadow: "0 28px 56px -8px rgba(30,75,138,0.45)" }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
              style={{ background: "linear-gradient(145deg,#0d2151 0%,#1a3a6e 55%,#1e4b8a 100%)" }}
            >
              {/* Header strip */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10">
                <img src="/logo-white.png" alt="ImmoVia365" className="h-7 w-auto object-contain mb-3 opacity-90" />
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {t.projectDetail.contactTitle}
                </h2>
              </div>

              {/* Body */}
              <div className="p-6">
              {hasContacts ? (
                // Contacts visible — Premium or already-unlocked Professional
                <div className="space-y-3">
                  {project.fullName && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-white/50">{us.contactName}</p>
                        <p className="text-sm font-semibold text-white">{project.fullName}</p>
                      </div>
                    </div>
                  )}
                  {project.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-white/50">{us.contactPhone}</p>
                        <a href={`tel:${project.phone}`} className="text-sm font-semibold text-primary hover:underline">{project.phone}</a>
                      </div>
                    </div>
                  )}
                  {project.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-white/50">{us.contactEmail}</p>
                        <a href={`mailto:${project.email}`} className="text-sm font-semibold text-primary hover:underline break-all">{project.email}</a>
                      </div>
                    </div>
                  )}
                  {planSlug === "premium" && (
                    <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400" />{us.unlimitedLabel}
                    </p>
                  )}
                  {["basic", "pro"].includes(planSlug) && stats && stats.contactUnlocksLimit !== -1 && (
                    <p className="text-xs text-white/50 mt-1">
                      {us.remainingLabel(stats.contactUnlocksUsed, stats.contactUnlocksLimit)}
                    </p>
                  )}
                </div>
              ) : isProvider && ["basic", "pro", "premium"].includes(planSlug) ? (
                // Basic / Professional / Premium provider — unlock button
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  {stats && stats.contactUnlocksLimit !== -1 && stats.contactUnlocksUsed >= stats.contactUnlocksLimit ? (
                    <>
                      <p className="text-sm text-white/60 mb-4 leading-relaxed">{us.limitReached}</p>
                      <Button variant="outline" className="w-full mb-2 border-white/20 text-white/60" disabled>{us.limitReached}</Button>
                      <Link href="/pricing">
                        <Button variant="link" size="sm" className="text-xs text-primary w-full">Upgrade to Premium</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {stats && stats.contactUnlocksLimit !== -1 && (
                        <p className="text-xs text-white/50 mb-4">
                          {us.remainingLabel(stats.contactUnlocksUsed, stats.contactUnlocksLimit)}
                        </p>
                      )}
                      {unlockError && <p className="text-xs text-red-300 mb-2">{unlockError}</p>}
                      <Button className="w-full bg-white text-foreground hover:bg-white/92 font-semibold shadow-lg" onClick={() => void handleUnlock()} disabled={unlockLoading}>
                        {unlockLoading
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{us.unlockingBtn}</>
                          : <><Unlock className="w-4 h-4 mr-2" />{
                              stats?.contactUnlocksLimit === -1
                                ? us.unlockBtnPremium
                                : stats && stats.contactUnlocksLimit !== -1
                                  ? us.unlockBtn(stats.contactUnlocksLimit - stats.contactUnlocksUsed)
                                  : us.unlockBtn(50)
                            }</>
                        }
                      </Button>
                    </>
                  )}
                </div>
              ) : isProvider && stats && !["basic", "pro", "premium"].includes(planSlug) ? (
                // No plan — upgrade prompt
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-base font-bold text-white mb-2">{us.upgradeTitle}</p>
                  <p className="text-sm text-white/55 mb-5 leading-relaxed">{us.upgradeText}</p>
                  <Link href="/pricing">
                    <Button className="w-full bg-white text-foreground hover:bg-white/92 font-semibold shadow-lg">
                      {us.upgradeBtn}<ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              ) : !user ? (
                // Not authenticated
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-white/65 mb-5 leading-relaxed">{t.projectDetail.contactGateLabel}</p>
                  <Link href="/register-company">
                    <Button className="w-full bg-white text-foreground hover:bg-white/92 font-semibold shadow-lg shadow-black/20 h-11">
                      {t.projectDetail.registerToContact}<ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                // Authenticated non-provider (project poster)
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-white/65 mb-5 leading-relaxed">{us.registerOnly}</p>
                  <Link href="/register-company">
                    <Button className="w-full bg-white text-foreground hover:bg-white/92 font-semibold shadow-lg shadow-black/20 h-11">
                      {t.projectDetail.registerToContact}<ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
              </div>
            </motion.div>

            {/* Find companies */}
            <Link href="/companies">
              <motion.div
                className="flex items-center gap-3 w-full rounded-xl border border-primary/20 bg-white px-4 py-3 cursor-pointer shadow-sm"
                whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(26,58,110,0.18)", borderColor: "rgba(26,58,110,0.4)" }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary flex-1">{t.nav.companies}</span>
                <ArrowRight className="w-4 h-4 text-primary/50" />
              </motion.div>
            </Link>

            {/* Back to all projects */}
            <Link href="/projects">
              <motion.div
                className="flex items-center gap-3 w-full rounded-xl border border-border bg-white px-4 py-3 cursor-pointer shadow-sm"
                whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(0,0,0,0.10)", borderColor: "rgba(26,58,110,0.25)" }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground flex-1">{t.projectDetail.viewAllProjects}</span>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA — hidden on lg+ where sidebar is visible */}
      {!hasContacts && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            {isProvider && ["basic", "pro", "premium"].includes(planSlug) ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => void handleUnlock()}
                disabled={unlockLoading || (stats ? stats.contactUnlocksLimit !== -1 && stats.contactUnlocksUsed >= stats.contactUnlocksLimit : false)}
              >
                {unlockLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{us.unlockingBtn}</>
                  : <><Unlock className="w-4 h-4 mr-2" />{
                      stats?.contactUnlocksLimit === -1
                        ? us.unlockBtnPremium
                        : stats && stats.contactUnlocksLimit !== -1
                          ? us.unlockBtn(stats.contactUnlocksLimit - stats.contactUnlocksUsed)
                          : us.unlockBtn(50)
                    }</>
                }
              </Button>
            ) : isProvider && stats && !["basic", "pro", "premium"].includes(planSlug) ? (
              <Link href="/pricing">
                <Button className="w-full" size="lg">
                  {us.upgradeBtn}<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/register-company">
                <Button className="w-full" size="lg">
                  {t.projectDetail.registerToContact}<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Project photo"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            {t.publicProfile.close}
          </button>
        </div>
      )}
    </div>
  );
}

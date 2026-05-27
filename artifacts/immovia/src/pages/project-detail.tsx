import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Clock,
  FileText,
  Mail,
  Phone,
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
  User,
  CheckCircle2,
  Image,
} from "lucide-react";
import { motion } from "framer-motion";

interface Project {
  id: number;
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

function getPostedLabel(createdAt: string, listings: { today: string; yesterday: string; daysAgo: string }): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return listings.today;
  if (diffDays === 1) return listings.yesterday;
  return `${diffDays} ${listings.daysAgo}`;
}

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const { t } = useLanguage();
  const { user } = useAuth();
  const id = params?.id;

  const [project, setProject] = useState<Project | null>(null);

  usePageMeta({
    title: project
      ? `${t.projectDetail.seoProject} ${t.offers[project.projectType as keyof typeof t.offers] ?? project.projectType} ${t.projectDetail.seoIn} ${project.city} — ImmoVia`
      : null,
    description: project?.description ? project.description.slice(0, 160) : null,
  });
  const [fetchStatus, setFetchStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setFetchStatus("loading");
    fetch(`/api/projects/${id}`)
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
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight capitalize">
                    {typeLabel}
                  </h1>
                  <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${statusColor} mt-1`}>
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
                      onClick={() => setLightboxSrc(src.startsWith("/api") ? src : `/api/storage${src}`)}
                    >
                      <img
                        src={src.startsWith("/api") ? src : `/api/storage${src}`}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — contact sidebar */}
          <div className="space-y-4">
            <motion.div
              className="bg-white rounded-2xl border border-border shadow-sm p-6 lg:sticky lg:top-24"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {t.projectDetail.contactTitle}
              </h2>

              {user ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.name}</p>
                    <p className="text-sm font-semibold text-foreground">{project.fullName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.email}</p>
                    <a href={`mailto:${project.email}`} className="text-sm font-medium text-primary hover:underline break-all">{project.email}</a>
                  </div>
                  {project.phone && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.projectDetail.phone}</p>
                      <a href={`tel:${project.phone}`} className="text-sm font-medium text-primary hover:underline">{project.phone}</a>
                    </div>
                  )}
                  <div className="pt-2 flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <a href={`mailto:${project.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.projectDetail.applyNow}
                      </a>
                    </Button>
                    {project.phone && (
                      <Button asChild variant="outline" className="w-full">
                        <a href={`tel:${project.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {t.projectDetail.phone}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{t.projectDetail.contactGateLabel}</p>
                  <Link href="/signup">
                    <Button className="w-full mb-2">
                      {t.projectDetail.registerToContact}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                      {t.projectDetail.loginToApply}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Back to all projects */}
            <Link href="/">
              <Button variant="outline" className="w-full text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.projectDetail.viewAllProjects}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA — hidden on lg+ where sidebar is visible */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur border-t border-border shadow-lg">
        <div className="container mx-auto px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          {user ? (
            <Button asChild className="w-full" size="lg">
              <a href={`mailto:${project.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                {t.projectDetail.applyNow}
              </a>
            </Button>
          ) : (
            <Link href="/signup">
              <Button className="w-full" size="lg">
                {t.projectDetail.registerToContact}
              </Button>
            </Link>
          )}
        </div>
      </div>

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

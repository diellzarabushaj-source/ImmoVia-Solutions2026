import { Link } from "wouter";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import { Briefcase, MapPin, FileText, Clock, Building2, User, MessageSquare } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { SERVICE_ICONS, SIZE_COLORS, resolvePhotoSrc, getPostedLabel } from "@/lib/display";
import { StatusBadge } from "@/components/admin/StatusBadge";

export interface ProjectCardData {
  id: number;
  title?: string | null;
  projectType: string;
  subcategory?: string | null;
  description: string;
  city: string;
  budget?: string | null;
  timeline?: string | null;
  size?: string | null;
  status?: string | null;
  photos?: string[] | null;
  posterName?: string | null;
  posterType?: string | null;
  posterAvatarUrl?: string | null;
  offersCount?: number | null;
  createdAt: string;
}

interface ProjectCardProps {
  project: ProjectCardData;
  /** Override the destination. Defaults to `/projects/:id`. Ignored when `onClick` is set. */
  href?: string;
  /** Render as a clickable element (no navigation) — used for modal triggers. */
  onClick?: () => void;
  /** Show the status badge over the cover image. */
  showStatus?: boolean;
  /** Show the poster identity footer (only populated for authenticated users). */
  showPoster?: boolean;
  /** Localized label for the offers count (e.g. "applications"). */
  offersLabel?: string;
  /** Extra content rendered at the bottom of the card body. */
  footer?: ReactNode;
  /** Render as a static card (no link/navigation) — used for admin management views with their own action controls. */
  disableLink?: boolean;
}

export function ProjectCard({
  project,
  href,
  onClick,
  showStatus = false,
  showPoster = true,
  offersLabel,
  footer,
  disableLink = false,
}: ProjectCardProps) {
  const { t } = useLanguage();
  const { categories } = useCategories("project");
  const Icon = SERVICE_ICONS[project.projectType] ?? Briefcase;
  const sz = project.size ?? "medium";
  const sizeKey =
    ({ small: "sizeSm", medium: "sizeMd", large: "sizeLg", premium: "sizePremium" } as Record<string, keyof typeof t.listings>)[sz] ??
    "sizeMd";
  const sizeLabel = t.listings[sizeKey] as string;
  const sizeColor = SIZE_COLORS[sz] ?? SIZE_COLORS.medium;
  const typeLabel = categories.find(c => c.key === project.projectType)?.label ?? project.projectType;
  const cardTitle = project.title ?? typeLabel;
  const postedLabel = getPostedLabel(project.createdAt, t.listings);
  const firstPhoto = (project.photos ?? []).find(Boolean);
  const coverSrc = firstPhoto ? resolvePhotoSrc(firstPhoto) : null;
  const posterName = project.posterName?.trim();
  const isCompanyPoster = project.posterType === "company";
  const PosterIcon = isCompanyPoster ? Building2 : User;
  const posterAvatar = project.posterAvatarUrl ? resolvePhotoSrc(project.posterAvatarUrl) : null;
  const posterInitial = posterName ? posterName.charAt(0).toUpperCase() : "";

  const inner = (
    <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden h-full cursor-pointer group">
      {/* Cover photo */}
      <div className="relative h-40 overflow-hidden bg-muted flex-shrink-0">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={cardTitle}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
            <Icon className="w-12 h-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${sizeColor}`}>{sizeLabel}</span>
        {showStatus && project.status && (
          <span className="absolute top-3 left-3">
            <StatusBadge status={project.status} />
          </span>
        )}
      </div>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mb-3">{cardTitle}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {typeLabel}
          </span>
          {project.subcategory && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              {categories.flatMap(c => c.subcategories).find(s => s.key === project.subcategory)?.label ?? project.subcategory}
            </span>
          )}
        </div>
        {/* City */}
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-2">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span>{project.city}</span>
        </div>
      </div>
      {/* Body */}
      <div className="px-5 pb-4 flex-1 flex flex-col gap-3 border-t border-border/40 pt-3">
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">{project.description}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
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
        {typeof project.offersCount === "number" && offersLabel && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>
              {project.offersCount} {offersLabel}
            </span>
          </div>
        )}
        {showPoster && posterName && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/40">
            {posterAvatar ? (
              <img
                src={posterAvatar}
                alt={posterName}
                loading="lazy"
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[11px] font-bold">
                {posterInitial}
              </div>
            )}
            <span className="text-xs font-medium text-foreground/80 truncate">{posterName}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
              <PosterIcon className="w-3 h-3" />
              {isCompanyPoster ? t.companies?.company ?? "Company" : t.companies?.individual ?? "Individual"}
            </span>
          </div>
        )}
        {footer}
      </div>
    </div>
  );

  if (disableLink) {
    return <div className="h-full">{inner}</div>;
  }
  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className="h-full text-left">
        {inner}
      </div>
    );
  }
  return (
    <Link href={href ?? `/projects/${project.id}`} className="h-full block">
      {inner}
    </Link>
  );
}

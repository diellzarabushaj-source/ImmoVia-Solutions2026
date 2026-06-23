import { Link } from "wouter";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import { MapPin, Clock, FileText, Building2, User, Star, BadgeCheck, Crown, Shield, Sparkles } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { resolvePhotoSrc, avatarGradient, initialsOf } from "@/lib/display";

export interface ProviderCardData {
  id?: number | null;
  companyName?: string | null;
  fullName?: string | null;
  workerType?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
  serviceTypes?: string[] | null;
  city?: string | null;
  yearsExperience?: number | null;
  hourlyRate?: number | string | null;
  description?: string | null;
  verified?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
  plan?: string | null;
  planType?: string | null;
  status?: string | null;
}

interface ProviderCardProps {
  provider: ProviderCardData;
  href?: string;
  onClick?: () => void;
  showDescription?: boolean;
  showRating?: boolean;
  footer?: ReactNode;
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "premium") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-300/40 flex-shrink-0 uppercase">
        <Crown className="w-2.5 h-2.5" />
        Premium
      </span>
    );
  }
  if (plan === "pro" || plan === "professional") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-300/40 flex-shrink-0 uppercase">
        <Shield className="w-2.5 h-2.5" />
        Pro
      </span>
    );
  }
  if (plan === "basic") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-border/60 text-muted-foreground bg-muted/40 flex-shrink-0">
        Basic
      </span>
    );
  }
  return null;
}

export function ProviderCard({
  provider,
  href,
  onClick,
  showDescription = false,
  showRating = true,
  footer,
}: ProviderCardProps) {
  const { t } = useLanguage();
  const { categories } = useCategories("service");
  const name = provider.companyName?.trim() || provider.fullName?.trim() || "—";
  const isIndividual = provider.workerType === "individual";
  const photo = provider.profilePhoto || provider.avatarUrl;
  const avatar = photo ? resolvePhotoSrc(photo) : null;
  const services = provider.serviceTypes ?? [];
  const rating = provider.rating ?? null;

  const planBadge = (provider.plan ?? provider.planType ?? "").toLowerCase();
  const isPremium = planBadge === "premium";
  const isPro = planBadge === "pro" || planBadge === "professional";

  const cardClass = isPremium
    ? "bg-white border-2 border-amber-400/70 shadow-lg shadow-amber-100/60 ring-1 ring-amber-200/30 hover:shadow-2xl hover:shadow-amber-100/80 hover:border-amber-500 hover:-translate-y-1"
    : isPro
      ? "bg-white border-2 border-blue-300/80 shadow-lg shadow-blue-100/50 ring-1 ring-blue-200/30 hover:shadow-2xl hover:shadow-blue-100/70 hover:border-blue-400 hover:-translate-y-1"
      : "bg-white border border-border/70 shadow-sm hover:shadow-xl hover:shadow-primary/8 hover:border-primary/25 hover:-translate-y-0.5";

  const headerBg = isPremium
    ? "bg-gradient-to-br from-amber-50 via-orange-50/80 to-white"
    : isPro
      ? "bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-white"
      : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-white";

  const accentBar = isPremium
    ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
    : isPro
      ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
      : "bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20";

  const inner = (
    <div className={`rounded-2xl transition-all duration-250 flex flex-col overflow-hidden cursor-pointer group h-full ${cardClass}`}>

      {/* Top accent bar */}
      <div className={`h-[3px] w-full flex-shrink-0 ${accentBar}`} />

      {/* Header area */}
      <div className={`${headerBg} px-4 pt-4 pb-3`}>
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            {avatar ? (
              <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 ${isPremium ? "border-amber-300/60" : isPro ? "border-blue-300/60" : "border-border/50"} shadow-sm`}>
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white font-bold text-base shadow-sm border-2 ${isPremium ? "border-amber-300/50" : isPro ? "border-blue-300/50" : "border-white"}`}
              >
                {initialsOf(name)}
              </div>
            )}
            {/* Verified dot */}
            {provider.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5">
              <h3 className={`font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors ${isPremium ? "text-amber-900" : isPro ? "text-blue-900" : "text-foreground"}`}>
                {name}
              </h3>
              {planBadge && <PlanBadge plan={planBadge} />}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {/* Worker type */}
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isIndividual ? "bg-primary/8 text-primary" : "bg-slate-100 text-slate-600"}`}>
                {isIndividual ? <User className="h-2.5 w-2.5" /> : <Building2 className="h-2.5 w-2.5" />}
                {isIndividual ? (t.companies?.individual ?? "Individual") : (t.companies?.company ?? "Company")}
              </span>
              {/* City */}
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {provider.city ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Rating row */}
        {showRating && typeof rating === "number" && rating > 0 && (
          <div className="flex items-center gap-1 mt-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-border fill-border"}`}
              />
            ))}
            <span className="text-xs font-bold text-foreground ml-1">{rating.toFixed(1)}</span>
            {provider.reviewCount ? (
              <span className="text-[11px] text-muted-foreground">({provider.reviewCount})</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`h-px mx-4 ${isPremium ? "bg-amber-200/50" : isPro ? "bg-blue-200/40" : "bg-border/40"}`} />

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">

        {/* Pricing */}
        {isIndividual && provider.hourlyRate ? (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-sm font-bold text-primary">{provider.hourlyRate} €</span>
            <span className="text-xs text-muted-foreground">/ {t.companies?.hour ?? "hr"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span>{t.companies?.contractBased ?? "Contract-based"}</span>
          </div>
        )}

        {/* Description */}
        {showDescription && provider.description && (
          <p className="text-xs text-foreground/65 leading-relaxed line-clamp-2">{provider.description}</p>
        )}

        {/* Service tags */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {services.slice(0, 3).map((svc) => (
              <span
                key={svc}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  isPremium
                    ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                    : isPro
                      ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                      : "bg-primary/6 text-primary border border-primary/12"
                }`}
              >
                {categories.find(c => c.key === svc)?.label ?? svc}
              </span>
            ))}
            {services.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] border border-border/50">
                +{services.length - 3}
              </span>
            )}
          </div>
        )}

        {footer}
      </div>

      {/* Premium shimmer overlay on hover */}
      {isPremium && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/0 via-transparent to-amber-400/0 group-hover:from-amber-400/3 group-hover:to-orange-300/5 transition-all duration-300 pointer-events-none" />
      )}
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className="h-full text-left relative">
        {inner}
      </div>
    );
  }
  return (
    <Link href={href ?? `/companies/${provider.id}`} className="h-full block relative">
      {inner}
    </Link>
  );
}

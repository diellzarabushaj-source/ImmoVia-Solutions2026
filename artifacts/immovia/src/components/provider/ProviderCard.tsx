import { Link } from "wouter";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, FileText, Building2, User, Star, BadgeCheck, Crown, Shield } from "lucide-react";
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-200/60 flex-shrink-0">
        <Crown className="w-2.5 h-2.5" />
        Premium Partner
      </span>
    );
  }
  if (plan === "pro" || plan === "professional") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-200/50 flex-shrink-0">
        <Shield className="w-2.5 h-2.5" />
        Professional
      </span>
    );
  }
  if (plan === "basic") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border border-border text-muted-foreground bg-muted/50 flex-shrink-0">
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
    ? "bg-gradient-to-br from-amber-50 via-orange-50/60 to-white border-2 border-amber-400/80 shadow-md shadow-amber-100/60 ring-1 ring-amber-200/40 hover:shadow-xl hover:shadow-amber-100/80 hover:border-amber-500 hover:-translate-y-0.5"
    : isPro
      ? "bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border-2 border-blue-300/70 shadow-md shadow-blue-100/40 ring-1 ring-blue-200/30 hover:shadow-xl hover:shadow-blue-100/60 hover:border-blue-400 hover:-translate-y-0.5"
      : "bg-white border border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5";

  const inner = (
    <div className={`rounded-2xl transition-all duration-200 flex flex-col overflow-hidden cursor-pointer group h-full ${cardClass}`}>
      {/* Plan accent strip — only for premium & pro */}
      {isPremium && (
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 flex-shrink-0" />
      )}
      {isPro && (
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-500 flex-shrink-0" />
      )}

      <div className="p-4 flex gap-3 items-start border-b border-border/50">
        {avatar ? (
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-border">
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
          >
            {initialsOf(name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-sm leading-tight flex-1 min-w-0 truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
            <Badge
              variant={isIndividual ? "outline" : "secondary"}
              className={`flex-shrink-0 text-xs flex items-center gap-1 ${isIndividual ? "border-primary/40 text-primary" : ""}`}
            >
              {isIndividual ? (
                <>
                  <User className="h-3 w-3" />
                  {t.companies?.individual ?? "Individual"}
                </>
              ) : (
                <>
                  <Building2 className="h-3 w-3" />
                  {t.companies?.company ?? "Company"}
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {provider.city ?? "—"}
            </span>
            {provider.verified && (
              <span className="inline-flex items-center gap-1 text-green-700">
                <BadgeCheck className="h-3 w-3" />
                {t.admin.stVerified}
              </span>
            )}
            {showRating && typeof rating === "number" && rating > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                {rating.toFixed(1)}
                {provider.reviewCount ? <span className="text-muted-foreground">({provider.reviewCount})</span> : null}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {isIndividual && provider.hourlyRate ? (
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm">{provider.hourlyRate} €</span>
              <span className="text-xs font-normal text-muted-foreground">/{t.companies?.hour ?? "hr"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span>{t.companies?.contractBased ?? "Contract-based"}</span>
            </div>
          )}
          {planBadge && <PlanBadge plan={planBadge} />}
        </div>
        {showDescription && provider.description && (
          <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">{provider.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {services.slice(0, 3).map((svc) => (
            <span key={svc} className="px-2 py-0.5 rounded-full bg-primary/8 text-primary text-xs font-medium">
              {categories.find(c => c.key === svc)?.label ?? svc}
            </span>
          ))}
          {services.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">+{services.length - 3}</span>
          )}
        </div>
        {footer}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className="h-full text-left">
        {inner}
      </div>
    );
  }
  return (
    <Link href={href ?? `/companies/${provider.id}`} className="h-full block">
      {inner}
    </Link>
  );
}

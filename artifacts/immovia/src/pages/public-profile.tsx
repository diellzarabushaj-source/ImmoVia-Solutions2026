import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRoute, Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  MapPin,
  Phone,
  Globe,
  Calendar,
  FileCheck,
  Loader2,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Building2,
  Mail,
  Star,
  Lock,
  Wrench,
} from "lucide-react";

interface PortfolioItem {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
}

interface PublicProfile {
  id: number;
  fullName: string;
  slug: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  companyName: string | null;
  serviceTypes: string[] | null;
  website: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  verified: boolean;
}

interface ProfileMeta {
  viewerAuthenticated: boolean;
  contactVisible: boolean;
  planBadge: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string | null;
}

interface ReviewStats {
  reviews: Review[];
  average: number | null;
  count: number;
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// Blurred bio — shows first ~120 chars clearly, blurs the rest for non-registered visitors
function BioGated({
  bio,
  meta,
  tProfile,
}: {
  bio: string;
  meta: ProfileMeta | null;
  tProfile: { registerToSeeContact: string; contactLoginCta: string };
}) {
  const [, setLocation] = useLocation();
  if (meta?.viewerAuthenticated) {
    return (
      <p className="text-sm leading-relaxed text-foreground/80" data-testid="profile-bio">
        {bio}
      </p>
    );
  }
  const preview = bio.slice(0, 120);
  const rest = bio.slice(120);
  return (
    <div className="relative">
      <p className="text-sm leading-relaxed text-foreground/80" data-testid="profile-bio">
        {preview}
        {rest && (
          <span
            className="select-none pointer-events-none"
            style={{ filter: "blur(4px)" }}
          >
            {rest}
          </span>
        )}
      </p>
      {rest && (
        <>
          <div className="absolute bottom-5 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
          <button
            onClick={() => setLocation("/sign-up")}
            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 font-medium mt-1 block"
          >
            {tProfile.registerToSeeContact}
          </button>
        </>
      )}
    </div>
  );
}

// Blurred services row — shows first 2 clearly, blurs the rest for non-registered visitors
function ServicesGated({
  serviceTypes,
  meta,
  tProfile,
}: {
  serviceTypes: string[];
  meta: ProfileMeta | null;
  tProfile: {
    servicesTitle: string;
    registerToSeeServices: string;
    moreServicesBlurred: string;
    contactLoginCta: string;
  };
}) {
  const [, setLocation] = useLocation();
  const visible = serviceTypes.slice(0, 2);
  const hidden = serviceTypes.slice(2);
  const isBlurred = !meta?.viewerAuthenticated && hidden.length > 0;

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <Wrench className="w-3.5 h-3.5" />
        {tProfile.servicesTitle}
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        {visible.map((s) => (
          <span
            key={s}
            className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
          >
            {s}
          </span>
        ))}
        {hidden.length > 0 && (
          <span className="relative">
            {/* blurred ghost pills */}
            <span className="flex gap-1.5 select-none pointer-events-none">
              {hidden.slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                  style={{ filter: "blur(5px)" }}
                >
                  {isBlurred ? "••••••" : s}
                </span>
              ))}
            </span>
            {isBlurred && (
              <button
                onClick={() => setLocation("/sign-up")}
                className="ml-1 text-xs text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
              >
                +{hidden.length} {tProfile.moreServicesBlurred}
              </button>
            )}
            {!isBlurred &&
              hidden.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {s}
                </span>
              ))}
          </span>
        )}
      </div>
    </div>
  );
}

// Gated contact section
function ContactSection({
  u,
  meta,
  tProfile,
  openMessage,
}: {
  u: PublicProfile;
  meta: ProfileMeta | null;
  tProfile: {
    contactInfo: string;
    contactLoginPrompt: string;
    contactLoginCta: string;
    registerToSeeContact: string;
    platformMessagesOnly: string;
    platformMessagesCta: string;
    sendMessage: string;
    submitProject: string;
  };
  openMessage: () => void;
}) {
  const [, setLocation] = useLocation();

  // Not authenticated → show blur overlay
  if (!meta?.viewerAuthenticated) {
    return (
      <div className="relative rounded-xl border border-dashed border-primary/30 bg-primary/4 overflow-hidden">
        {/* Blurred background preview of contact rows */}
        <div className="p-5 select-none pointer-events-none" style={{ filter: "blur(6px)" }}>
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {tProfile.contactInfo}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+41 79 ••• •• ••</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>info@•••••••.ch</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>www.•••••••.ch</span>
            </div>
          </div>
        </div>
        {/* CTA overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm gap-3 p-4">
          <Lock className="w-5 h-5 text-primary/70" />
          <p className="text-sm font-semibold text-center text-foreground">
            {tProfile.registerToSeeContact}
          </p>
          <Button size="sm" onClick={() => setLocation("/sign-up")}>
            {tProfile.contactLoginCta}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated but SP on Basic plan — platform messages only
  if (!meta.contactVisible) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {tProfile.contactInfo}
        </p>
        <p className="text-sm text-muted-foreground mb-4">{tProfile.platformMessagesOnly}</p>
        <Button variant="outline" size="sm" onClick={openMessage}>
          <MessageSquare className="w-4 h-4 mr-2" />
          {tProfile.platformMessagesCta}
        </Button>
      </div>
    );
  }

  // Authenticated + SP Pro/Premium — show full contact
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5">
      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
        {tProfile.contactInfo}
      </p>
      <div className="space-y-2 text-sm">
        {u.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <a href={`tel:${u.phone}`} className="hover:text-primary">
              {u.phone}
            </a>
          </div>
        )}
        {u.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <a href={`mailto:${u.email}`} className="hover:text-primary truncate">
              {u.email}
            </a>
          </div>
        )}
        {u.website && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <a
              href={u.website}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary truncate"
            >
              {u.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
        {!u.phone && !u.email && !u.website && (
          <p className="text-muted-foreground">{tProfile.platformMessagesOnly}</p>
        )}
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const [, params] = useRoute("/company/:slug");
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const slug = params?.slug;
  const [data, setData] = useState<{
    user: PublicProfile;
    portfolio: PortfolioItem[];
    meta: ProfileMeta;
  } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  usePageMeta({
    title: data?.user
      ? `${data.user.fullName}${data.user.city ? ` · ${data.user.city}` : ""} — ImmoVia365`
      : null,
    description: data?.user.bio ? data.user.bio.slice(0, 160) : null,
  });
  useStructuredData(
    data?.user
      ? [
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: data.user.fullName,
            description: data.user.bio ?? undefined,
            address: {
              "@type": "PostalAddress",
              addressLocality: data.user.city ?? undefined,
              addressCountry: "CH",
            },
            url: `${APP_URL}/company/${slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Startseite", item: `${APP_URL}/` },
              {
                "@type": "ListItem",
                position: 2,
                name: "Dienstleister",
                item: `${APP_URL}/companies`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: data.user.fullName,
                item: `${APP_URL}/company/${slug}`,
              },
            ],
          },
        ]
      : null
  );
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    fetch(`/api/users/by-slug/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!r.ok) {
          setStatus("notfound");
          return;
        }
        const json = (await r.json()) as {
          user: PublicProfile;
          portfolio: PortfolioItem[];
          meta: ProfileMeta;
        };
        setData(json);
        setStatus("ready");
        fetch(`/api/reviews/by-provider/${json.user.id}`)
          .then(async (rr) => {
            if (rr.ok) {
              const stats = (await rr.json()) as ReviewStats;
              setReviewStats(stats);
            }
          })
          .catch(() => {});
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  const openMessage = () => {
    if (!user) {
      setLocation("/sign-in");
      return;
    }
    if (!data) return;
    window.dispatchEvent(
      new CustomEvent("immovia:open-chat", {
        detail: { userId: data.user.id, displayName: data.user.fullName },
      })
    );
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "notfound" || !data) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t.publicProfile.notFound}</h1>
        <Link href="/companies">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.publicProfile.backToCompanies}
          </Button>
        </Link>
      </div>
    );
  }

  const u = data.user;
  const meta = data.meta;
  const displayName = u.companyName || u.fullName;
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link href="/companies">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          data-testid="link-back-companies"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.publicProfile.backToCompanies}
        </Button>
      </Link>

      {/* Hero card */}
      <Card className="p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt={displayName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {initials}
              </div>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1
                className="text-2xl md:text-3xl font-serif font-bold"
                data-testid="profile-name"
              >
                {displayName}
              </h1>
              {u.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {t.publicProfile.verified}
                </span>
              )}
              {meta.planBadge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                  {meta.planBadge}
                </span>
              )}
            </div>

            {u.companyName && (
              <p className="text-sm text-muted-foreground mb-2">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                {u.fullName}
              </p>
            )}

            {reviewStats && reviewStats.count > 0 && (
              <div
                className="flex items-center gap-2 mb-3"
                data-testid="profile-rating"
              >
                <StarRating value={reviewStats.average ?? 0} />
                <span className="text-sm font-semibold">{reviewStats.average}</span>
                <span className="text-sm text-muted-foreground">
                  ({reviewStats.count} {t.reviews.title.toLowerCase()})
                </span>
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
              {u.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {u.city}
                </span>
              )}
              {u.yearsExperience != null && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {u.yearsExperience} {t.publicProfile.yearsExperience}
                </span>
              )}
              {u.licenseNumber && (
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  {t.publicProfile.license}: {u.licenseNumber}
                </span>
              )}
            </div>

            {/* Services — gated for non-registered */}
            {u.serviceTypes && u.serviceTypes.length > 0 && (
              <ServicesGated
                serviceTypes={u.serviceTypes}
                meta={meta}
                tProfile={t.publicProfile}
              />
            )}

            {/* Bio — blurred for non-registered */}
            {u.bio && (
              <BioGated bio={u.bio} meta={meta} tProfile={t.publicProfile} />
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-5 pt-5 border-t border-border flex gap-3 flex-wrap">
          <Button onClick={openMessage}>
            <MessageSquare className="w-4 h-4 mr-2" />
            {t.publicProfile.sendMessage}
          </Button>
          <Button asChild variant="outline">
            <Link href="/submit-project">
              <ArrowRight className="w-4 h-4 mr-2" />
              {t.publicProfile.submitProject}
            </Link>
          </Button>
        </div>
      </Card>

      {/* Body grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Left — portfolio + reviews */}
        <div className="lg:col-span-2 space-y-6">

          {/* Portfolio */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-serif font-bold">{t.publicProfile.portfolio}</h2>
              <span className="text-sm text-muted-foreground">
                {data.portfolio.length} {t.publicProfile.projects}
              </span>
            </div>
            {data.portfolio.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">
                {t.publicProfile.noPortfolio}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.portfolio.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLightbox(item)}
                    className="group text-left"
                    data-testid={`portfolio-item-${item.id}`}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={item.imageUrl}
                          alt={item.title || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      {(item.title || item.description) && (
                        <div className="p-4">
                          {item.title && (
                            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                          )}
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-serif font-bold">{t.reviews.title}</h2>
              {reviewStats && reviewStats.count > 0 && (
                <span className="text-sm text-muted-foreground">
                  {reviewStats.average} {t.reviews.average} · {reviewStats.count}
                </span>
              )}
            </div>
            {!reviewStats || reviewStats.count === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">
                {t.reviews.noReviews}
              </Card>
            ) : (
              <div className="space-y-4" data-testid="reviews-list">
                {reviewStats.reviews.map((review) => (
                  <Card key={review.id} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{review.authorName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StarRating value={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — contact gated */}
        <div className="space-y-4">
          <ContactSection
            u={u}
            meta={meta}
            tProfile={t.publicProfile}
            openMessage={openMessage}
          />

          {/* Quick actions */}
          <Card className="p-5">
            <p className="text-sm font-semibold mb-3">{t.publicProfile.haveProject}</p>
            <Button asChild className="w-full">
              <Link href="/submit-project">
                {t.publicProfile.sendProject}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-4xl w-full bg-card rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.imageUrl}
              alt=""
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-5">
              {lightbox.title && (
                <h3 className="font-bold text-lg mb-2">{lightbox.title}</h3>
              )}
              {lightbox.description && (
                <p className="text-sm text-muted-foreground">{lightbox.description}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLightbox(null)}
                className="mt-4"
              >
                {t.publicProfile.close}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

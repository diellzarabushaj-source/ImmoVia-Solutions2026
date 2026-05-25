import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
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
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  companyName: string | null;
  serviceTypes: string[] | null;
  website: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  verified: boolean;
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

export default function PublicProfilePage() {
  const [, params] = useRoute("/company/:slug");
  const { t } = useLanguage();
  const slug = params?.slug;
  const [data, setData] = useState<{ user: PublicProfile; portfolio: PortfolioItem[] } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  usePageMeta({
    title: data?.user
      ? `${data.user.fullName}${data.user.city ? ` · ${data.user.city}` : ""} — ImmoVia`
      : null,
    description: data?.user.bio ? data.user.bio.slice(0, 160) : null,
  });
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
        const json = (await r.json()) as { user: PublicProfile; portfolio: PortfolioItem[] };
        setData(json);
        setStatus("ready");
        // Fetch reviews for this provider
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
        <Button variant="ghost" size="sm" className="mb-6" data-testid="link-back-companies">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.publicProfile.backToCompanies}
        </Button>
      </Link>

      <Card className="p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl md:text-3xl font-serif font-bold" data-testid="profile-name">
                {displayName}
              </h1>
              {u.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {t.publicProfile.verified}
                </span>
              )}
            </div>

            {u.companyName && (
              <p className="text-sm text-muted-foreground mb-3">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                {u.fullName}
              </p>
            )}

            {reviewStats && reviewStats.count > 0 && (
              <div className="flex items-center gap-2 mb-3" data-testid="profile-rating">
                <StarRating value={reviewStats.average ?? 0} />
                <span className="text-sm font-semibold">{reviewStats.average}</span>
                <span className="text-sm text-muted-foreground">
                  ({reviewStats.count} {t.reviews.title.toLowerCase()})
                </span>
              </div>
            )}

            {u.serviceTypes && u.serviceTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {u.serviceTypes.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {u.bio && (
              <p className="text-sm leading-relaxed mb-4" data-testid="profile-bio">
                {u.bio}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {u.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{u.city}</span>
                </div>
              )}
              {u.yearsExperience != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {u.yearsExperience} {t.publicProfile.yearsExperience}
                  </span>
                </div>
              )}
              {u.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${u.phone}`} className="hover:text-primary">
                    {u.phone}
                  </a>
                </div>
              )}
              {u.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
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
              {u.licenseNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {t.publicProfile.license}: {u.licenseNumber}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${u.email}`} className="hover:text-primary truncate">
                  {u.email}
                </a>
              </div>
            </div>

            <div className="mt-5 flex gap-3 flex-wrap">
              <Button asChild data-testid="button-message">
                <a href={`mailto:${u.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {t.publicProfile.sendMessage}
                </a>
              </Button>
              {u.phone && (
                <Button asChild variant="outline">
                  <a href={`tel:${u.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {u.phone}
                  </a>
                </Button>
              )}
              <Button asChild variant="outline">
                <a href="/submit-project">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t.publicProfile.submitProject ?? "Submit a Project"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Portfolio */}
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-serif font-bold">{t.publicProfile.portfolio}</h2>
        <span className="text-sm text-muted-foreground">
          {data.portfolio.length} {t.publicProfile.projects}
        </span>
      </div>

      {data.portfolio.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground mb-8">
          {t.publicProfile.noPortfolio}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
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
                    {item.title && <h3 className="font-semibold text-sm mb-1">{item.title}</h3>}
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

      {/* Reviews */}
      <div className="mb-4 flex items-baseline justify-between">
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
                <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
              )}
            </Card>
          ))}
        </div>
      )}

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
            <img src={lightbox.imageUrl} alt="" className="w-full max-h-[70vh] object-contain bg-black" />
            <div className="p-5">
              {lightbox.title && <h3 className="font-bold text-lg mb-2">{lightbox.title}</h3>}
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

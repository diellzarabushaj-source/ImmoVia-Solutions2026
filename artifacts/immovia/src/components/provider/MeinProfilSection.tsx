import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  MapPin,
  Phone,
  Globe,
  Calendar,
  FileCheck,
  Loader2,
  BadgeCheck,
  Building2,
  Mail,
  Star,
  Tag,
  CircleDollarSign,
  Camera,
  User,
  ExternalLink,
} from "lucide-react";

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Profilvorschau",
    subtitle: "So sieht Ihr Profil für Auftraggeber aus.",
    editProfile: "Profil bearbeiten",
    editPhoto: "Foto & Logo bearbeiten",
    editServices: "Leistungen bearbeiten",
    editPricing: "Preise bearbeiten",
    viewPublic: "Öffentliches Profil anzeigen",
    noPhoto: "Kein Foto",
    verified: "Verifiziert",
    yearsExp: "Jahre Erfahrung",
    license: "Lizenznummer",
    serviceTypes: "Leistungen",
    noServices: "Noch keine Leistungen angegeben.",
    pricing: "Preise & Tarife",
    noPricing: "Noch keine Preisinformationen.",
    portfolio: "Portfolio",
    noPortfolio: "Noch keine Portfolio-Fotos.",
    reviews: "Bewertungen",
    noReviews: "Noch keine Bewertungen.",
    loading: "Wird geladen…",
    hourlyRate: "Stundensatz",
    priceFrom: "Ab",
    coverImage: "Titelbild",
    noCover: "Kein Titelbild hochgeladen.",
    editCover: "Titelbild bearbeiten",
    individual: "Einzelperson",
    company: "Unternehmen",
    bio: "Über mich",
    contact: "Kontakt",
  },
  en: {
    title: "Profile Preview",
    subtitle: "This is how your profile appears to project posters.",
    editProfile: "Edit profile",
    editPhoto: "Edit photo & logo",
    editServices: "Edit services",
    editPricing: "Edit pricing",
    viewPublic: "View public profile",
    noPhoto: "No photo",
    verified: "Verified",
    yearsExp: "years experience",
    license: "Licence number",
    serviceTypes: "Services",
    noServices: "No services listed yet.",
    pricing: "Pricing",
    noPricing: "No pricing information yet.",
    portfolio: "Portfolio",
    noPortfolio: "No portfolio photos yet.",
    reviews: "Reviews",
    noReviews: "No reviews yet.",
    loading: "Loading…",
    hourlyRate: "Hourly rate",
    priceFrom: "From",
    coverImage: "Cover image",
    noCover: "No cover image uploaded.",
    editCover: "Edit cover image",
    individual: "Individual",
    company: "Company",
    bio: "About",
    contact: "Contact",
  },
  sq: {
    title: "Pamja e Profilit",
    subtitle: "Kështu shfaqet profili juaj për autorët e projekteve.",
    editProfile: "Edito profilin",
    editPhoto: "Edito foton & logon",
    editServices: "Edito shërbimet",
    editPricing: "Edito çmimet",
    viewPublic: "Shiko profilin publik",
    noPhoto: "Pa foto",
    verified: "I verifikuar",
    yearsExp: "vite përvojë",
    license: "Nr. i licencës",
    serviceTypes: "Shërbimet",
    noServices: "Asnjë shërbim i shtuar ende.",
    pricing: "Çmimet",
    noPricing: "Asnjë informacion çmimesh ende.",
    portfolio: "Portofoli",
    noPortfolio: "Asnjë foto portofoli ende.",
    reviews: "Vlerësimet",
    noReviews: "Asnjë vlerësim ende.",
    loading: "Duke ngarkuar…",
    hourlyRate: "Tarifa orare",
    priceFrom: "Nga",
    coverImage: "Foto kryesore",
    noCover: "Asnjë foto kryesore e ngarkuar.",
    editCover: "Edito foton kryesore",
    individual: "Individ",
    company: "Kompani",
    bio: "Rreth meje",
    contact: "Kontakti",
  },
  fr: {
    title: "Aperçu du profil",
    subtitle: "Voici comment votre profil apparaît aux porteurs de projets.",
    editProfile: "Modifier le profil",
    editPhoto: "Modifier la photo & le logo",
    editServices: "Modifier les services",
    editPricing: "Modifier les tarifs",
    viewPublic: "Voir le profil public",
    noPhoto: "Pas de photo",
    verified: "Vérifié",
    yearsExp: "ans d'expérience",
    license: "Numéro de licence",
    serviceTypes: "Services",
    noServices: "Aucun service renseigné.",
    pricing: "Tarifs",
    noPricing: "Aucune information tarifaire.",
    portfolio: "Portfolio",
    noPortfolio: "Pas encore de photos de portfolio.",
    reviews: "Avis",
    noReviews: "Aucun avis pour l'instant.",
    loading: "Chargement…",
    hourlyRate: "Taux horaire",
    priceFrom: "À partir de",
    coverImage: "Image de couverture",
    noCover: "Aucune image de couverture.",
    editCover: "Modifier l'image de couverture",
    individual: "Particulier",
    company: "Entreprise",
    bio: "À propos",
    contact: "Contact",
  },
};

interface ProfileData {
  user: {
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
    city?: string | null;
    bio?: string | null;
    website?: string | null;
    avatarUrl?: string | null;
    companyName?: string | null;
    serviceTypes?: string[] | null;
    verified?: boolean | null;
    licenseNumber?: string | null;
    yearsExperience?: number | null;
    accountSubtype?: string | null;
    slug?: string | null;
  };
  company?: {
    profilePhoto?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    description?: string | null;
    hourlyRate?: number | null;
    priceType?: string | null;
    priceFromChf?: string | null;
    priceUnit?: string | null;
    priceNote?: string | null;
    priceIsPublic?: boolean | null;
  } | null;
  portfolio: Array<{ id: number; imageUrl: string; title?: string | null; description?: string | null }>;
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
          className={`w-4 h-4 ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

interface EditButtonProps {
  label: string;
  onClick: () => void;
}

function EditButton({ label, onClick }: EditButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/8 border border-transparent hover:border-primary/20"
    >
      <Pencil className="w-3 h-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface Props {
  language: string;
  onNavigate: (section: string) => void;
}

export default function MeinProfilSection({ language, onNavigate }: Props) {
  const l = L[language] ?? L.de;

  const [data, setData] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ imageUrl: string; title?: string | null } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/provider/profile")
      .then(r => r.ok ? r.json() as Promise<ProfileData> : Promise.reject())
      .then(d => {
        setData(d);
        // Fetch reviews if we have a user ID
        if (d.user.id) {
          fetch(`/api/reviews/by-provider/${d.user.id}`)
            .then(rr => rr.ok ? rr.json() as Promise<ReviewStats> : Promise.reject())
            .then(setReviews)
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const u = data.user;
  const c = data.company;
  const isCompany = u.accountSubtype === "company";

  // Avatar: individual uses profilePhoto, company uses logoUrl
  const avatarUrl = isCompany ? (c?.logoUrl ?? c?.profilePhoto) : (c?.profilePhoto ?? u.avatarUrl);
  const displayName = u.companyName || u.fullName;
  const initials = displayName
    .split(/\s+/)
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold">{l.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{l.subtitle}</p>
        </div>
        {u.slug && (
          <a
            href={`/company/${u.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {l.viewPublic}
          </a>
        )}
      </div>

      {/* ── HEADER CARD ── */}
      <Card className="p-5 md:p-7">
        {/* Cover image */}
        {c?.coverImageUrl && (
          <div className="relative -mx-5 md:-mx-7 -mt-5 md:-mt-7 mb-6 h-32 md:h-44 overflow-hidden rounded-t-lg">
            <img src={c.coverImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {initials}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl md:text-2xl font-serif font-bold">{displayName}</h3>
                {u.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {l.verified}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <EditButton label={l.editPhoto} onClick={() => onNavigate("profilbild")} />
                <EditButton label={l.editProfile} onClick={() => onNavigate("profil")} />
              </div>
            </div>

            {/* Subtype pill */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              {isCompany ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span>{isCompany ? l.company : l.individual}</span>
              {u.companyName && u.fullName !== u.companyName && (
                <span className="text-muted-foreground/50">· {u.fullName}</span>
              )}
            </div>

            {/* Review stars */}
            {reviews && reviews.count > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating value={reviews.average ?? 0} />
                <span className="text-sm font-semibold">{reviews.average}</span>
                <span className="text-sm text-muted-foreground">({reviews.count})</span>
              </div>
            )}

            {/* Bio */}
            {u.bio && (
              <p className="text-sm leading-relaxed mb-4 text-foreground/80">{u.bio}</p>
            )}

            {/* Contact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {u.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{u.city}</span>
                </div>
              )}
              {u.yearsExperience != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{u.yearsExperience} {l.yearsExp}</span>
                </div>
              )}
              {u.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{u.phone}</span>
                </div>
              )}
              {u.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="truncate">{u.website.replace(/^https?:\/\//, "")}</span>
                </div>
              )}
              {u.licenseNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>{l.license}: {u.licenseNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{u.email}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── COVER IMAGE (if no cover shown above, show placeholder) ── */}
      {!c?.coverImageUrl && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Camera className="w-4 h-4" />
              <span>{l.coverImage}</span>
              <span className="text-muted-foreground/60">— {l.noCover}</span>
            </div>
            <EditButton label={l.editCover} onClick={() => onNavigate("profilbild")} />
          </div>
        </Card>
      )}

      {/* ── SERVICES ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {l.serviceTypes}
          </h4>
          <EditButton label={l.editServices} onClick={() => onNavigate("leistungen")} />
        </div>
        {u.serviceTypes && u.serviceTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {u.serviceTypes.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{l.noServices}</p>
        )}
      </Card>

      {/* ── PRICING ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-primary" />
            {l.pricing}
          </h4>
          <EditButton label={l.editPricing} onClick={() => onNavigate("preise")} />
        </div>
        {(c?.hourlyRate || c?.priceFromChf || c?.priceNote) ? (
          <div className="space-y-1.5 text-sm text-foreground/80">
            {c?.hourlyRate && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{l.hourlyRate}:</span>
                <span className="font-medium">CHF {c.hourlyRate}/h</span>
              </div>
            )}
            {c?.priceFromChf && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{l.priceFrom}:</span>
                <span className="font-medium">CHF {c.priceFromChf} {c?.priceUnit ?? ""}</span>
              </div>
            )}
            {c?.priceNote && (
              <p className="text-muted-foreground text-xs mt-2">{c.priceNote}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{l.noPricing}</p>
        )}
      </Card>

      {/* ── PORTFOLIO ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">{l.portfolio}</h4>
        </div>
        {data.portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">{l.noPortfolio}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.portfolio.map(item => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="group aspect-square rounded-xl overflow-hidden border border-border bg-muted hover:shadow-md transition-shadow"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title ?? ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* ── REVIEWS ── */}
      <Card className="p-5">
        <h4 className="text-sm font-semibold mb-3">{l.reviews}</h4>
        {!reviews || reviews.count === 0 ? (
          <p className="text-sm text-muted-foreground">{l.noReviews}</p>
        ) : (
          <div className="space-y-4">
            {reviews.reviews.map(review => (
              <div key={review.id} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <p className="text-sm font-semibold">{review.authorName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StarRating value={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-3xl w-full bg-card rounded-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <img src={lightbox.imageUrl} alt="" className="w-full max-h-[65vh] object-contain bg-black" />
            {lightbox.title && (
              <div className="p-4">
                <p className="font-semibold text-sm">{lightbox.title}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  AlignLeft,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Profilvorschau",
    subtitle: "So sieht Ihr Profil für Auftraggeber aus.",
    editProfile: "Profil bearbeiten",
    editPhoto: "Foto & Logo bearbeiten",
    editServices: "Leistungen bearbeiten",
    editPricing: "Preise bearbeiten",
    editPortfolio: "Portfolio bearbeiten",
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
    noAbout: "Noch keine Beschreibung. Klicken Sie auf Bearbeiten, um sich vorzustellen.",
    contact: "Kontakt",
    visibilityTitle: "Sichtbarkeit für Besucher",
    visibilityDesc: "Was andere auf Ihrem öffentlichen Profil sehen können:",
    fieldCity: "Ort / Stadt",
    fieldAbout: "Über mich (Beschreibung)",
    fieldPhone: "Telefonnummer",
    fieldEmail: "E-Mail-Adresse",
    fieldWebsite: "Webseite",
    fieldServices: "Leistungen",
    serviceArea: "Einsatzregion",
    noServiceArea: "Keine Region angegeben.",
    specializations: "Spezialisierungen",
    noSpecializations: "Keine Spezialisierungen angegeben.",
    visibleAll: "Für alle sichtbar",
    visibleRegistered: "Sichtbar für angemeldete Nutzer",
    blurredNonRegistered: "Verschwommen für nicht angemeldete Nutzer",
    hiddenBasic: "Verborgen (Basic-Tarif)",
    visiblePlan: "Sichtbar (Pro/Premium)",
    upgradeHint: "Wechseln Sie auf Pro oder Premium, um Kontaktdaten zu zeigen.",
    upgradePlan: "Plan upgraden",
  },
  en: {
    title: "Profile Preview",
    subtitle: "This is how your profile appears to project posters.",
    editProfile: "Edit profile",
    editPhoto: "Edit photo & logo",
    editServices: "Edit services",
    editPricing: "Edit pricing",
    editPortfolio: "Edit portfolio",
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
    noAbout: "No description yet. Click Edit to introduce yourself.",
    contact: "Contact",
    visibilityTitle: "Visitor Visibility",
    visibilityDesc: "What others can see on your public profile:",
    fieldCity: "City / Location",
    fieldAbout: "About (description)",
    fieldPhone: "Phone number",
    fieldEmail: "Email address",
    fieldWebsite: "Website",
    fieldServices: "Services",
    serviceArea: "Service area",
    noServiceArea: "No service area specified.",
    specializations: "Specializations",
    noSpecializations: "No specializations listed.",
    visibleAll: "Visible to everyone",
    visibleRegistered: "Visible to registered users",
    blurredNonRegistered: "Blurred for non-registered visitors",
    hiddenBasic: "Hidden (Basic plan)",
    visiblePlan: "Visible (Pro/Premium)",
    upgradeHint: "Upgrade to Pro or Premium to show your contact details.",
    upgradePlan: "Upgrade plan",
  },
  sq: {
    title: "Pamja e Profilit",
    subtitle: "Kështu shfaqet profili juaj për autorët e projekteve.",
    editProfile: "Edito profilin",
    editPhoto: "Edito foton & logon",
    editServices: "Edito shërbimet",
    editPricing: "Edito çmimet",
    editPortfolio: "Edito portofolin",
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
    noAbout: "Asnjë përshkrim ende. Klikoni Edito për t'u prezantuar.",
    contact: "Kontakti",
    visibilityTitle: "Dukshmëria për Vizitorët",
    visibilityDesc: "Çfarë mund të shohin të tjerët në profilin tuaj publik:",
    fieldCity: "Qyteti / Vendndodhja",
    fieldAbout: "Rreth meje (përshkrimi)",
    fieldPhone: "Numri i telefonit",
    fieldEmail: "Adresa e emailit",
    fieldWebsite: "Faqja web",
    fieldServices: "Shërbimet",
    serviceArea: "Zona e shërbimit",
    noServiceArea: "Asnjë zonë e specifikuar.",
    specializations: "Specializime",
    noSpecializations: "Asnjë specializim i shtuar.",
    visibleAll: "E dukshme për të gjithë",
    visibleRegistered: "E dukshme për përdoruesit e regjistruar",
    blurredNonRegistered: "E turbullt për vizitorët jo të regjistruar",
    hiddenBasic: "E fshehur (Plani Basic)",
    visiblePlan: "E dukshme (Pro/Premium)",
    upgradeHint: "Kaloni në Pro ose Premium për të shfaqur të dhënat e kontaktit.",
    upgradePlan: "Ndrysho planin",
  },
  fr: {
    title: "Aperçu du profil",
    subtitle: "Voici comment votre profil apparaît aux porteurs de projets.",
    editProfile: "Modifier le profil",
    editPhoto: "Modifier la photo & le logo",
    editServices: "Modifier les services",
    editPricing: "Modifier les tarifs",
    editPortfolio: "Modifier le portfolio",
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
    noAbout: "Aucune description pour l'instant. Cliquez sur Modifier pour vous présenter.",
    contact: "Contact",
    visibilityTitle: "Visibilité pour les visiteurs",
    visibilityDesc: "Ce que les autres peuvent voir sur votre profil public :",
    fieldCity: "Ville / Localisation",
    fieldAbout: "À propos (description)",
    fieldPhone: "Numéro de téléphone",
    fieldEmail: "Adresse e-mail",
    fieldWebsite: "Site web",
    fieldServices: "Services",
    serviceArea: "Zone de service",
    noServiceArea: "Aucune zone de service spécifiée.",
    specializations: "Spécialisations",
    noSpecializations: "Aucune spécialisation renseignée.",
    visibleAll: "Visible par tous",
    visibleRegistered: "Visible par les utilisateurs inscrits",
    blurredNonRegistered: "Flouté pour les visiteurs non inscrits",
    hiddenBasic: "Masqué (Plan Basic)",
    visiblePlan: "Visible (Pro/Premium)",
    upgradeHint: "Passez à Pro ou Premium pour afficher vos coordonnées.",
    upgradePlan: "Changer de plan",
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
    serviceTypes?: string[] | null;
    serviceArea?: string | null;
    specializations?: string[] | null;
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

interface BillingStats {
  planSlug: string;
  planName: string;
  contactVisible: boolean;
  badge: string;
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
  const [billing, setBilling] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ imageUrl: string; title?: string | null } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/provider/profile").then(r => r.ok ? r.json() as Promise<ProfileData> : Promise.reject()),
      fetch("/api/provider/app-stats").then(r => r.ok ? r.json() as Promise<BillingStats> : Promise.resolve(null)).catch(() => null),
    ])
      .then(([d, b]) => {
        setData(d);
        setBilling(b);
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
                {billing?.badge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                    {billing.badge}
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

      {/* ── ABOUT ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-primary" />
            {l.bio}
          </h4>
          <EditButton label={l.editProfile} onClick={() => onNavigate("profil")} />
        </div>
        {(u.bio || c?.description) ? (
          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {u.bio || c?.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">{l.noAbout}</p>
        )}
      </Card>

      {/* ── VISIBILITY PANEL ── */}
      <Card className="p-5 border-primary/20 bg-primary/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            {l.visibilityTitle}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{l.visibilityDesc}</p>
        <div className="space-y-2.5 text-sm">
          {/* City — always visible */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {l.fieldCity}
            </span>
            <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {l.visibleAll}
            </span>
          </div>
          {/* About — blurred for non-registered */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <AlignLeft className="w-3.5 h-3.5 shrink-0" />
              {l.fieldAbout}
            </span>
            <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {l.blurredNonRegistered}
            </span>
          </div>
          {/* Services — first 2 visible, rest blurred for non-registered */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Tag className="w-3.5 h-3.5 shrink-0" />
              {l.fieldServices}
            </span>
            <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {l.blurredNonRegistered}
            </span>
          </div>
          {/* Phone */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              {l.fieldPhone}
            </span>
            {billing?.contactVisible ? (
              <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {l.visiblePlan}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                {l.hiddenBasic}
              </span>
            )}
          </div>
          {/* Email */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {l.fieldEmail}
            </span>
            {billing?.contactVisible ? (
              <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {l.visiblePlan}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                {l.hiddenBasic}
              </span>
            )}
          </div>
          {/* Website */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              {l.fieldWebsite}
            </span>
            {billing?.contactVisible ? (
              <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {l.visiblePlan}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                {l.hiddenBasic}
              </span>
            )}
          </div>
        </div>
        {/* Upgrade hint if on Basic */}
        {billing && !billing.contactVisible && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">{l.upgradeHint}</p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-primary/30 text-primary hover:bg-primary/8"
              onClick={() => onNavigate("abonnement")}
            >
              {l.upgradePlan}
            </Button>
          </div>
        )}
      </Card>

      {/* ── SERVICES ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {l.serviceTypes}
          </h4>
          <EditButton label={l.editServices} onClick={() => onNavigate("leistungen")} />
        </div>
        {(() => {
          const svcTypes = c?.serviceTypes ?? u.serviceTypes;
          return svcTypes && svcTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {svcTypes.map(s => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{l.noServices}</p>
          );
        })()}

        {/* Service area */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{l.serviceArea}</span>
          </div>
          {c?.serviceArea ? (
            <p className="text-sm text-foreground/80">{c.serviceArea}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">{l.noServiceArea}</p>
          )}
        </div>

        {/* Specializations */}
        {((c?.specializations && c.specializations.length > 0) || true) && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{l.specializations}</span>
            </div>
            {c?.specializations && c.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.specializations.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary/80">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{l.noSpecializations}</p>
            )}
          </div>
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
        {(c?.priceFromChf || c?.priceNote) ? (
          <div className="space-y-1.5 text-sm text-foreground/80">
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
          <EditButton label={l.editPortfolio} onClick={() => onNavigate("galerie")} />
        </div>
        {data.portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">{l.noPortfolio}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.portfolio.map(item => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="group text-left rounded-xl overflow-hidden border border-border bg-muted hover:shadow-md transition-shadow"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                {(item.title || item.description) && (
                  <div className="p-3 bg-background">
                    {item.title && (
                      <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                    )}
                  </div>
                )}
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

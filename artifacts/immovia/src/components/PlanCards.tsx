import { Star, Zap, Crown, Check, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export type PlanType = "basic" | "professional" | "premium";

interface PlanCardsProps {
  selected: PlanType | null;
  onSelect: (plan: PlanType) => void;
}

export const PLAN_CONFIG: Record<PlanType, {
  icon: React.ReactNode;
  monthlyChf: number;
  monthlyCredits: number;
  badge: Record<string, string>;
  features: Record<string, string[]>;
}> = {
  basic: {
    icon: <Zap className="w-5 h-5 text-blue-500" />,
    monthlyChf: 49,
    monthlyCredits: 20,
    badge: { sq: "Bazë", en: "Basic", de: "Basic", fr: "De base" },
    features: {
      sq: [
        "20 ImmoCredits/muaj",
        "Insinjë Basic Provider",
        "Vetëm mesazhe brenda platformës",
        "Sheh vetëm qytetin e projektit",
        "Renditje normale në listë",
      ],
      en: [
        "20 ImmoCredits/month",
        "Basic Provider badge",
        "Platform messages only — no phone or email",
        "Only sees project city, no private data",
        "Normal ranking in directory",
      ],
      de: [
        "20 ImmoCredits/Monat",
        "Basic Provider Abzeichen",
        "Nur In-Plattform-Messaging — kein Telefon/E-Mail",
        "Nur Stadtangabe sichtbar, keine privaten Daten",
        "Normale Platzierung im Verzeichnis",
      ],
      fr: [
        "20 ImmoCredits/mois",
        "Badge Basic Provider",
        "Messagerie plateforme seulement — pas de téléphone/e-mail",
        "Voit seulement la ville du projet",
        "Classement normal dans l'annuaire",
      ],
    },
  },
  professional: {
    icon: <Star className="w-5 h-5 text-primary" />,
    monthlyChf: 99,
    monthlyCredits: 60,
    badge: { sq: "Profesional", en: "Professional", de: "Professional", fr: "Professionnel" },
    features: {
      sq: [
        "60 ImmoCredits/muaj",
        "Insinjë Professional Provider",
        "Deri 50 zhbllokime kontakti/muaj",
        "Sheh telefon dhe të dhëna private",
        "Renditje më e lartë se Basic",
      ],
      en: [
        "60 ImmoCredits/month",
        "Professional Provider badge",
        "Up to 50 contact unlocks per month",
        "See client phone number & private data",
        "Higher ranking than Basic in directory",
      ],
      de: [
        "60 ImmoCredits/Monat",
        "Professional Provider Abzeichen",
        "Bis zu 50 Kontakt-Unlocks/Monat",
        "Telefonnummer & private Daten sichtbar",
        "Höhere Platzierung als Basic-Anbieter",
      ],
      fr: [
        "60 ImmoCredits/mois",
        "Badge Professional Provider",
        "Jusqu'à 50 déblocages de contacts/mois",
        "Téléphone et données privées visibles",
        "Meilleur classement que les Basic",
      ],
    },
  },
  premium: {
    icon: <Crown className="w-5 h-5 text-amber-500" />,
    monthlyChf: 149,
    monthlyCredits: 150,
    badge: { sq: "Premium", en: "Premium", de: "Premium", fr: "Premium" },
    features: {
      sq: [
        "150 ImmoCredits/muaj",
        "Insinjë Premium Partner",
        "Zhbllokime të pakufizuara të kontakteve",
        "Vendi i parë në listë & profil i theksuar",
        "Njoftime prioritare për projekte të reja",
        "Klientët shohin numrin tuaj të telefonit",
      ],
      en: [
        "150 ImmoCredits/month",
        "Premium Partner badge",
        "Unlimited contact unlocks",
        "First in lists & featured profile",
        "Priority notifications for new projects",
        "Project posters can see your phone number",
      ],
      de: [
        "150 ImmoCredits/Monat",
        "Premium Partner Abzeichen",
        "Unbegrenzte Kontakt-Unlocks",
        "Erstplatzierung & hervorgehobenes Profil",
        "Prioritätsbenachrichtigungen für neue Projekte",
        "Auftraggeber sehen Ihre Telefonnummer",
      ],
      fr: [
        "150 ImmoCredits/mois",
        "Badge Premium Partner",
        "Déblocages de contacts illimités",
        "Première position & profil mis en avant",
        "Notifications prioritaires pour nouveaux projets",
        "Les clients peuvent voir votre numéro de téléphone",
      ],
    },
  },
};

const STRINGS: Record<string, {
  perMonth: string;
  credits: string;
  mostPopular: string;
  select: string;
  selected: string;
}> = {
  sq: { perMonth: "/muaj", credits: "ImmoCredits/muaj", mostPopular: "Më i zgjedhur", select: "Zgjidhni", selected: "Zgjedhur" },
  en: { perMonth: "/month", credits: "ImmoCredits/month", mostPopular: "Most popular", select: "Select", selected: "Selected" },
  de: { perMonth: "/Monat", credits: "ImmoCredits/Monat", mostPopular: "Beliebteste Wahl", select: "Wählen", selected: "Gewählt" },
  fr: { perMonth: "/mois", credits: "ImmoCredits/mois", mostPopular: "Le plus populaire", select: "Choisir", selected: "Sélectionné" },
};

export function PlanCards({ selected, onSelect }: PlanCardsProps) {
  const { language } = useLanguage();
  const s = STRINGS[language] ?? STRINGS.en;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {(["basic", "professional", "premium"] as PlanType[]).map((plan) => {
        const cfg = PLAN_CONFIG[plan];
        const isPro = plan === "professional";
        const isPremium = plan === "premium";
        const isSelected = selected === plan;
        const feats = cfg.features[language] ?? cfg.features.en;
        const badgeLabel = cfg.badge[language] ?? cfg.badge.en;

        return (
          <button
            key={plan}
            type="button"
            onClick={() => onSelect(plan)}
            className={[
              "group relative text-left rounded-2xl border-2 p-6 bg-white transition-all duration-200 hover:-translate-y-1 focus:outline-none",
              isPro
                ? "border-primary"
                : isPremium
                  ? "border-amber-300 hover:border-amber-400"
                  : "border-blue-200 hover:border-blue-300",
              isSelected ? "ring-2 ring-offset-2 shadow-xl -translate-y-1" + (isPremium ? " ring-amber-400" : " ring-primary") : "hover:shadow-lg",
            ].join(" ")}
          >
            {/* Most popular banner */}
            {isPro && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow">
                  {s.mostPopular}
                </span>
              </div>
            )}

            {/* Icon + name */}
            <div className="flex items-center gap-2 mb-2">
              {cfg.icon}
              <h3 className="text-base font-bold text-foreground">{badgeLabel}</h3>
            </div>

            {/* Badge pill */}
            <div className="mb-4">
              <span className={[
                "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                isPremium
                  ? "bg-amber-100 text-amber-700"
                  : isPro
                    ? "bg-primary/10 text-primary"
                    : "bg-blue-100 text-blue-700",
              ].join(" ")}>
                {badgeLabel}
              </span>
            </div>

            {/* Price */}
            <div className="mb-1">
              <span className="text-3xl font-bold text-foreground">CHF {cfg.monthlyChf}</span>
              <span className="text-muted-foreground text-sm">{s.perMonth}</span>
            </div>

            {/* ImmoCredits */}
            <div className={["flex items-baseline gap-1.5 mb-5", isPremium ? "text-amber-600" : "text-primary"].join(" ")}>
              <span className="text-lg font-bold">{cfg.monthlyCredits}</span>
              <span className="text-xs">{s.credits}</span>
            </div>

            {/* Features */}
            <ul className="space-y-2 text-sm mb-6">
              {feats.map((feat) => (
                <li key={feat} className="flex items-start gap-2">
                  <Check className={["w-4 h-4 mt-0.5 shrink-0", isPremium ? "text-amber-500" : "text-primary"].join(" ")} />
                  <span className="text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            {/* Select button */}
            <div className={[
              "w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all",
              isSelected
                ? isPro
                  ? "bg-primary text-white"
                  : isPremium
                    ? "bg-amber-500 text-white"
                    : "bg-primary text-white"
                : isPro
                  ? "bg-primary text-white"
                  : "border border-current text-primary",
              !isSelected && isPremium ? "border-amber-400 text-amber-600" : "",
            ].join(" ")}>
              {isSelected ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {s.selected}
                </span>
              ) : (
                s.select
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

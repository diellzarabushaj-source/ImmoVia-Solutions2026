import { Star, Zap, Crown, Check, CheckCircle2, Info } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export type PlanType = "basic" | "professional" | "premium";

interface PlanCardsProps {
  selected: PlanType | null;
  onSelect: (plan: PlanType) => void;
  showSetupFee?: boolean;
}

export const PLAN_CONFIG: Record<PlanType, {
  icon: React.ReactNode;
  monthlyChf: number;
  badge: Record<string, string>;
  features: Record<string, string[]>;
}> = {
  basic: {
    icon: <Zap className="w-5 h-5 text-blue-500" />,
    monthlyChf: 49,
    badge: { sq: "Bazë", en: "Basic", de: "Basic", fr: "De base" },
    features: {
      sq: [
        "20 aplikime/muaj",
        "20 zhbllokime kontakti/muaj",
        "Insinjë Basic Provider",
        "Mesazhe brenda platformës",
        "Sheh vetëm qytetin e projektit",
      ],
      en: [
        "20 applications/month",
        "20 contact unlocks/month",
        "Basic Provider badge",
        "Platform messaging",
        "Sees project city only",
      ],
      de: [
        "20 Bewerbungen/Monat",
        "20 Kontakt-Unlocks/Monat",
        "Basic Provider Abzeichen",
        "Plattform-Messaging",
        "Nur Stadtangabe sichtbar",
      ],
      fr: [
        "20 candidatures/mois",
        "20 déblocages de contacts/mois",
        "Badge Basic Provider",
        "Messagerie plateforme",
        "Voit seulement la ville",
      ],
    },
  },
  professional: {
    icon: <Star className="w-5 h-5 text-primary" />,
    monthlyChf: 99,
    badge: { sq: "Profesional", en: "Professional", de: "Professional", fr: "Professionnel" },
    features: {
      sq: [
        "50 aplikime/muaj",
        "50 zhbllokime kontakti/muaj",
        "Insinjë Professional Provider",
        "Sheh telefon dhe të dhëna private",
        "Renditje më e lartë se Basic",
      ],
      en: [
        "50 applications/month",
        "50 contact unlocks/month",
        "Professional Provider badge",
        "See client phone & private data",
        "Higher ranking than Basic",
      ],
      de: [
        "50 Bewerbungen/Monat",
        "50 Kontakt-Unlocks/Monat",
        "Professional Provider Abzeichen",
        "Telefonnummer & private Daten",
        "Höhere Platzierung als Basic",
      ],
      fr: [
        "50 candidatures/mois",
        "50 déblocages de contacts/mois",
        "Badge Professional Provider",
        "Téléphone & données privées",
        "Meilleur classement que Basic",
      ],
    },
  },
  premium: {
    icon: <Crown className="w-5 h-5 text-amber-500" />,
    monthlyChf: 149,
    badge: { sq: "Premium", en: "Premium", de: "Premium", fr: "Premium" },
    features: {
      sq: [
        "Aplikime të pakufizuara",
        "Zhbllokime të pakufizuara",
        "Insinjë Premium Partner",
        "Vendi i parë në listë & profil i theksuar",
        "Njoftime prioritare — projekte të reja",
      ],
      en: [
        "Unlimited applications",
        "Unlimited contact unlocks",
        "Premium Partner badge",
        "First in lists & featured profile",
        "Priority notifications for new projects",
      ],
      de: [
        "Unbegrenzte Bewerbungen",
        "Unbegrenzte Kontakt-Unlocks",
        "Premium Partner Abzeichen",
        "Erstplatzierung & hervorgehobenes Profil",
        "Prioritätsbenachrichtigungen",
      ],
      fr: [
        "Candidatures illimitées",
        "Déblocages illimités",
        "Badge Premium Partner",
        "Première position & profil mis en avant",
        "Notifications prioritaires",
      ],
    },
  },
};

const STRINGS: Record<string, {
  perMonth: string;
  mostPopular: string;
  select: string;
  selected: string;
  setupFee: string;
  setupFeeNote: string;
  totalFirst: string;
}> = {
  sq: {
    perMonth: "/muaj",
    mostPopular: "Më i zgjedhur",
    select: "Zgjidhni",
    selected: "Zgjedhur",
    setupFee: "+ CHF 149 tarifë njëherë",
    setupFeeNote: "Tarifa e konfigurimit paguhet vetëm njëherë.",
    totalFirst: "Totali i parë",
  },
  en: {
    perMonth: "/month",
    mostPopular: "Most popular",
    select: "Select",
    selected: "Selected",
    setupFee: "+ CHF 149 one-time setup fee",
    setupFeeNote: "Setup fee is charged once at registration.",
    totalFirst: "First payment",
  },
  de: {
    perMonth: "/Monat",
    mostPopular: "Beliebteste Wahl",
    select: "Wählen",
    selected: "Gewählt",
    setupFee: "+ CHF 149 einmalige Einrichtungsgebühr",
    setupFeeNote: "Die Einrichtungsgebühr wird einmalig bei der Registrierung berechnet.",
    totalFirst: "Erste Zahlung",
  },
  fr: {
    perMonth: "/mois",
    mostPopular: "Le plus populaire",
    select: "Choisir",
    selected: "Sélectionné",
    setupFee: "+ CHF 149 frais d'activation uniques",
    setupFeeNote: "Les frais d'activation sont facturés une seule fois à l'inscription.",
    totalFirst: "Premier paiement",
  },
};

export function PlanCards({ selected, onSelect, showSetupFee = true }: PlanCardsProps) {
  const { language } = useLanguage();
  const s = STRINGS[language] ?? STRINGS.en;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(["basic", "professional", "premium"] as PlanType[]).map((plan) => {
          const cfg = PLAN_CONFIG[plan];
          const isPro = plan === "professional";
          const isPremium = plan === "premium";
          const isSelected = selected === plan;
          const feats = cfg.features[language] ?? cfg.features.en;
          const badgeLabel = cfg.badge[language] ?? cfg.badge.en;
          const firstTotal = cfg.monthlyChf + 149;

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
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow">
                    {s.mostPopular}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                {cfg.icon}
                <h3 className="text-base font-bold text-foreground">{badgeLabel}</h3>
              </div>

              <div className="mb-3">
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

              {/* Monthly price */}
              <div className="mb-1">
                <span className="text-3xl font-bold text-foreground">CHF {cfg.monthlyChf}</span>
                <span className="text-muted-foreground text-sm">{s.perMonth}</span>
              </div>

              {/* Setup fee line — clearly visible */}
              {showSetupFee && (
                <div className="mb-4 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200/70">
                  <div className="text-xs font-semibold text-amber-800">
                    {s.setupFee}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {s.totalFirst}: <span className="font-bold">CHF {firstTotal}</span>
                  </div>
                </div>
              )}

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
                  ? isPremium ? "bg-amber-500 text-white" : "bg-primary text-white"
                  : isPro
                    ? "bg-primary text-white"
                    : isPremium
                      ? "border border-amber-400 text-amber-600"
                      : "border border-primary text-primary",
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

      {/* Global setup fee explanation */}
      {showSetupFee && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span>{s.setupFeeNote}</span>
        </div>
      )}
    </div>
  );
}

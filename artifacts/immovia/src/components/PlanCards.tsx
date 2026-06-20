import { Star, Zap, Crown, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export type PlanType = "basic" | "professional" | "premium";

interface PlanCardsProps {
  selected: PlanType | null;
  onSelect: (plan: PlanType) => void;
}

export const PLAN_CONFIG: Record<PlanType, {
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
  cardBorder: string;
  accentColor: string;
  monthlyChf: number;
  badge: Record<string, string>;
  features: Record<string, string[]>;
}> = {
  basic: {
    icon: <Star className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />,
    iconBg: "bg-blue-50 group-hover:bg-blue-100",
    cardBg: "bg-white",
    cardBorder: "border-border group-hover:border-blue-300",
    accentColor: "text-blue-600",
    monthlyChf: 49,
    badge: { sq: "Fillestare", en: "Starter", de: "Starter", fr: "Débutant" },
    features: {
      sq: ["Listim standard në drejtori", "Faqe profili bazike", "Mbështetje me email"],
      en: ["Standard directory listing", "Basic profile page", "Email support"],
      de: ["Standard-Verzeichniseintrag", "Basis-Profilseite", "E-Mail-Support"],
      fr: ["Annuaire standard", "Page de profil de base", "Support par email"],
    },
  },
  professional: {
    icon: <Zap className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />,
    iconBg: "bg-white/20",
    cardBg: "bg-gradient-to-br from-[#1a3a6e] to-[#2563eb]",
    cardBorder: "border-primary",
    accentColor: "text-blue-200",
    monthlyChf: 99,
    badge: { sq: "Rekomanduar", en: "Recommended", de: "Empfohlen", fr: "Recommandé" },
    features: {
      sq: ["Gjithçka nga Basic", "Listim me përparësi", "Insignë e verifikuar", "Galeri portofoli"],
      en: ["Everything in Basic", "Priority listing", "Verified badge", "Portfolio gallery"],
      de: ["Alles aus Basic", "Priorisiertes Listing", "Verifiziert-Badge", "Portfolio-Galerie"],
      fr: ["Tout de Basic", "Annonce prioritaire", "Badge vérifié", "Galerie portfolio"],
    },
  },
  premium: {
    icon: <Crown className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />,
    iconBg: "bg-amber-400/20",
    cardBg: "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100",
    cardBorder: "border-amber-300 group-hover:border-amber-500",
    accentColor: "text-amber-700",
    monthlyChf: 149,
    badge: { sq: "Plotë", en: "Complete", de: "Komplett", fr: "Complet" },
    features: {
      sq: ["Gjithçka nga Professional", "Paraqitje kryesore", "Vendosje në krye", "Panel analitik"],
      en: ["Everything in Professional", "Home page feature", "Top search placement", "Analytics panel"],
      de: ["Alles aus Professional", "Homepage-Feature", "Top-Platzierung", "Analyse-Panel"],
      fr: ["Tout de Professional", "Mise en avant accueil", "Position en tête", "Tableau analytique"],
    },
  },
};

const STRINGS: Record<string, { perMonth: string; regFee: string; selected: string }> = {
  sq: { perMonth: "/ muaj", regFee: "Tarifë regjistrimi njëherë: CHF 149", selected: "Zgjedhur" },
  en: { perMonth: "/ mo",   regFee: "One-time registration fee: CHF 149",  selected: "Selected" },
  de: { perMonth: "/ Monat",regFee: "Einmalige Registrierungsgebühr: CHF 149", selected: "Gewählt" },
  fr: { perMonth: "/ mois", regFee: "Frais d'inscription uniques\u00a0: CHF 149", selected: "Sélectionné" },
};

export function PlanCards({ selected, onSelect }: PlanCardsProps) {
  const { language } = useLanguage();
  const s = STRINGS[language] ?? STRINGS.en;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {(["basic", "professional", "premium"] as PlanType[]).map((plan) => {
        const cfg = PLAN_CONFIG[plan];
        const isPro = plan === "professional";
        const isSelected = selected === plan;
        const feats = cfg.features[language] ?? cfg.features.en;
        const badgeLabel = cfg.badge[language] ?? cfg.badge.en;

        return (
          <button
            key={plan}
            type="button"
            onClick={() => onSelect(plan)}
            className={`group relative text-left rounded-2xl border-2 p-6 transition-all duration-200 hover:-translate-y-1 ${cfg.cardBg} ${cfg.cardBorder} ${
              isSelected ? "ring-2 ring-primary ring-offset-2 shadow-xl -translate-y-1" : "hover:shadow-lg"
            }`}
          >
            {/* Badge */}
            {isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow">
                  {badgeLabel}
                </span>
              </div>
            )}
            {!isPro && (
              <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                plan === "premium" ? "bg-amber-200 text-amber-800" : "bg-blue-100 text-blue-700"
              }`}>
                {badgeLabel}
              </div>
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${cfg.iconBg}`}>
              {cfg.icon}
            </div>

            {/* Plan label */}
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${isPro ? "text-blue-200" : cfg.accentColor}`}>
              {plan.toUpperCase()}
            </div>

            {/* Price */}
            <div className={`text-3xl font-bold mb-4 ${isPro ? "text-white" : "text-foreground"}`}>
              CHF {cfg.monthlyChf}
              <span className={`text-sm font-normal ml-1 ${isPro ? "text-blue-200" : "text-muted-foreground"}`}>
                {s.perMonth}
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              {feats.map((feat) => (
                <li key={feat} className="flex items-start gap-2">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isPro ? "text-blue-300" : "text-green-500"}`} />
                  <span className={`text-sm ${isPro ? "text-blue-100" : "text-foreground"}`}>{feat}</span>
                </li>
              ))}
            </ul>

            {/* Registration fee note */}
            <div className={`text-xs ${isPro ? "text-blue-200/70" : "text-muted-foreground"}`}>
              + {s.regFee}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${isPro ? "text-white" : "text-primary"}`}>
                <CheckCircle2 className="w-4 h-4" />
                {s.selected}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

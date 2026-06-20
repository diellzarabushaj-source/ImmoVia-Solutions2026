import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import {
  billingApi,
  type SubscriptionPlan,
} from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Shield, Zap, Star, Award, BadgeCheck } from "lucide-react";

function formatCHF(cents: number): string {
  if (cents === 0) return "CHF 0";
  return `CHF ${(cents / 100).toFixed(0)}`;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Shield className="w-5 h-5 text-slate-400" />,
  basic: <Zap className="w-5 h-5 text-blue-500" />,
  pro: <Star className="w-5 h-5 text-primary" />,
  premium: <Award className="w-5 h-5 text-amber-500" />,
};

const PLAN_ACCENT: Record<string, string> = {
  free: "border-border bg-white",
  basic: "border-blue-200 bg-white",
  pro: "border-primary/40 border-2 shadow-xl bg-white",
  premium: "border-amber-300 border-2 bg-white",
};

const PLAN_BADGE_COLOR: Record<string, string> = {
  basic: "bg-blue-100 text-blue-700",
  pro: "bg-primary/10 text-primary",
  premium: "bg-amber-100 text-amber-700",
};

const CREDITS_LABEL: Record<string, string> = {
  de: "ImmoCredits/Monat",
  en: "ImmoCredits/month",
  sq: "ImmoCredits/muaj",
  fr: "ImmoCredits/mois",
};

const REDIRECTING_LABEL: Record<string, string> = {
  de: "Weiterleitung zur Kasse…",
  en: "Redirecting to checkout…",
  sq: "Po ridrejtoheni te arka…",
  fr: "Redirection vers le paiement…",
};

const UNLIMITED_LABEL: Record<string, string> = {
  de: "Unbegrenzt",
  en: "Unlimited",
  sq: "Pa limit",
  fr: "Illimité",
};

const CANCELLED_NOTICE: Record<string, string> = {
  de: "Zahlung abgebrochen. Es wurde nichts belastet.",
  en: "Payment cancelled. You were not charged.",
  sq: "Pagesa u anulua. Nuk u tarifua asgjë.",
  fr: "Paiement annulé. Vous n'avez pas été débité.",
};

const PER_MONTH_LABEL: Record<string, string> = {
  de: "/Monat",
  en: "/month",
  sq: "/muaj",
  fr: "/mois",
};

const SUBSCRIBE_CTA: Record<string, string> = {
  de: "Jetzt abonnieren",
  en: "Subscribe now",
  sq: "Abonohu tani",
  fr: "S'abonner",
};

const MOST_POPULAR: Record<string, string> = {
  de: "Beliebteste Wahl",
  en: "Most popular",
  sq: "Më i zgjedhur",
  fr: "Le plus populaire",
};

export default function Pricing() {
  const { t, language } = useLanguage();
  usePageMeta({
    title: "Preise & Pakete für Dienstleister | ImmoVia365",
    description: "Wählen Sie das passende Abo für Ihr Handwerker- oder Dienstleistungsunternehmen. Zugang zu Renovierungsanfragen in der ganzen Schweiz — monatlich kündbar.",
  });
  useStructuredData([
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Für wen sind die ImmoVia365-Pakete gedacht?", "acceptedAnswer": { "@type": "Answer", "text": "Die Pakete sind für Handwerker, Baufirmen, Reinigungsunternehmen und andere Dienstleister gedacht, die Renovierungsanfragen aus der Schweiz erhalten möchten." } },
        { "@type": "Question", "name": "Kann ich das Abo jederzeit kündigen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja, alle Abonnements sind monatlich kündbar. Nach der Kündigung läuft der Zugang bis zum Ende des bezahlten Zeitraums weiter." } },
        { "@type": "Question", "name": "Was sind ImmoCredits?", "acceptedAnswer": { "@type": "Answer", "text": "ImmoCredits sind Punkte, mit denen Dienstleister Kontaktdaten von Auftraggebern freischalten können. Je nach Paket erhalten Sie monatlich unterschiedliche Mengen an ImmoCredits." } }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Preise", "item": `${APP_URL}/pricing` }
      ]
    }
  ]);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    void billingApi.plans().then(setPlans).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") setCancelled(true);
  }, []);

  const isProvider = isServiceProvider(user);

  const handlePlanCta = async (plan: SubscriptionPlan) => {
    // Guard against double-clicks while any checkout is already loading.
    if (loading !== null) return;
    setError(null);

    if (!user) {
      setLocation("/signup");
      return;
    }
    if (!isProvider) {
      setError(t.pricing.errorClient);
      return;
    }

    // Paid plan — redirect to Stripe Checkout
    setLoading(plan.id);
    try {
      const { url } = await billingApi.stripeCheckout(plan.id);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(null);
    }
  };

  const creditsLabel = CREDITS_LABEL[language] ?? CREDITS_LABEL.de;
  const unlimitedLabel = UNLIMITED_LABEL[language] ?? UNLIMITED_LABEL.de;
  const perMonth = PER_MONTH_LABEL[language] ?? PER_MONTH_LABEL.de;
  const subscribeCta = SUBSCRIBE_CTA[language] ?? SUBSCRIBE_CTA.de;
  const redirectingLabel = REDIRECTING_LABEL[language] ?? REDIRECTING_LABEL.de;
  const mostPopular = MOST_POPULAR[language] ?? MOST_POPULAR.de;

  const displayedPlans = plans.filter(p => ["basic", "pro", "premium"].includes(p.slug));

  function displayPrice(plan: SubscriptionPlan): string {
    if (plan.priceCents === 0) return "CHF 0";
    return formatCHF(plan.priceCents);
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      {cancelled && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm" data-testid="pricing-cancelled">
          {CANCELLED_NOTICE[language] ?? CANCELLED_NOTICE.de}
        </div>
      )}

      {error && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm" data-testid="pricing-error">
          {error}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {displayedPlans.map((plan) => {
          const isCurrentlyLoading = loading === plan.id;
          const isPremium = plan.slug === "premium";

          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col relative cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl hover:border-primary ${isCurrentlyLoading ? "opacity-70" : ""} ${PLAN_ACCENT[plan.slug] ?? "border-border"}`}
              onClick={() => void handlePlanCta(plan)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void handlePlanCta(plan); } }}
              aria-busy={isCurrentlyLoading}
              data-testid={`plan-${plan.slug}`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {mostPopular}
                </span>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-2 mb-2">
                {PLAN_ICONS[plan.slug]}
                <h3 className="text-base font-bold">{plan.name}</h3>
              </div>

              {plan.badge && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE_COLOR[plan.slug] ?? "bg-muted"}`}>
                    <BadgeCheck className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-1">
                <span className="text-3xl font-bold">{displayPrice(plan)}</span>
                <span className="text-muted-foreground text-sm">{perMonth}</span>
              </div>


              {/* Features */}
              <ul className="space-y-2 text-sm mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.featured ? "default" : "outline"}
                onClick={(e) => { e.stopPropagation(); void handlePlanCta(plan); }}
                disabled={loading !== null}
                data-testid={`button-plan-${plan.slug}`}
              >
                {isCurrentlyLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isCurrentlyLoading ? redirectingLabel : subscribeCta}
              </Button>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

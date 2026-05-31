import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
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

function formatCHFDecimal(cents: number): string {
  if (cents === 0) return "CHF 0";
  return `CHF ${(cents / 100 / 12).toFixed(0)}`;
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

const YEARLY_DISCOUNT = 20;

const CREDITS_LABEL: Record<string, string> = {
  de: "Credits/Monat",
  en: "credits/month",
  sq: "kredite/muaj",
  fr: "crédits/mois",
};

const UNLIMITED_LABEL: Record<string, string> = {
  de: "Unbegrenzt",
  en: "Unlimited",
  sq: "Pa limit",
  fr: "Illimité",
};

const MONTHLY_LABEL: Record<string, string> = {
  de: "Monatlich",
  en: "Monthly",
  sq: "Mujore",
  fr: "Mensuel",
};

const YEARLY_LABEL: Record<string, string> = {
  de: "Jährlich",
  en: "Yearly",
  sq: "Vjetore",
  fr: "Annuel",
};

const SAVE_LABEL: Record<string, string> = {
  de: "Spare 20%",
  en: "Save 20%",
  sq: "Kursej 20%",
  fr: "Économisez 20%",
};

const PER_MONTH_LABEL: Record<string, string> = {
  de: "/Monat",
  en: "/month",
  sq: "/muaj",
  fr: "/mois",
};

const FREE_CTA: Record<string, string> = {
  de: "Kostenlos starten",
  en: "Get started free",
  sq: "Fillo falas",
  fr: "Commencer gratuitement",
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
  usePageMeta({ title: `${t.pricing.title} — ImmoVia`, description: t.pricing.subtitle ?? undefined });
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [interval, setIntervalMode] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void billingApi.plans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const isProvider = isServiceProvider(user);

  const handlePlanCta = async (plan: SubscriptionPlan) => {
    setError(null);

    if (!user) {
      setLocation("/signup");
      return;
    }
    if (!isProvider) {
      setError(t.pricing.errorClient);
      return;
    }

    // Free plan — no checkout needed
    if (plan.slug === "free") {
      setLocation("/provider/billing");
      return;
    }

    // Paid plan — redirect to Stripe Checkout
    setLoading(plan.id);
    try {
      const { url } = await billingApi.stripeCheckout(plan.id, interval);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(null);
    }
  };

  const creditsLabel = CREDITS_LABEL[language] ?? CREDITS_LABEL.de;
  const unlimitedLabel = UNLIMITED_LABEL[language] ?? UNLIMITED_LABEL.de;
  const monthlyLabel = MONTHLY_LABEL[language] ?? MONTHLY_LABEL.de;
  const yearlyLabel = YEARLY_LABEL[language] ?? YEARLY_LABEL.de;
  const saveLabel = SAVE_LABEL[language] ?? SAVE_LABEL.de;
  const perMonth = PER_MONTH_LABEL[language] ?? PER_MONTH_LABEL.de;
  const freeCta = FREE_CTA[language] ?? FREE_CTA.de;
  const subscribeCta = SUBSCRIBE_CTA[language] ?? SUBSCRIBE_CTA.de;
  const mostPopular = MOST_POPULAR[language] ?? MOST_POPULAR.de;

  const displayedPlans = plans.filter(p => ["free", "basic", "pro", "premium"].includes(p.slug));

  function displayPrice(plan: SubscriptionPlan): string {
    if (plan.priceCents === 0) return "CHF 0";
    if (interval === "year") return formatCHFDecimal(plan.yearlyPriceCents);
    return formatCHF(plan.priceCents);
  }

  function displayBilledAs(plan: SubscriptionPlan): string | null {
    if (plan.priceCents === 0 || interval === "month") return null;
    return formatCHF(plan.yearlyPriceCents);
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4" data-testid="heading-pricing">
          {t.pricing.title}
        </h1>
        <p className="text-muted-foreground text-lg">{t.pricing.subtitle}</p>
      </div>

      {/* Monthly / Yearly toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${interval === "month" ? "text-foreground" : "text-muted-foreground"}`}>
          {monthlyLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={interval === "year"}
          onClick={() => setIntervalMode(i => i === "month" ? "year" : "month")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${interval === "year" ? "bg-primary" : "bg-muted-foreground/30"}`}
          data-testid="toggle-interval"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${interval === "year" ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
        <span className={`text-sm font-medium flex items-center gap-1.5 ${interval === "year" ? "text-foreground" : "text-muted-foreground"}`}>
          {yearlyLabel}
          <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
            -{YEARLY_DISCOUNT}%
          </span>
        </span>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm" data-testid="pricing-error">
          {error}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {displayedPlans.map((plan) => {
          const isCurrentlyLoading = loading === plan.id;
          const isFree = plan.slug === "free";
          const billedAs = displayBilledAs(plan);
          const creditsDisplay = plan.monthlyCredits === -1 ? unlimitedLabel : String(plan.monthlyCredits);

          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col relative ${PLAN_ACCENT[plan.slug] ?? "border-border"}`}
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

              {billedAs && (
                <div className="text-xs text-muted-foreground mb-1">
                  {language === "de" ? `${billedAs} jährlich abgerechnet` :
                   language === "fr" ? `${billedAs} facturé annuellement` :
                   language === "sq" ? `${billedAs} faturim vjetor` :
                   `${billedAs} billed annually`}
                </div>
              )}

              {/* Credits */}
              <div className="flex items-baseline gap-1.5 mb-5 mt-1">
                <span className="text-lg font-bold text-primary">{creditsDisplay}</span>
                <span className="text-xs text-muted-foreground">{creditsLabel}</span>
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

              {/* Yearly savings callout */}
              {!isFree && interval === "year" && (
                <div className="text-xs font-medium text-green-700 bg-green-50 rounded px-2 py-1 mb-3 text-center">
                  {saveLabel}
                </div>
              )}

              <Button
                className="w-full"
                variant={plan.featured ? "default" : isFree ? "ghost" : "outline"}
                onClick={() => void handlePlanCta(plan)}
                disabled={isCurrentlyLoading}
                data-testid={`button-plan-${plan.slug}`}
              >
                {isCurrentlyLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isFree ? freeCta : subscribeCta}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Yearly total note */}
      {interval === "year" && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          {language === "de" ? "Jährliche Zahlung • Preise in CHF" :
           language === "fr" ? "Paiement annuel • Prix en CHF" :
           language === "sq" ? "Pagesë vjetore • Çmime në CHF" :
           "Annual payment • Prices in CHF"}
        </p>
      )}
    </div>
  );
}

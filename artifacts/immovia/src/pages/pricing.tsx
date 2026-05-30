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
import { Check, Loader2, Sparkles, Zap, Shield, Star, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatCHF(cents: number): string {
  if (cents === 0) return "CHF 0";
  return `CHF ${(cents / 100).toFixed(0)}`;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Shield className="w-5 h-5 text-muted-foreground" />,
  starter: <Zap className="w-5 h-5 text-blue-600" />,
  professional: <Star className="w-5 h-5 text-primary" />,
  premium: <Award className="w-5 h-5 text-amber-600" />,
  founding: <Sparkles className="w-5 h-5 text-violet-600" />,
};

const PLAN_ACCENT: Record<string, string> = {
  free: "border-border",
  starter: "border-blue-200",
  professional: "border-primary border-2 shadow-xl",
  premium: "border-amber-300 border-2",
  founding: "border-violet-300 border-2",
};

const PLAN_APP_LABELS: Record<string, string> = {
  de: "Bewerbungen / Monat",
  en: "applications / month",
  sq: "aplikime / muaj",
  fr: "candidatures / mois",
};

export default function Pricing() {
  const { t, language } = useLanguage();
  usePageMeta({ title: `${t.pricing.title} — ImmoVia`, description: t.pricing.subtitle ?? undefined });
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void billingApi.plans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const isProvider = isServiceProvider(user);

  const handlePlanCta = (plan: SubscriptionPlan) => {
    setError(null);
    if (!user) {
      setLocation("/signup");
      return;
    }
    if (!isProvider) {
      setError(t.pricing.errorClient);
      return;
    }
    setConfirmPlan(plan);
  };

  const confirmPlanSubscribe = async () => {
    if (!confirmPlan) return;
    setSubmitting(true);
    setError(null);
    try {
      await billingApi.subscribe(confirmPlan.id);
      await refresh();
      setSuccess(t.pricing.successPlan.replace("{name}", confirmPlan.name));
      setConfirmPlan(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const appLabel = PLAN_APP_LABELS[language] ?? PLAN_APP_LABELS.de;

  const mainPlans = plans.filter(p => p.slug !== "founding");
  const foundingPlan = plans.find(p => p.slug === "founding");

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4" data-testid="heading-pricing">
          {t.pricing.title}
        </h1>
        <p className="text-muted-foreground text-lg">{t.pricing.subtitle}</p>
      </div>

      {success && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm" data-testid="pricing-success">
          {success}
        </div>
      )}
      {error && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm" data-testid="pricing-error">
          {error}
        </div>
      )}

      {/* Main plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-10">
        {mainPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`p-6 flex flex-col relative ${PLAN_ACCENT[plan.slug] ?? "border-border"}`}
            data-testid={`plan-${plan.slug}`}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="w-3 h-3" />
                {t.pricing.mostPopular}
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              {PLAN_ICONS[plan.slug]}
              <h3 className="text-lg font-bold">{plan.name}</h3>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold">{formatCHF(plan.priceCents)}</span>
              <span className="text-muted-foreground text-sm">/{t.pricing.month}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-5">
              <span className="text-lg font-bold">{plan.monthlyCredits}</span>
              <span className="text-muted-foreground font-normal">{appLabel}</span>
            </div>
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
              onClick={() => handlePlanCta(plan)}
              data-testid={`button-plan-${plan.slug}`}
            >
              {plan.priceCents === 0 ? t.pricing.ctaGetStarted : t.pricing.ctaSubscribe}
            </Button>
          </Card>
        ))}
      </div>

      {/* Founding offer banner */}
      {foundingPlan && (
        <div className="max-w-6xl mx-auto">
          <Card className={`p-6 ${PLAN_ACCENT.founding} bg-gradient-to-r from-violet-50/60 to-white`} data-testid={`plan-${foundingPlan.slug}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-2.5 rounded-xl bg-violet-100">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-0.5">
                    {language === "de" ? "Startangebot" : language === "fr" ? "Offre de lancement" : language === "sq" ? "Ofertë lansimi" : "Founding offer"}
                  </div>
                  <h3 className="text-xl font-bold">{foundingPlan.name}</h3>
                </div>
              </div>
              <div className="flex-1">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {foundingPlan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                <div>
                  <span className="text-3xl font-bold">{formatCHF(foundingPlan.priceCents)}</span>
                  <span className="text-muted-foreground text-sm">/{t.pricing.month}</span>
                </div>
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white w-full md:w-auto"
                  onClick={() => handlePlanCta(foundingPlan)}
                  data-testid={`button-plan-${foundingPlan.slug}`}
                >
                  {t.pricing.ctaSubscribe}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={!!confirmPlan} onOpenChange={(o) => !o && setConfirmPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.pricing.confirmPlanTitle}</DialogTitle>
            <DialogDescription>
              {confirmPlan
                ? t.pricing.confirmPlanDesc
                    .replace("{name}", confirmPlan.name)
                    .replace("{price}", formatCHF(confirmPlan.priceCents))
                    .replace("{credits}", String(confirmPlan.monthlyCredits))
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPlan(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button onClick={confirmPlanSubscribe} disabled={submitting} data-testid="button-confirm-plan">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.pricing.confirmCheckout}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

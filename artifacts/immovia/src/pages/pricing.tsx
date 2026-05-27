import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  billingApi,
  type SubscriptionPlan,
  type ImmocreditPack,
} from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Coins, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatEUR(cents: number): string {
  if (cents === 0) return "€0";
  return `€${(cents / 100).toFixed(0)}`;
}

export default function Pricing() {
  const { t } = useLanguage();
  usePageMeta({ title: `${t.pricing.title} — ImmoVia`, description: t.pricing.subtitle ?? undefined });
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [packs, setPacks] = useState<ImmocreditPack[]>([]);
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmPack, setConfirmPack] = useState<ImmocreditPack | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void billingApi.plans().then(setPlans).catch(() => setPlans([]));
    void billingApi.packs().then(setPacks).catch(() => setPacks([]));
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

  const handlePackCta = (pack: ImmocreditPack) => {
    setError(null);
    if (!user) {
      setLocation("/signup");
      return;
    }
    if (!isProvider) {
      setError(t.pricing.errorClient);
      return;
    }
    setConfirmPack(pack);
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

  const confirmPackBuy = async () => {
    if (!confirmPack) return;
    setSubmitting(true);
    setError(null);
    try {
      await billingApi.buyPack(confirmPack.id);
      await refresh();
      setSuccess(
        t.pricing.successPack
          .replace("{credits}", String(confirmPack.credits))
          .replace("{name}", confirmPack.name),
      );
      setConfirmPack(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto text-center mb-10">
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

      <Tabs defaultValue="plans" className="w-full max-w-6xl mx-auto">
        <TabsList className="mx-auto grid grid-cols-2 w-full max-w-md mb-8">
          <TabsTrigger value="plans" data-testid="tab-plans">{t.pricing.tabPlans}</TabsTrigger>
          <TabsTrigger value="packs" data-testid="tab-packs">{t.pricing.tabPacks}</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{t.pricing.plansDesc}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col relative ${plan.featured ? "border-primary border-2 shadow-xl" : ""}`}
                data-testid={`plan-${plan.slug}`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t.pricing.mostPopular}
                  </span>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{formatEUR(plan.priceCents)}</span>
                  <span className="text-muted-foreground text-sm">/{t.pricing.month}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-4">
                  <Coins className="w-4 h-4" />
                  {plan.monthlyCredits} {t.pricing.creditsPerMonth}
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
        </TabsContent>

        <TabsContent value="packs">
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{t.pricing.packsDesc}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {packs.map((pack) => (
              <Card key={pack.id} className="p-6 flex flex-col" data-testid={`pack-${pack.slug}`}>
                <h3 className="text-lg font-bold mb-1">{pack.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{formatEUR(pack.priceCents)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-6">
                  <Coins className="w-4 h-4" />
                  {pack.credits} ImmoCredits
                </div>
                <p className="text-xs text-muted-foreground mb-6">{t.pricing.expires12Months}</p>
                <Button className="w-full mt-auto" onClick={() => handlePackCta(pack)} data-testid={`button-pack-${pack.slug}`}>
                  {t.pricing.ctaBuy}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!confirmPlan} onOpenChange={(o) => !o && setConfirmPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.pricing.confirmPlanTitle}</DialogTitle>
            <DialogDescription>
              {confirmPlan
                ? t.pricing.confirmPlanDesc
                    .replace("{name}", confirmPlan.name)
                    .replace("{price}", formatEUR(confirmPlan.priceCents))
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

      <Dialog open={!!confirmPack} onOpenChange={(o) => !o && setConfirmPack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.pricing.confirmPackTitle}</DialogTitle>
            <DialogDescription>
              {confirmPack
                ? t.pricing.confirmPackDesc
                    .replace("{name}", confirmPack.name)
                    .replace("{price}", formatEUR(confirmPack.priceCents))
                    .replace("{credits}", String(confirmPack.credits))
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPack(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button onClick={confirmPackBuy} disabled={submitting} data-testid="button-confirm-pack">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.pricing.confirmCheckout}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

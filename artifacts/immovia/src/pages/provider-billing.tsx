import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { billingApi, type SubscriptionPlan, type AppStats } from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, CreditCard, ExternalLink, Shield, Zap, Star, Award } from "lucide-react";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Shield className="w-4 h-4 text-slate-400" />,
  basic: <Zap className="w-4 h-4 text-blue-500" />,
  pro: <Star className="w-4 h-4 text-primary" />,
  premium: <Award className="w-4 h-4 text-amber-500" />,
};

const LABELS: Record<string, Record<string, string>> = {
  de: {
    title: "Abonnement & Billing",
    subtitle: "Verwalten Sie Ihr Abonnement und Ihre Zahlungen.",
    currentPlan: "Aktueller Plan",
    manageSub: "Abonnement verwalten",
    upgradePlan: "Plan upgraden",
    syncing: "Abonnement wird synchronisiert…",
    syncSuccess: "Abonnement erfolgreich aktiviert!",
    syncFailed: "Synchronisierung fehlgeschlagen.",
    noProvider: "Kein Provider-Zugang",
    offersLeft: "Verbleibende Angebote",
    unlimited: "Unbegrenzt",
    period: "Abrechnungszeitraum",
    contactVisible: "Kontaktdaten sichtbar",
    contactHidden: "Kontaktdaten nicht sichtbar",
    loading: "Lade…",
    portalLoading: "Weiterleitung zu Stripe…",
    noPlan: "Kein aktives Abonnement",
    freePlan: "Sie nutzen den kostenlosen Plan.",
    seePlans: "Preise ansehen",
  },
  en: {
    title: "Subscription & Billing",
    subtitle: "Manage your subscription and payments.",
    currentPlan: "Current Plan",
    manageSub: "Manage Subscription",
    upgradePlan: "Upgrade Plan",
    syncing: "Syncing subscription…",
    syncSuccess: "Subscription activated successfully!",
    syncFailed: "Sync failed.",
    noProvider: "No provider access",
    offersLeft: "Offers remaining",
    unlimited: "Unlimited",
    period: "Billing period",
    contactVisible: "Contact details visible",
    contactHidden: "Contact details hidden",
    loading: "Loading…",
    portalLoading: "Redirecting to Stripe…",
    noPlan: "No active subscription",
    freePlan: "You are on the free plan.",
    seePlans: "View plans",
  },
  sq: {
    title: "Abonime & Faturim",
    subtitle: "Menaxhoni abonimin dhe pagesat tuaja.",
    currentPlan: "Plani Aktual",
    manageSub: "Menaxho Abonimin",
    upgradePlan: "Ngriti Planin",
    syncing: "Po sinkronizohet abonimit…",
    syncSuccess: "Abonimi u aktivizua me sukses!",
    syncFailed: "Sinkronizimi dështoi.",
    noProvider: "Nuk ka qasje si ofruese",
    offersLeft: "Oferta të mbetura",
    unlimited: "Pa limit",
    period: "Periudha e faturimit",
    contactVisible: "Kontaktet të dukshme",
    contactHidden: "Kontaktet të fshehura",
    loading: "Duke ngarkuar…",
    portalLoading: "Po ridrejtoheni te Stripe…",
    noPlan: "Asnjë abonim aktiv",
    freePlan: "Jeni në planin falas.",
    seePlans: "Shiko planet",
  },
  fr: {
    title: "Abonnement & Facturation",
    subtitle: "Gérez votre abonnement et vos paiements.",
    currentPlan: "Plan Actuel",
    manageSub: "Gérer l'abonnement",
    upgradePlan: "Mettre à niveau",
    syncing: "Synchronisation de l'abonnement…",
    syncSuccess: "Abonnement activé avec succès !",
    syncFailed: "La synchronisation a échoué.",
    noProvider: "Pas d'accès prestataire",
    offersLeft: "Offres restantes",
    unlimited: "Illimité",
    period: "Période de facturation",
    contactVisible: "Coordonnées visibles",
    contactHidden: "Coordonnées masquées",
    loading: "Chargement…",
    portalLoading: "Redirection vers Stripe…",
    noPlan: "Aucun abonnement actif",
    freePlan: "Vous utilisez le plan gratuit.",
    seePlans: "Voir les plans",
  },
};

export default function ProviderBilling() {
  const { language } = useLanguage();
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const checkoutResult = params.get("checkout"); // "success" | "cancel"
  const checkoutSessionId = params.get("session_id") ?? undefined;

  const L = LABELS[language] ?? LABELS.de;

  const [stats, setStats] = useState<AppStats | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<"success" | "failed" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isProvider = isServiceProvider(user);

  // On mount / after checkout: sync subscription if checkout=success
  useEffect(() => {
    if (!isProvider) return;

    void billingApi.plans().then(setPlans).catch(() => {});

    if (checkoutResult === "success") {
      setSyncing(true);
      billingApi
        .stripeSync(checkoutSessionId)
        .then(async (r) => {
          if (r.synced) {
            setSyncResult("success");
            await refresh();
          } else {
            setSyncResult("failed");
          }
        })
        .catch(() => setSyncResult("failed"))
        .finally(() => {
          setSyncing(false);
          // Remove query param from URL without reload
          setLocation("/provider/billing", { replace: true });
        });
    }

    billingApi
      .appStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [isProvider, checkoutResult]); // eslint-disable-line

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.stripePortal();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{L.noProvider}</p>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.slug === stats?.planSlug);
  const offersDisplay =
    stats?.appLimit === -1 ? L.unlimited : String(Math.max(0, (stats?.appLimit ?? 0) - (stats?.usedThisMonth ?? 0)));

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-2xl font-bold font-serif mb-1">{L.title}</h1>
      <p className="text-muted-foreground text-sm mb-8">{L.subtitle}</p>

      {/* Sync feedback */}
      {syncing && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted text-sm mb-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          {L.syncing}
        </div>
      )}
      {!syncing && syncResult === "success" && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm mb-6">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {L.syncSuccess}
        </div>
      )}
      {!syncing && syncResult === "failed" && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {L.syncFailed}
        </div>
      )}

      {/* Current plan card */}
      <Card className="p-6 mb-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {L.currentPlan}
        </div>

        {statsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {L.loading}
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {PLAN_ICONS[stats.planSlug] ?? <Shield className="w-4 h-4" />}
              <span className="text-lg font-bold">{stats.planName}</span>
              {stats.badge && (
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {stats.badge}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">{L.offersLeft}</div>
                <div className="font-semibold">{offersDisplay}</div>
              </div>
              {stats.periodEnd && (
                <div>
                  <div className="text-muted-foreground text-xs mb-0.5">{L.period}</div>
                  <div className="font-semibold">
                    {new Date(stats.periodEnd).toLocaleDateString(
                      language === "de" ? "de-CH" : language === "fr" ? "fr-CH" : "en-CH",
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {stats.contactVisible ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={stats.contactVisible ? "text-green-700" : "text-muted-foreground"}>
                {stats.contactVisible ? L.contactVisible : L.contactHidden}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>{L.noPlan}</p>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {stats?.planSlug && stats.planSlug !== "free" && (
          <Button
            variant="outline"
            onClick={() => void openPortal()}
            disabled={portalLoading}
            className="flex items-center gap-2"
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {portalLoading ? L.portalLoading : L.manageSub}
            {!portalLoading && <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
          </Button>
        )}

        <Button
          variant={!currentPlan ? "default" : "ghost"}
          onClick={() => setLocation("/pricing")}
          className="flex items-center gap-2"
        >
          {L.upgradePlan}
        </Button>
      </div>

    </div>
  );
}

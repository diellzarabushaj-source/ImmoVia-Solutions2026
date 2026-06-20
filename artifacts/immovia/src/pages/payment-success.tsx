import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { billingApi, type AppStats } from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  LayoutDashboard,
  Sparkles,
  Calendar,
  Coins,
  ExternalLink,
} from "lucide-react";

type Status = "processing" | "success" | "pending";

const LABELS: Record<string, Record<string, string>> = {
  de: {
    processing: "Zahlung wird bestätigt…",
    successTitle: "Zahlung erfolgreich",
    successSubtitle: "Ihr Abonnement ist jetzt aktiv.",
    pendingTitle: "Zahlung erhalten",
    pendingSubtitle:
      "Wir schließen Ihr Abonnement gerade ab. Das kann einen Moment dauern – Ihre Credits erscheinen in Kürze.",
    thankYou: "Danke für Ihr Abonnement bei ImmoVia365.",
    receiptTitle: "Bestellübersicht",
    planLabel: "Plan",
    amountLabel: "Betrag",
    creditsLabel: "Bewerbungen / Monat",
    renewalLabel: "Nächste Verlängerung",
    unlimited: "Unbegrenzt",
    perMonth: "/Monat",
    goDashboard: "Zum Dashboard",
    manageSub: "Abonnement verwalten",
    viewBilling: "Rechnungsdetails",
    portalLoading: "Weiterleitung zu Stripe…",
  },
  en: {
    processing: "Confirming your payment…",
    successTitle: "Payment successful",
    successSubtitle: "Your subscription is now active.",
    pendingTitle: "Payment received",
    pendingSubtitle:
      "We're finalizing your subscription. This can take a moment – your credits will appear shortly.",
    thankYou: "Thank you for subscribing to ImmoVia365.",
    receiptTitle: "Order summary",
    planLabel: "Plan",
    amountLabel: "Amount",
    creditsLabel: "Applications / month",
    renewalLabel: "Next renewal",
    unlimited: "Unlimited",
    perMonth: "/month",
    goDashboard: "Go to dashboard",
    manageSub: "Manage subscription",
    viewBilling: "Billing details",
    portalLoading: "Redirecting to Stripe…",
  },
  sq: {
    processing: "Po konfirmohet pagesa…",
    successTitle: "Pagesa u krye me sukses",
    successSubtitle: "Abonimi juaj tani është aktiv.",
    pendingTitle: "Pagesa u pranua",
    pendingSubtitle:
      "Po finalizojmë abonimin tuaj. Kjo mund të zgjasë pak – kreditet tuaja do të shfaqen së shpejti.",
    thankYou: "Faleminderit që u abonuat te ImmoVia365.",
    receiptTitle: "Përmbledhja e porosisë",
    planLabel: "Plani",
    amountLabel: "Shuma",
    creditsLabel: "Aplikime / muaj",
    renewalLabel: "Rinovimi i radhës",
    unlimited: "Pa limit",
    perMonth: "/muaj",
    goDashboard: "Shko te paneli",
    manageSub: "Menaxho abonimin",
    viewBilling: "Detajet e faturimit",
    portalLoading: "Po ridrejtoheni te Stripe…",
  },
  fr: {
    processing: "Confirmation du paiement…",
    successTitle: "Paiement réussi",
    successSubtitle: "Votre abonnement est maintenant actif.",
    pendingTitle: "Paiement reçu",
    pendingSubtitle:
      "Nous finalisons votre abonnement. Cela peut prendre un instant – vos crédits apparaîtront sous peu.",
    thankYou: "Merci de votre abonnement à ImmoVia365.",
    receiptTitle: "Récapitulatif",
    planLabel: "Plan",
    amountLabel: "Montant",
    creditsLabel: "Candidatures / mois",
    renewalLabel: "Prochain renouvellement",
    unlimited: "Illimité",
    perMonth: "/mois",
    goDashboard: "Aller au tableau de bord",
    manageSub: "Gérer l'abonnement",
    viewBilling: "Détails de facturation",
    portalLoading: "Redirection vers Stripe…",
  },
};

function localeFor(language: string): string {
  switch (language) {
    case "de":
      return "de-CH";
    case "fr":
      return "fr-CH";
    case "sq":
      return "sq-AL";
    default:
      return "en-CH";
  }
}

export default function PaymentSuccess() {
  const { language } = useLanguage();
  const { user, loading, refresh } = useAuth();
  const [, setLocation] = useLocation();

  const L = LABELS[language] ?? LABELS.de;
  const sessionId =
    new URLSearchParams(window.location.search).get("session_id") ?? undefined;

  const [status, setStatus] = useState<Status>("processing");
  const [stats, setStats] = useState<AppStats | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation("/login");
      return;
    }
    // Only service providers subscribe to plans — keep others off this flow.
    if (!isServiceProvider(user)) {
      setLocation("/dashboard");
      return;
    }
    if (ranRef.current) return;
    ranRef.current = true;

    // A genuine post-checkout return always carries the Stripe session id.
    // Without it, do NOT run the customer-wide fallback sync — it could
    // misleadingly confirm an older subscription as a fresh purchase.
    if (!sessionId) {
      setStatus("pending");
      return;
    }

    void (async () => {
      try {
        const r = await billingApi.stripeSync(sessionId);
        if (r.synced) {
          await refresh();
          try {
            setStats(await billingApi.appStats());
          } catch {
            // Stats are best-effort; the activation itself succeeded.
          }
          setStatus("success");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    })();
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.stripePortal();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  if (loading || status === "processing") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">{L.processing}</p>
      </div>
    );
  }

  const isSuccess = status === "success";
  const creditsDisplay =
    stats?.appLimit === -1
      ? L.unlimited
      : String(stats?.appLimit ?? 0);
  const amountDisplay =
    stats != null ? `CHF ${(stats.priceCents / 100).toFixed(0)}${L.perMonth}` : null;
  const renewalDisplay = stats?.periodEnd
    ? new Date(stats.periodEnd).toLocaleDateString(localeFor(language))
    : null;

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      {/* Hero confirmation */}
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
            isSuccess ? "bg-green-50" : "bg-amber-50"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-11 h-11 text-green-600" />
          ) : (
            <AlertCircle className="w-11 h-11 text-amber-500" />
          )}
        </div>
        <h1 className="text-2xl font-bold font-serif mb-2">
          {isSuccess ? L.successTitle : L.pendingTitle}
        </h1>
        <p className="text-muted-foreground text-sm max-w-md">
          {isSuccess ? L.successSubtitle : L.pendingSubtitle}
        </p>
      </div>

      {/* Order summary receipt */}
      {isSuccess && stats && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {L.receiptTitle}
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                {L.planLabel}
              </span>
              <span className="font-semibold text-right flex items-center gap-2">
                {stats.planName}
                {stats.badge && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {stats.badge}
                  </span>
                )}
              </span>
            </div>

            {amountDisplay && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="w-4 h-4" />
                  {L.amountLabel}
                </span>
                <span className="font-semibold">{amountDisplay}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                {L.creditsLabel}
              </span>
              <span className="font-semibold">{creditsDisplay}</span>
            </div>

            {renewalDisplay && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {L.renewalLabel}
                </span>
                <span className="font-semibold">{renewalDisplay}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-5 pt-4 border-t border-border">
            {L.thankYou}
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => setLocation("/provider")}
          className="flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          {L.goDashboard}
        </Button>

        <div className="flex flex-col sm:flex-row gap-3">
          {isSuccess && (
            <Button
              variant="outline"
              onClick={() => void openPortal()}
              disabled={portalLoading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {portalLoading ? L.portalLoading : L.manageSub}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setLocation("/provider/billing")}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {L.viewBilling}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </div>
      </div>
    </div>
  );
}

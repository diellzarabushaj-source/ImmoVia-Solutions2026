import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle2, Loader2, AlertCircle, CreditCard,
  LayoutDashboard, Sparkles, Calendar, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { billingApi, type AppStats } from "@/lib/billing-api";

type Status = "verifying" | "success" | "pending" | "error";

const L: Record<string, Record<string, string>> = {
  sq: {
    verifying: "Duke verifikuar pagesën...",
    successTitle: "Pagesa u konfirmua!",
    successSub: "Plani juaj është aktiv. Mund të filloni menjëherë.",
    pendingTitle: "Pagesa u pranua",
    pendingSub: "Po aktivizojmë abonimin tuaj. Kjo mund të zgjasë pak — provoni dashboard-in pas 30 sekondash.",
    error: "Verifikimi dështoi. Kontaktoni mbështetjen nëse problema vazhdon.",
    receiptTitle: "Përmbledhja e porosisë",
    planLabel: "Plani",
    amountLabel: "Shuma",
    creditsLabel: "Aplikime / muaj",
    unlocksLabel: "Unlocks / muaj",
    renewalLabel: "Rinovimi i radhës",
    unlimited: "Pa limit",
    perMonth: "/muaj",
    toDashboard: "Shko tek Paneli",
    thankYou: "Faleminderit që u bashkuat me ImmoVia365.",
  },
  en: {
    verifying: "Verifying your payment...",
    successTitle: "Payment confirmed!",
    successSub: "Your plan is now active. You can start right away.",
    pendingTitle: "Payment received",
    pendingSub: "We're activating your subscription. This may take a moment — try the dashboard in 30 seconds.",
    error: "Verification failed. Please contact support if the problem persists.",
    receiptTitle: "Order summary",
    planLabel: "Plan",
    amountLabel: "Amount",
    creditsLabel: "Applications / month",
    unlocksLabel: "Unlocks / month",
    renewalLabel: "Next renewal",
    unlimited: "Unlimited",
    perMonth: "/month",
    toDashboard: "Go to Dashboard",
    thankYou: "Thank you for joining ImmoVia365.",
  },
  de: {
    verifying: "Zahlung wird überprüft...",
    successTitle: "Zahlung bestätigt!",
    successSub: "Ihr Plan ist jetzt aktiv. Sie können sofort loslegen.",
    pendingTitle: "Zahlung erhalten",
    pendingSub: "Wir aktivieren Ihr Abonnement. Dies kann einen Moment dauern — versuchen Sie das Dashboard nach 30 Sekunden.",
    error: "Überprüfung fehlgeschlagen. Bitte kontaktieren Sie den Support.",
    receiptTitle: "Bestellübersicht",
    planLabel: "Plan",
    amountLabel: "Betrag",
    creditsLabel: "Bewerbungen / Monat",
    unlocksLabel: "Freischaltungen / Monat",
    renewalLabel: "Nächste Verlängerung",
    unlimited: "Unbegrenzt",
    perMonth: "/Monat",
    toDashboard: "Zum Dashboard",
    thankYou: "Danke, dass Sie sich ImmoVia365 angeschlossen haben.",
  },
  fr: {
    verifying: "Vérification du paiement...",
    successTitle: "Paiement confirmé !",
    successSub: "Votre plan est maintenant actif. Vous pouvez commencer immédiatement.",
    pendingTitle: "Paiement reçu",
    pendingSub: "Nous activons votre abonnement. Cela peut prendre un instant — essayez le tableau de bord dans 30 secondes.",
    error: "Échec de la vérification. Veuillez contacter le support.",
    receiptTitle: "Récapitulatif",
    planLabel: "Plan",
    amountLabel: "Montant",
    creditsLabel: "Candidatures / mois",
    unlocksLabel: "Déverrouillages / mois",
    renewalLabel: "Prochain renouvellement",
    unlimited: "Illimité",
    perMonth: "/mois",
    toDashboard: "Accéder au tableau de bord",
    thankYou: "Merci de rejoindre ImmoVia365.",
  },
};

function localeFor(lang: string) {
  if (lang === "de") return "de-CH";
  if (lang === "fr") return "fr-CH";
  if (lang === "sq") return "sq-AL";
  return "en-CH";
}

export default function PackagePaymentSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<Status>("verifying");
  const [stats, setStats] = useState<AppStats | null>(null);
  const ranRef = useRef(false);

  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("immovia_lang") : null) ?? "de";
  const l = L[lang] ?? L.en;

  const urlParams = new URLSearchParams(search);
  const companyId = urlParams.get("company_id");
  const sessionId = urlParams.get("session_id");

  // Wait for Clerk to finish loading before running — the sync route requires
  // a valid Clerk session, which may not be present immediately after the
  // Stripe redirect. Re-runs once clerkLoaded flips to true.
  useEffect(() => {
    if (!clerkLoaded) return;      // Clerk session not ready yet — wait
    if (ranRef.current) return;
    ranRef.current = true;

    if (!companyId || !sessionId) {
      setStatus("error");
      return;
    }

    void (async () => {
      try {
        // Step 1: mark company as paid (no auth required)
        const verifyResp = await fetch(`/api/companies/${companyId}/package-payment/verify`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const verifyData = await verifyResp.json() as { paid: boolean };

        if (!verifyData.paid) {
          setStatus("pending");
          return;
        }

        // Step 2: sync subscription (requires Clerk session — only attempt if signed in)
        if (isSignedIn) {
          try {
            const syncResp = await fetch(`/api/stripe/subscription/sync?session_id=${sessionId}`, {
              credentials: "include",
            });
            if (syncResp.ok) {
              const syncData = await syncResp.json() as { synced: boolean };
              if (syncData.synced) {
                try {
                  setStats(await billingApi.appStats());
                } catch {
                  // stats are best-effort
                }
                setStatus("success");
                return;
              }
            }
          } catch {
            // sync failed — fall through to pending; webhook may still activate
          }
        }

        // Payment verified — webhook will activate the plan shortly
        setStatus("pending");
      } catch {
        setStatus("error");
      }
    })();
  }, [clerkLoaded, isSignedIn]); // re-run once Clerk is ready

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1a3a6e]" />
          <p className="text-muted-foreground text-sm">{l.verifying}</p>
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center gap-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground">{l.error}</p>
          <Button onClick={() => setLocation("/provider")}>{l.toDashboard}</Button>
        </motion.div>
      </div>
    );
  }

  const isSuccess = status === "success";
  const creditsDisplay = stats?.appLimit === -1 ? l.unlimited : String(stats?.appLimit ?? 0);
  const unlocksDisplay = stats?.contactUnlocksLimit === -1 ? l.unlimited : (stats?.contactUnlocksLimit != null && stats.contactUnlocksLimit > 0 ? String(stats.contactUnlocksLimit) : null);
  const amountDisplay = stats?.priceCents ? `CHF ${(stats.priceCents / 100).toFixed(0)}${l.perMonth}` : null;
  const renewalDisplay = stats?.periodEnd ? new Date(stats.periodEnd).toLocaleDateString(localeFor(lang)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg"
      >
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${isSuccess ? "bg-green-50" : "bg-amber-50"}`}>
            {isSuccess
              ? <CheckCircle2 className="w-11 h-11 text-green-600" />
              : <AlertCircle className="w-11 h-11 text-amber-500" />
            }
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2">
            {isSuccess ? l.successTitle : l.pendingTitle}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            {isSuccess ? l.successSub : l.pendingSub}
          </p>
        </div>

        {/* Receipt */}
        {isSuccess && stats && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {l.receiptTitle}
            </div>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />{l.planLabel}
                </span>
                <span className="font-semibold flex items-center gap-2">
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
                    <Coins className="w-4 h-4" />{l.amountLabel}
                  </span>
                  <span className="font-semibold">{amountDisplay}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />{l.creditsLabel}
                </span>
                <span className="font-semibold">{creditsDisplay}</span>
              </div>
              {unlocksDisplay && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4" />{l.unlocksLabel}
                  </span>
                  <span className="font-semibold">{unlocksDisplay}</span>
                </div>
              )}
              {renewalDisplay && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />{l.renewalLabel}
                  </span>
                  <span className="font-semibold">{renewalDisplay}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-5 pt-4 border-t border-border">
              {l.thankYou}
            </p>
          </Card>
        )}

        {/* CTA */}
        <Button
          size="lg"
          className="w-full bg-[#1a3a6e] hover:bg-[#0f2044] text-white font-semibold text-[15px] h-12 flex items-center justify-center gap-2"
          onClick={() => setLocation("/provider")}
        >
          <LayoutDashboard className="w-4 h-4" />
          {l.toDashboard}
        </Button>
      </motion.div>
    </div>
  );
}

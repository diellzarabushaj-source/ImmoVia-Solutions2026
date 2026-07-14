import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { billingApi, type SubscriptionPlan } from "@/lib/billing-api";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { PlanCards, PLAN_CONFIG, type PlanType } from "@/components/PlanCards";

const CANCELLED_NOTICE: Record<string, string> = {
  de: "Zahlung abgebrochen. Es wurde nichts belastet.",
  en: "Payment cancelled. You were not charged.",
  sq: "Pagesa u anulua. Nuk u tarifua asgjë.",
  fr: "Paiement annulé. Vous n'avez pas été débité.",
};

const REDIRECTING_LABEL: Record<string, string> = {
  de: "Weiterleitung zur Kasse…",
  en: "Redirecting to checkout…",
  sq: "Po ridrejtoheni te arka…",
  fr: "Redirection vers le paiement…",
};

const PAGE_TITLE: Record<string, string> = {
  de: "Paket wählen",
  en: "Choose Your Plan",
  sq: "Zgjidhni Paketën",
  fr: "Choisir un forfait",
};

const PAGE_SUBTITLE: Record<string, string> = {
  de: "Wählen Sie das passende Paket für Ihr Unternehmen, bevor Sie fortfahren.",
  en: "Select the level that fits your business before continuing.",
  sq: "Zgjidhni nivelin që i përshtatet biznesit tuaj para se të vazhdoni.",
  fr: "Sélectionnez le niveau adapté à votre activité avant de continuer.",
};

const CONFIRM_BTN: Record<string, string> = {
  de: "Bestätigen & Weiter",
  en: "Confirm & Continue",
  sq: "Konfirmo dhe Vazhdo",
  fr: "Confirmer & Continuer",
};

const ALREADY_ACCOUNT: Record<string, string> = {
  de: "Bereits ein Konto?",
  en: "Already have an account?",
  sq: "Keni tashmë llogari?",
  fr: "Déjà un compte ?",
};

const SIGN_IN: Record<string, string> = {
  de: "Anmelden",
  en: "Sign in",
  sq: "Hyni",
  fr: "Se connecter",
};

const SELECT_PLAN_HINT: Record<string, string> = {
  de: "Bitte wählen Sie ein Paket aus.",
  en: "Please select a plan to continue.",
  sq: "Ju lutemi zgjidhni një paketë për të vazhduar.",
  fr: "Veuillez sélectionner un forfait pour continuer.",
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
        { "@type": "Question", "name": "Wie viele Bewerbungen kann ich pro Monat senden?", "acceptedAnswer": { "@type": "Answer", "text": "Das hängt von Ihrem Abo ab: Basic erlaubt 20 Bewerbungen pro Monat, Professional 50 und Premium unbegrenzt. Sobald Sie sich bewerben, wird automatisch ein Gesprächsfaden mit dem Auftraggeber eröffnet." } }
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
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(false);
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

  const slugForPlanType = (pt: PlanType): string =>
    pt === "professional" ? "pro" : pt;

  const handleConfirm = async () => {
    if (!selectedPlanType || loading) return;
    setError(null);

    if (!user) {
      setLocation("/signup");
      return;
    }
    if (!isProvider) {
      setError(t.pricing.errorClient);
      return;
    }

    const dbSlug = slugForPlanType(selectedPlanType);
    const plan = plans.find(p => p.slug === dbSlug);
    if (!plan) return;

    setLoading(true);
    try {
      const { url } = await billingApi.stripeCheckout(plan.id);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  };

  const pageTitle = PAGE_TITLE[language] ?? PAGE_TITLE.en;
  const pageSubtitle = PAGE_SUBTITLE[language] ?? PAGE_SUBTITLE.en;

  // Pre-select the "professional" plan (most popular) on first load
  useEffect(() => {
    setSelectedPlanType("professional");
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
      {/* Page heading */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">{pageTitle}</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto">{pageSubtitle}</p>
      </div>

      {cancelled && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm" data-testid="pricing-cancelled">
          {CANCELLED_NOTICE[language] ?? CANCELLED_NOTICE.en}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm" data-testid="pricing-error">
          {error}
        </div>
      )}

      {/* Plan cards — select to highlight */}
      <PlanCards selected={selectedPlanType} onSelect={setSelectedPlanType} />

      {/* Confirm & Continue */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <Button
          size="lg"
          className="w-full max-w-sm text-base font-semibold gap-2"
          disabled={!selectedPlanType || loading}
          onClick={() => void handleConfirm()}
          data-testid="confirm-plan-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {REDIRECTING_LABEL[language] ?? REDIRECTING_LABEL.en}
            </>
          ) : (
            <>
              {CONFIRM_BTN[language] ?? CONFIRM_BTN.en}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {!selectedPlanType && (
          <p className="text-xs text-muted-foreground">
            {SELECT_PLAN_HINT[language] ?? SELECT_PLAN_HINT.en}
          </p>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground">
            {ALREADY_ACCOUNT[language] ?? ALREADY_ACCOUNT.en}{" "}
            <button
              onClick={() => setLocation("/signin")}
              className="text-primary font-semibold hover:underline"
            >
              {SIGN_IN[language] ?? SIGN_IN.en}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

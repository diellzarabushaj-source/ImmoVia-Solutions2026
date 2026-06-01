import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientDashboard from "./client-dashboard";

const TEST_SUCCESS_TITLE: Record<string, string> = {
  de: "Test-Zahlung erfolgreich",
  en: "Test payment successful",
  sq: "Pagesa testuese me sukses",
  fr: "Paiement test réussi",
};

const TEST_SUCCESS_BODY: Record<string, string> = {
  de: "Die einmalige Live-Testzahlung (CHF 1) wurde erfasst. Ihr Plan wurde nicht geändert.",
  en: "The one-time live test charge (CHF 1) was recorded. Your plan was not changed.",
  sq: "Pagesa testuese e njëhershme (CHF 1) u regjistrua. Plani juaj nuk u ndryshua.",
  fr: "Le paiement test unique (CHF 1) a été enregistré. Votre plan n'a pas changé.",
};

const CONTINUE_LABEL: Record<string, string> = {
  de: "Weiter",
  en: "Continue",
  sq: "Vazhdo",
  fr: "Continuer",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get("payment") === "success";
    const isTest = params.get("test") === "1";
    const sessionId = params.get("session_id") ?? undefined;

    if (paymentSuccess && isTest) {
      // CHF 1 test payment: show a confirmation, do not provision a plan.
      setTestSuccess(true);
      return;
    }

    if (paymentSuccess && isServiceProvider(user)) {
      // Subscription checkout: reuse the proven provider-billing sync + success UI.
      const qs = sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : "";
      setLocation(`/provider/billing?checkout=success${qs}`);
      return;
    }

    if (user.role === "admin") setLocation("/admin");
    else if (isServiceProvider(user)) setLocation("/provider");
  }, [user, loading, setLocation]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (testSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center max-w-md">
        <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{TEST_SUCCESS_TITLE[language] ?? TEST_SUCCESS_TITLE.de}</h1>
        <p className="text-muted-foreground mb-6">{TEST_SUCCESS_BODY[language] ?? TEST_SUCCESS_BODY.de}</p>
        <Button onClick={() => setLocation(user.role === "admin" ? "/admin" : "/provider")} data-testid="button-test-continue">
          {CONTINUE_LABEL[language] ?? CONTINUE_LABEL.de}
        </Button>
      </div>
    );
  }

  // Project Posters (and unknown) go to client dashboard
  return <ClientDashboard />;
}

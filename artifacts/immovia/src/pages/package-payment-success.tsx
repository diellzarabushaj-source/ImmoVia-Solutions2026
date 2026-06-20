import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const L: Record<string, Record<string, string>> = {
  sq: {
    verifying: "Po verifikohet pagesa...",
    success: "Pagesa e paketës u konfirmua!",
    successSub: "Profili juaj është aktivizuar. Tani mund të konfiguroni aktivizimin përfundimtar.",
    toProvider: "Shkoni tek paneli",
    error: "Verifikimi dështoi. Ju lutemi provoni përsëri ose kontaktoni mbështetjen.",
    retry: "Provo Përsëri",
  },
  en: {
    verifying: "Verifying payment...",
    success: "Package payment confirmed!",
    successSub: "Your profile is set up. You can now complete the final activation step.",
    toProvider: "Go to Dashboard",
    error: "Verification failed. Please try again or contact support.",
    retry: "Try Again",
  },
  de: {
    verifying: "Zahlung wird überprüft...",
    success: "Paketzahlung bestätigt!",
    successSub: "Ihr Profil ist eingerichtet. Schliessen Sie nun den letzten Aktivierungsschritt ab.",
    toProvider: "Zum Dashboard",
    error: "Überprüfung fehlgeschlagen. Bitte erneut versuchen oder Support kontaktieren.",
    retry: "Erneut versuchen",
  },
  fr: {
    verifying: "Vérification du paiement...",
    success: "Paiement du forfait confirmé !",
    successSub: "Votre profil est configuré. Complétez maintenant l'étape d'activation finale.",
    toProvider: "Aller au tableau de bord",
    error: "Échec de la vérification. Veuillez réessayer ou contacter le support.",
    retry: "Réessayer",
  },
};

export default function PackagePaymentSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("immo_lang") : null) ?? "en";
  const l = L[lang] ?? L.en;

  useEffect(() => {
    const params = new URLSearchParams(search);
    const companyId = params.get("company_id");
    const sessionId = params.get("session_id");
    if (!companyId || !sessionId) { setStatus("error"); return; }

    void (async () => {
      try {
        const r = await fetch(`/api/companies/${companyId}/package-payment/verify`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const d = await r.json() as { paid: boolean };
        if (d.paid) { setStatus("success"); }
        else { setStatus("error"); }
      } catch {
        setStatus("error");
      }
    })();
  }, [search]);

  if (status === "verifying") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{l.verifying}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{l.success}</h1>
          <p className="text-muted-foreground text-sm max-w-sm">{l.successSub}</p>
        </div>
        <Button onClick={() => setLocation("/provider")} size="lg">
          {l.toProvider}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <div>
        <p className="text-muted-foreground text-sm max-w-sm">{l.error}</p>
      </div>
      <Button variant="outline" onClick={() => setLocation("/provider")}>
        {l.retry}
      </Button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useVerifyRegistrationPayment } from "@workspace/api-client-react";

export default function RegistrationPaymentSuccess() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const companyId = params.get("company_id");
  const sessionId = params.get("session_id");

  const [status, setStatus] = useState<"verifying" | "paid" | "failed">("verifying");
  const verify = useVerifyRegistrationPayment();

  useEffect(() => {
    if (!companyId || !sessionId) {
      setStatus("failed");
      return;
    }
    verify.mutate(
      { id: parseInt(companyId, 10), data: { sessionId } },
      {
        onSuccess: (res) => setStatus(res.paid ? "paid" : "failed"),
        onError: () => setStatus("failed"),
      }
    );
  }, []);

  const copy: Record<string, Record<string, string>> = {
    verifying: {
      sq: "Duke verifikuar pagesën...",
      en: "Verifying your payment...",
      de: "Zahlung wird verifiziert...",
      fr: "Vérification du paiement...",
    },
    paid: {
      sq: "Pagesa u krye me sukses!",
      en: "Payment successful!",
      de: "Zahlung erfolgreich!",
      fr: "Paiement réussi\u00a0!",
    },
    paidSub: {
      sq: "Profili juaj është aktiv dhe do të shqyrtohet nga ekipi ynë. Do t'ju kontaktojmë së shpejti.",
      en: "Your profile is active and will be reviewed by our team. We will contact you shortly.",
      de: "Ihr Profil ist aktiv und wird von unserem Team geprüft. Wir melden uns in Kürze.",
      fr: "Votre profil est actif et sera examiné par notre équipe. Nous vous contacterons prochainement.",
    },
    failed: {
      sq: "Verifikimi dështoi. Kontaktoni mbështetjen nëse pagesa u zbritë.",
      en: "Verification failed. Contact support if your payment was charged.",
      de: "Verifizierung fehlgeschlagen. Kontaktieren Sie den Support, falls eine Abbuchung erfolgt ist.",
      fr: "Échec de la vérification. Contactez le support si votre paiement a été débité.",
    },
    home: {
      sq: "Shko te paneli",
      en: "Go to dashboard",
      de: "Zum Dashboard",
      fr: "Aller au tableau de bord",
    },
    register: {
      sq: "Regjistrohu Sërisht",
      en: "Register Again",
      de: "Erneut registrieren",
      fr: "S'inscrire à nouveau",
    },
  };

  const lang = language || "en";

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
      {status === "verifying" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1a3a6e]" />
          <p className="text-muted-foreground">{copy.verifying[lang]}</p>
        </motion.div>
      )}

      {status === "paid" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-3">{copy.paid[lang]}</h2>
          <p className="text-muted-foreground text-sm mb-8">{copy.paidSub[lang]}</p>
          <Button className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setLocation("/provider")}>
            {copy.home[lang]}
          </Button>
        </motion.div>
      )}

      {status === "failed" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-3">{copy.failed[lang]}</h2>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setLocation("/register-company")}>
              {copy.register[lang]}
            </Button>
            <Button className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setLocation("/")}>
              {copy.home[lang]}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

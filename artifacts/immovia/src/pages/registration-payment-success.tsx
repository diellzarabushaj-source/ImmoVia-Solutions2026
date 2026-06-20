import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useVerifyRegistrationPayment } from "@workspace/api-client-react";

const copy: Record<string, Record<string, string>> = {
  verifying: { sq: "Duke verifikuar pagesën...", en: "Verifying your payment...", de: "Zahlung wird verifiziert...", fr: "Vérification du paiement..." },
  paid:      { sq: "Regjistrimi u krye me sukses!", en: "Registration complete!", de: "Registrierung abgeschlossen!", fr: "Inscription réussie\u00a0!" },
  paidSub:   {
    sq: "Pagesa u konfirmua. Tani jeni gati të konfiguroni profilin tuaj dhe të filloni të merrni projekte.",
    en: "Your payment has been confirmed. You are now ready to set up your profile and start receiving projects.",
    de: "Ihre Zahlung wurde bestätigt. Sie können nun Ihr Profil einrichten und Projekte erhalten.",
    fr: "Votre paiement a été confirmé. Vous pouvez maintenant configurer votre profil et recevoir des projets.",
  },
  cta:      { sq: "Konfiguro profilin tënd", en: "Set up my profile", de: "Mein Profil einrichten", fr: "Configurer mon profil" },
  failed:   {
    sq: "Verifikimi dështoi. Kontaktoni mbështetjen nëse pagesa u zbritë.",
    en: "Verification failed. Contact support if your payment was charged.",
    de: "Verifizierung fehlgeschlagen. Kontaktieren Sie den Support, falls eine Abbuchung erfolgt ist.",
    fr: "Échec de la vérification. Contactez le support si votre paiement a été débité.",
  },
  register: { sq: "Regjistrohu Sërisht", en: "Register Again", de: "Erneut registrieren", fr: "S'inscrire à nouveau" },
};

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
    if (!companyId || !sessionId) { setStatus("failed"); return; }
    verify.mutate(
      { id: parseInt(companyId, 10), data: { sessionId } },
      {
        onSuccess: (res) => setStatus(res.paid ? "paid" : "failed"),
        onError: () => setStatus("failed"),
      }
    );
  }, []);

  const lang = language || "en";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 flex flex-col items-center justify-center px-4 py-16">
      {status === "verifying" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1a3a6e]" />
          <p className="text-muted-foreground text-sm">{copy.verifying[lang]}</p>
        </motion.div>
      )}

      {status === "paid" && (
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="flex flex-col items-center text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-serif font-bold text-slate-900 mb-2"
          >
            {copy.paid[lang]}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm"
          >
            {copy.paidSub[lang]}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Button
              size="lg"
              className="bg-[#1a3a6e] hover:bg-[#0f2044] text-white font-semibold text-[15px] h-12 px-8"
              onClick={() => setLocation("/provider-welcome")}
            >
              {copy.cta[lang]}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
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
          <h2 className="text-xl font-serif font-bold mb-3 text-slate-900">{copy.failed[lang]}</h2>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setLocation("/register-company")}>
              {copy.register[lang]}
            </Button>
            <Button className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setLocation("/")}>
              Home
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

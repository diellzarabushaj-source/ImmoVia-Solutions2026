import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, CreditCard, Building2, LayoutDashboard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const L: Record<string, Record<string, string>> = {
  sq: {
    step1: "Plani", step2: "Regjistrimi", step3: "Paneli",
    verifying: "Duke verifikuar pagesën...",
    planPaid: "Pagesa e planit u konfirmua!",
    planPaidSub: "Abonimenti juaj është aktivizuar me sukses.",
    regTitle: "Hapi tjetër: Tarifa njëherëshe e regjistrimit",
    regDesc: "Pagesa njëherëshe prej CHF\u00a0149 aktivizon profilin tuaj publik dhe ju lejon të merrni projekte nga klientët.",
    regBtn: "Paguaj CHF\u00a0149 tani",
    regLoading: "Duke hapur...",
    feat1: "Profili juaj shfaqet në drejtorinë publike",
    feat2: "Klientët mund t'ju kontaktojnë drejtpërdrejt",
    feat3: "Hyrja e menjëhershme në panelin e ofruesit",
    feat4: "Njoftime për projekte të reja",
    error: "Verifikimi dështoi. Ju lutemi provoni përsëri ose kontaktoni mbështetjen.",
    toDashboard: "Shko tek paneli",
  },
  en: {
    step1: "Subscription", step2: "Registration", step3: "Dashboard",
    verifying: "Verifying your payment...",
    planPaid: "Subscription payment confirmed!",
    planPaidSub: "Your subscription plan is now active.",
    regTitle: "Next: One-time registration fee",
    regDesc: "A one-time payment of CHF\u00a0149 activates your public profile and allows you to receive projects from clients.",
    regBtn: "Pay CHF\u00a0149 now",
    regLoading: "Opening...",
    feat1: "Your profile appears in the public contractor directory",
    feat2: "Clients can contact you directly",
    feat3: "Instant access to your provider dashboard",
    feat4: "Notifications for new projects",
    error: "Verification failed. Please try again or contact support.",
    toDashboard: "Go to dashboard",
  },
  de: {
    step1: "Abonnement", step2: "Registrierung", step3: "Dashboard",
    verifying: "Zahlung wird überprüft...",
    planPaid: "Abonnementzahlung bestätigt!",
    planPaidSub: "Ihr Abonnementplan ist jetzt aktiv.",
    regTitle: "Nächster Schritt: Einmalige Registrierungsgebühr",
    regDesc: "Eine einmalige Zahlung von CHF\u00a0149 aktiviert Ihr öffentliches Profil.",
    regBtn: "Jetzt CHF\u00a0149 bezahlen",
    regLoading: "Öffnet...",
    feat1: "Ihr Profil erscheint im öffentlichen Verzeichnis",
    feat2: "Kunden können Sie direkt kontaktieren",
    feat3: "Sofortiger Zugang zu Ihrem Anbieter-Dashboard",
    feat4: "Benachrichtigungen für neue Projekte",
    error: "Überprüfung fehlgeschlagen. Bitte erneut versuchen oder Support kontaktieren.",
    toDashboard: "Zum Dashboard",
  },
  fr: {
    step1: "Abonnement", step2: "Inscription", step3: "Tableau de bord",
    verifying: "Vérification du paiement...",
    planPaid: "Paiement de l'abonnement confirmé\u00a0!",
    planPaidSub: "Votre plan d'abonnement est maintenant actif.",
    regTitle: "Étape suivante\u00a0: Frais d'inscription uniques",
    regDesc: "Un paiement unique de CHF\u00a0149 active votre profil public et vous permet de recevoir des projets.",
    regBtn: "Payer CHF\u00a0149 maintenant",
    regLoading: "Ouverture...",
    feat1: "Votre profil apparaît dans l'annuaire public",
    feat2: "Les clients peuvent vous contacter directement",
    feat3: "Accès immédiat à votre tableau de bord",
    feat4: "Notifications pour les nouveaux projets",
    error: "Échec de la vérification. Veuillez réessayer ou contacter le support.",
    toDashboard: "Aller au tableau de bord",
  },
};

const planLabels: Record<string, Record<string, string>> = {
  basic:        { sq: "Bazik",       en: "Basic",        de: "Basic",        fr: "Basic" },
  professional: { sq: "Profesional", en: "Professional", de: "Professional", fr: "Professionnel" },
  premium:      { sq: "Premium",     en: "Premium",      de: "Premium",      fr: "Premium" },
};

const STEP_ICONS = [CreditCard, Building2, LayoutDashboard];

export default function PackagePaymentSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [regLoading, setRegLoading] = useState(false);

  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("immo_lang") : null) ?? "en";
  const l = L[lang] ?? L.en;
  const rawPlan = (typeof localStorage !== "undefined" ? localStorage.getItem("immovia_pending_plan") : null) ?? "basic";
  const planLabel = (planLabels[rawPlan] ?? planLabels.basic)[lang] ?? rawPlan;

  const urlParams = new URLSearchParams(search);
  const companyId = urlParams.get("company_id");
  const sessionId = urlParams.get("session_id");

  useEffect(() => {
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
        setStatus(d.paid ? "success" : "error");
      } catch { setStatus("error"); }
    })();
  }, [search]);

  const payRegistration = async () => {
    if (!companyId) return;
    setRegLoading(true);
    try {
      const r = await fetch(`/api/companies/${companyId}/registration-checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json() as { url?: string };
      if (d.url) { window.location.href = d.url; }
      else { setRegLoading(false); }
    } catch { setRegLoading(false); }
  };

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
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground">{l.error}</p>
          <Button variant="outline" onClick={() => setLocation("/provider")}>{l.toDashboard}</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg"
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-12">
          {(["step1", "step2", "step3"] as const).map((step, i) => {
            const Icon = STEP_ICONS[i];
            const done   = i === 0;
            const active = i === 1;
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    done   ? "bg-green-500 border-green-500 text-white" :
                    active ? "bg-[#1a3a6e] border-[#1a3a6e] text-white" :
                             "bg-white border-slate-200 text-slate-400"
                  }`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-medium whitespace-nowrap ${
                    done ? "text-green-600" : active ? "text-[#1a3a6e]" : "text-slate-400"
                  }`}>{l[step]}</span>
                </div>
                {i < 2 && (
                  <div className={`w-16 sm:w-20 h-0.5 mx-2 mb-5 ${i === 0 ? "bg-green-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 confirmed */}
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 mb-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">{l.step1} — {planLabel}</p>
              <p className="font-bold text-slate-900 leading-tight">{l.planPaid}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{l.planPaidSub}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step 2 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white rounded-2xl border border-[#1a3a6e]/20 shadow-md p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1a3a6e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-5 h-5 text-[#1a3a6e]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#1a3a6e] uppercase tracking-wide mb-0.5">{l.step2}</p>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{l.regTitle}</h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{l.regDesc}</p>

          <ul className="space-y-2.5 mb-6">
            {[l.feat1, l.feat2, l.feat3, l.feat4].map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{f}</span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="w-full bg-[#1a3a6e] hover:bg-[#0f2044] text-white font-semibold text-[15px] h-12"
            onClick={() => void payRegistration()}
            disabled={regLoading}
          >
            {regLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{l.regLoading}</>
              : <>{l.regBtn}<ArrowRight className="w-4 h-4 ml-2" /></>
            }
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

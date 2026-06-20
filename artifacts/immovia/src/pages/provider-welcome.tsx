import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { User, Images, FileSearch, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/contexts/AuthContext";

const L: Record<string, {
  welcome: string; welcomeSub: string;
  stepsTitle: string;
  s1t: string; s1d: string;
  s2t: string; s2d: string;
  s3t: string; s3d: string;
  s4t: string; s4d: string;
  cta: string; note: string;
}> = {
  sq: {
    welcome: "Mirë se erdhët në ImmoVia365!",
    welcomeSub: "Llogaria juaj është aktive. Ndiqni hapat e mëposhtëm për të konfiguruar profilin tuaj dhe filluar të merrni projekte.",
    stepsTitle: "Hapat tjetër",
    s1t: "Plotësoni profilin tuaj",
    s1d: "Shtoni informacione mbi shërbimet, zonën e punës dhe çmimet tuaja.",
    s2t: "Shtoni fotografi nga projektet",
    s2d: "Ngarkoni fotografi cilësore nga punët tuaja të kaluara për të tërhequr klientë.",
    s3t: "Shfletoni projektet e disponueshme",
    s3d: "Gjeni projekte nga klientë në rajonin tuaj dhe bëni oferta të personalizuara.",
    s4t: "Merrni verifikimin",
    s4d: "Profili i verifikuar ju jep besueshmëri shtesë dhe prioritet në listim.",
    cta: "Shko tek paneli im",
    note: "Ekipi ynë do të rishikojë profilin tuaj brenda 24-48 orëve.",
  },
  en: {
    welcome: "Welcome to ImmoVia365!",
    welcomeSub: "Your account is active. Follow the steps below to set up your profile and start receiving projects.",
    stepsTitle: "Next steps",
    s1t: "Complete your profile",
    s1d: "Add your services, working area, and pricing information.",
    s2t: "Add portfolio photos",
    s2d: "Upload high-quality photos from your past projects to attract clients.",
    s3t: "Browse available projects",
    s3d: "Find projects from clients in your region and submit personalised offers.",
    s4t: "Get verified",
    s4d: "A verified profile gives you extra credibility and priority in listings.",
    cta: "Go to my dashboard",
    note: "Our team will review your profile within 24–48 hours.",
  },
  de: {
    welcome: "Willkommen bei ImmoVia365!",
    welcomeSub: "Ihr Konto ist aktiv. Folgen Sie den nachstehenden Schritten, um Ihr Profil einzurichten und Projekte zu erhalten.",
    stepsTitle: "Nächste Schritte",
    s1t: "Profil vervollständigen",
    s1d: "Fügen Sie Ihre Dienstleistungen, Ihr Arbeitsgebiet und Ihre Preise hinzu.",
    s2t: "Portfolio-Fotos hinzufügen",
    s2d: "Laden Sie hochwertige Fotos Ihrer bisherigen Projekte hoch, um Kunden zu gewinnen.",
    s3t: "Verfügbare Projekte durchsuchen",
    s3d: "Finden Sie Projekte von Kunden in Ihrer Region und geben Sie persönliche Angebote ab.",
    s4t: "Verifizierung erhalten",
    s4d: "Ein verifiziertes Profil gibt Ihnen zusätzliche Glaubwürdigkeit und Priorität in den Listings.",
    cta: "Zu meinem Dashboard",
    note: "Unser Team prüft Ihr Profil innerhalb von 24–48 Stunden.",
  },
  fr: {
    welcome: "Bienvenue sur ImmoVia365\u00a0!",
    welcomeSub: "Votre compte est actif. Suivez les étapes ci-dessous pour configurer votre profil et commencer à recevoir des projets.",
    stepsTitle: "Prochaines étapes",
    s1t: "Complétez votre profil",
    s1d: "Ajoutez vos services, votre zone de travail et vos informations tarifaires.",
    s2t: "Ajoutez des photos de portfolio",
    s2d: "Téléchargez des photos de qualité de vos projets passés pour attirer des clients.",
    s3t: "Parcourez les projets disponibles",
    s3d: "Trouvez des projets de clients dans votre région et soumettez des offres personnalisées.",
    s4t: "Obtenez la vérification",
    s4d: "Un profil vérifié vous donne plus de crédibilité et une priorité dans les annonces.",
    cta: "Aller à mon tableau de bord",
    note: "Notre équipe examinera votre profil dans les 24 à 48 heures.",
  },
};

const STEPS = [
  { icon: User,        key: "s1" },
  { icon: Images,      key: "s2" },
  { icon: FileSearch,  key: "s3" },
  { icon: ShieldCheck, key: "s4" },
] as const;

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };

export default function ProviderWelcome() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const l = L[language] ?? L.en;
  const firstName = user?.fullName?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2044] via-[#1a3a6e] to-[#1e4d8c] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
            {firstName ? `${l.welcome.replace("!", ",")} ${firstName}!` : l.welcome}
          </h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            {l.welcomeSub}
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          {STEPS.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/40 text-xs font-mono">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-white font-semibold text-sm">{l[`${key}t` as keyof typeof l]}</h3>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">{l[`${key}d` as keyof typeof l]}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Note + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            size="lg"
            className="bg-white text-[#1a3a6e] hover:bg-white/90 font-semibold text-base h-12 px-10 shadow-lg shadow-black/20"
            onClick={() => setLocation("/provider")}
          >
            {l.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-white/50 text-xs text-center">{l.note}</p>
        </motion.div>
      </div>
    </div>
  );
}

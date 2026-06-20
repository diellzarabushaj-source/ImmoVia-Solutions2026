import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useUser } from "@clerk/react";
import { setPendingSignup } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  User,
  Building2,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PlanCards, PLAN_CONFIG } from "@/components/PlanCards";
import type { PlanType } from "@/components/PlanCards";

const PENDING_PLAN_KEY = "immovia_pending_plan";

type AccountType = "project_poster" | "service_provider";
type AccountSubtype = "individual" | "company";

const PLAN_LABELS: Record<string, { choosePlan: string; planSub: string; recommended: string; perMonth: string; regFee: string; step1of3: string; step2of3: string; step3of3: string; step4of4: string; step1of4: string; step2of4: string; step3of4: string; title: string; step1Question: string; step2Question: string; step3Title: string; step3Subtitle: string; yourSelection: string; posterLabel: string; posterTitle: string; posterDesc: string; providerLabel: string; providerTitle: string; providerDesc: string; individualTitle: string; individualDesc: string; companyTitle: string; companyDesc: string; labelIndividualPoster: string; labelCompanyPoster: string; labelIndividualProvider: string; labelCompanyProvider: string; meaningIndividualPoster: string; meaningCompanyPoster: string; meaningIndividualProvider: string; meaningCompanyProvider: string; confirmBtn: string; backBtn: string; alreadyHaveAccount: string; signIn: string; chooseBtn: string; choosePlanStep: string }> = {
  sq: {
    choosePlan: "Zgjidhni Paketën",
    planSub: "Zgjidhni nivelin e duhur para se të vazhdoni.",
    recommended: "Rekomanduar",
    perMonth: "/ muaj",
    regFee: "Tarifa e regjistrimit njëherë: CHF 149",
    step1of3: "Hapi 1 nga 3", step2of3: "Hapi 2 nga 3", step3of3: "Hapi 3 nga 3",
    step1of4: "Hapi 1 nga 4", step2of4: "Hapi 2 nga 4", step3of4: "Hapi 3 nga 4", step4of4: "Hapi 4 nga 4",
    title: "Krijoni Llogarinë Tuaj",
    step1Question: "Si do të përdorni ImmoVia365?",
    step2Question: "Si do të operoni?",
    step3Title: "Konfirmoni Zgjedhjen",
    step3Subtitle: "Shikoni dhe konfirmoni detajet e llogarisë tuaj.",
    yourSelection: "Zgjedhja juaj",
    posterLabel: "POSTUES PROJEKTESH", posterTitle: "Dua të gjej profesionistë", posterDesc: "Postoni projektet tuaja dhe merrni oferta nga kontraktorë të vettuar.",
    providerLabel: "OFRUES SHËRBIMI", providerTitle: "Dua të ofroj shërbime", providerDesc: "Regjistrohuni si kontraktor dhe gjeni klientë të rinj.",
    individualTitle: "Profesionist Individual", individualDesc: "Punoj si individ ose i vetëpunësuar.",
    companyTitle: "Kompani / Firmë", companyDesc: "Drejtoj një kompani ose firmë ndërtimi.",
    labelIndividualPoster: "Postues Individual", labelCompanyPoster: "Kompani Postuese", labelIndividualProvider: "Profesionist Individual", labelCompanyProvider: "Kompani / Firmë",
    meaningIndividualPoster: "Si individ, mund të postoni projekte renovimi dhe të merrni oferta nga profesionistë.",
    meaningCompanyPoster: "Si kompani, mund të postoni projekte dhe të menaxhoni oferta nga kontraktorë.",
    meaningIndividualProvider: "Si profesionist individual, profili juaj do të shfaqet në drejtorinë e kontraktorëve.",
    meaningCompanyProvider: "Si kompani, do të keni qasje në listimin e plotë dhe menaxhimin e projekteve.",
    confirmBtn: "Konfirmo dhe Vazhdo", backBtn: "Kthehu", alreadyHaveAccount: "Keni tashmë llogari?", signIn: "Hyni",
    chooseBtn: "Zgjidhni", choosePlanStep: "Zgjidhni paketën",
  },
  en: {
    choosePlan: "Choose Your Plan",
    planSub: "Select the level that fits your business before continuing.",
    recommended: "Recommended",
    perMonth: "/ mo",
    regFee: "One-time registration fee: CHF 149",
    step1of3: "Step 1 of 3", step2of3: "Step 2 of 3", step3of3: "Step 3 of 3",
    step1of4: "Step 1 of 4", step2of4: "Step 2 of 4", step3of4: "Step 3 of 4", step4of4: "Step 4 of 4",
    title: "Create Your Account",
    step1Question: "How will you use ImmoVia365?",
    step2Question: "How do you operate?",
    step3Title: "Confirm Your Selection",
    step3Subtitle: "Review and confirm your account details.",
    yourSelection: "Your selection",
    posterLabel: "PROJECT POSTER", posterTitle: "I want to find professionals", posterDesc: "Post your projects and receive offers from vetted contractors.",
    providerLabel: "SERVICE PROVIDER", providerTitle: "I want to offer services", providerDesc: "Register as a contractor and find new clients.",
    individualTitle: "Individual Professional", individualDesc: "I work as an individual or self-employed.",
    companyTitle: "Company / Firm", companyDesc: "I run a construction company or firm.",
    labelIndividualPoster: "Individual Poster", labelCompanyPoster: "Company Poster", labelIndividualProvider: "Individual Professional", labelCompanyProvider: "Company / Firm",
    meaningIndividualPoster: "As an individual, you can post renovation projects and receive offers from professionals.",
    meaningCompanyPoster: "As a company, you can post projects and manage offers from contractors.",
    meaningIndividualProvider: "As an individual professional, your profile will appear in the contractor directory.",
    meaningCompanyProvider: "As a company, you will have access to full listings and project management.",
    confirmBtn: "Confirm & Continue", backBtn: "Back", alreadyHaveAccount: "Already have an account?", signIn: "Sign in",
    chooseBtn: "Choose", choosePlanStep: "Choose plan",
  },
  de: {
    choosePlan: "Paket wählen",
    planSub: "Wählen Sie das passende Paket für Ihr Unternehmen.",
    recommended: "Empfohlen",
    perMonth: "/ Mo.",
    regFee: "Einmalige Registrierungsgebühr: CHF 149",
    step1of3: "Schritt 1 von 3", step2of3: "Schritt 2 von 3", step3of3: "Schritt 3 von 3",
    step1of4: "Schritt 1 von 4", step2of4: "Schritt 2 von 4", step3of4: "Schritt 3 von 4", step4of4: "Schritt 4 von 4",
    title: "Konto erstellen",
    step1Question: "Wie möchten Sie ImmoVia365 nutzen?",
    step2Question: "Wie sind Sie tätig?",
    step3Title: "Auswahl bestätigen",
    step3Subtitle: "Überprüfen und bestätigen Sie Ihre Kontodaten.",
    yourSelection: "Ihre Auswahl",
    posterLabel: "AUFTRAGGEBER", posterTitle: "Ich suche Fachleute", posterDesc: "Veröffentlichen Sie Ihre Projekte und erhalten Sie Angebote von geprüften Auftragnehmern.",
    providerLabel: "DIENSTLEISTER", providerTitle: "Ich biete Dienste an", providerDesc: "Registrieren Sie sich als Auftragnehmer und finden Sie neue Kunden.",
    individualTitle: "Einzelperson", individualDesc: "Ich arbeite als Einzelperson oder Selbstständiger.",
    companyTitle: "Unternehmen / Firma", companyDesc: "Ich leite ein Bauunternehmen oder eine Firma.",
    labelIndividualPoster: "Einzelner Auftraggeber", labelCompanyPoster: "Unternehmen als Auftraggeber", labelIndividualProvider: "Einzelunternehmer", labelCompanyProvider: "Unternehmen / Firma",
    meaningIndividualPoster: "Als Einzelperson können Sie Renovierungsprojekte veröffentlichen und Angebote erhalten.",
    meaningCompanyPoster: "Als Unternehmen können Sie Projekte veröffentlichen und Angebote verwalten.",
    meaningIndividualProvider: "Als Einzelunternehmer erscheint Ihr Profil im Auftragnehmerverzeichnis.",
    meaningCompanyProvider: "Als Unternehmen haben Sie vollen Zugang zum Listing und Projektmanagement.",
    confirmBtn: "Bestätigen & Weiter", backBtn: "Zurück", alreadyHaveAccount: "Bereits ein Konto?", signIn: "Anmelden",
    chooseBtn: "Wählen", choosePlanStep: "Paket wählen",
  },
  fr: {
    choosePlan: "Choisir un forfait",
    planSub: "Sélectionnez le niveau adapté à votre activité avant de continuer.",
    recommended: "Recommandé",
    perMonth: "/ mois",
    regFee: "Frais d'inscription uniques : CHF 149",
    step1of3: "Étape 1 sur 3", step2of3: "Étape 2 sur 3", step3of3: "Étape 3 sur 3",
    step1of4: "Étape 1 sur 4", step2of4: "Étape 2 sur 4", step3of4: "Étape 3 sur 4", step4of4: "Étape 4 sur 4",
    title: "Créer votre compte",
    step1Question: "Comment allez-vous utiliser ImmoVia365 ?",
    step2Question: "Comment exercez-vous ?",
    step3Title: "Confirmer votre sélection",
    step3Subtitle: "Vérifiez et confirmez les détails de votre compte.",
    yourSelection: "Votre sélection",
    posterLabel: "DONNEUR D'ORDRE", posterTitle: "Je cherche des professionnels", posterDesc: "Publiez vos projets et recevez des offres de prestataires vérifiés.",
    providerLabel: "PRESTATAIRE", providerTitle: "Je propose des services", providerDesc: "Inscrivez-vous comme prestataire et trouvez de nouveaux clients.",
    individualTitle: "Professionnel indépendant", individualDesc: "Je travaille en tant qu'indépendant.",
    companyTitle: "Société / Entreprise", companyDesc: "Je dirige une société de construction.",
    labelIndividualPoster: "Particulier donneur d'ordre", labelCompanyPoster: "Société donneur d'ordre", labelIndividualProvider: "Professionnel indépendant", labelCompanyProvider: "Société / Entreprise",
    meaningIndividualPoster: "En tant que particulier, publiez des projets de rénovation et recevez des offres.",
    meaningCompanyPoster: "En tant que société, publiez des projets et gérez les offres.",
    meaningIndividualProvider: "En tant qu'indépendant, votre profil apparaît dans l'annuaire.",
    meaningCompanyProvider: "En tant que société, vous avez accès aux annonces complètes et à la gestion de projets.",
    confirmBtn: "Confirmer & Continuer", backBtn: "Retour", alreadyHaveAccount: "Déjà un compte ?", signIn: "Se connecter",
    chooseBtn: "Choisir", choosePlanStep: "Choisir un forfait",
  },
};

export default function Signup() {
  const { isSignedIn, isLoaded } = useUser();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const o = PLAN_LABELS[language] ?? PLAN_LABELS.en;

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [accountSubtype, setAccountSubtype] = useState<AccountSubtype | null>(null);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) setLocation("/dashboard");
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const preselected = params.get("account_type") as AccountType | null;
    if (preselected === "service_provider") {
      setAccountType("service_provider");
      setShowPlanSelection(true); // show plan selection first for SP
    } else if (preselected === "project_poster") {
      setAccountType("project_poster");
      setStep(2);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setAccountSubtype(null);
    setPlanType(null);
    if (type === "service_provider") {
      setShowPlanSelection(true);
    } else {
      setShowPlanSelection(false);
      setStep(2);
    }
  };

  const handlePlanSelect = (plan: PlanType) => {
    setPlanType(plan);
  };

  const handlePlanConfirm = () => {
    if (!planType) return;
    setShowPlanSelection(false);
    setStep(2);
  };

  const handleSubtypeSelect = (subtype: AccountSubtype) => {
    setAccountSubtype(subtype);
    setStep(3);
  };

  const handleConfirm = () => {
    if (!accountType || !accountSubtype) return;
    // Store plan in localStorage so it survives the Clerk redirect
    if (planType) {
      localStorage.setItem(PENDING_PLAN_KEY, planType);
    }
    setPendingSignup({ accountType, accountSubtype, language });
    window.location.href = `${basePath}/sign-up`;
  };

  // ── Label helpers ──────────────────────────────────────────────────────────

  const getCombinedLabel = (): string => {
    if (accountType === "project_poster" && accountSubtype === "individual") return o.labelIndividualPoster;
    if (accountType === "project_poster" && accountSubtype === "company") return o.labelCompanyPoster;
    if (accountType === "service_provider" && accountSubtype === "individual") return o.labelIndividualProvider;
    return o.labelCompanyProvider;
  };

  const getCombinedMeaning = (): string => {
    if (accountType === "project_poster" && accountSubtype === "individual") return o.meaningIndividualPoster;
    if (accountType === "project_poster" && accountSubtype === "company") return o.meaningCompanyPoster;
    if (accountType === "service_provider" && accountSubtype === "individual") return o.meaningIndividualProvider;
    return o.meaningCompanyProvider;
  };

  // ── Progress (SP = 4 steps, PP = 3 steps) ─────────────────────────────────
  const isSP = accountType === "service_provider";

  const getStepLabel = (): string => {
    if (!isSP) {
      return step === 1 ? o.step1of3 : step === 2 ? o.step2of3 : o.step3of3;
    }
    // SP: plan selection is "step 2 of 4", subtype is "step 3 of 4", confirm is "step 4 of 4"
    if (showPlanSelection) return o.step2of4;
    if (step === 2) return o.step3of4;
    if (step === 3) return o.step4of4;
    return o.step1of4;
  };

  const getVisualStep = (): number => {
    if (!isSP) return step;
    if (step === 1 && !showPlanSelection) return 1;
    if (showPlanSelection) return 2;
    if (step === 2) return 3;
    return 4;
  };

  const totalDots = isSP ? 4 : 3;
  const visualStep = getVisualStep();

  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: totalDots }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s < visualStep
                ? "bg-primary text-white"
                : s === visualStep
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s < visualStep ? <CheckCircle2 className="w-4 h-4" /> : s}
          </div>
          {s < totalDots && (
            <div className={`w-10 h-0.5 transition-colors ${s < visualStep ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Shell wrapper ─────────────────────────────────────────────────────────
  const Shell = ({ children, maxW = "max-w-3xl" }: { children: React.ReactNode; maxW?: string }) => (
    <div className={`container mx-auto px-4 py-12 md:py-20 ${maxW}`}>
      <div className="flex justify-center mb-8">
        <img src="/logo-color.png" alt="ImmoVia365" className="h-14 md:h-16 w-auto object-contain" decoding="async" />
      </div>
      <ProgressBar />
      <div className="text-center mb-1">
        <span className="inline-block text-xs font-bold text-primary/70 uppercase tracking-widest mb-3">
          {getStepLabel()}
        </span>
      </div>
      {children}
      <p className="text-center text-sm text-muted-foreground mt-8">
        {o.alreadyHaveAccount}{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          {o.signIn}
        </Link>
      </p>
    </div>
  );

  // ── PLAN SELECTION (SP only, appears before step 2) ───────────────────────
  if (showPlanSelection && accountType === "service_provider") {
    return (
      <Shell maxW="max-w-4xl">
        <button
          type="button"
          onClick={() => { setShowPlanSelection(false); setAccountType(null); setStep(1); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> {o.backBtn}
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{o.choosePlan}</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">{o.planSub}</p>

        <div className="mb-6">
          <PlanCards selected={planType} onSelect={handlePlanSelect} />
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handlePlanConfirm}
            disabled={!planType}
            className="px-10 font-semibold"
          >
            {o.confirmBtn} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Shell>
    );
  }

  // ── STEP 1: Account type ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Shell>
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{o.title}</h1>
        <p className="text-center text-muted-foreground mb-8">{o.step1Question}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={() => handleAccountTypeSelect("project_poster")}
            className={`text-left p-7 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountType === "project_poster" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
            }`}
            data-testid="select-account-type-project_poster"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{o.posterLabel}</div>
            <h3 className="text-xl font-bold mb-2">{o.posterTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{o.posterDesc}</p>
          </button>

          <button
            type="button"
            onClick={() => handleAccountTypeSelect("service_provider")}
            className={`text-left p-7 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountType === "service_provider" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
            }`}
            data-testid="select-account-type-service_provider"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{o.providerLabel}</div>
            <h3 className="text-xl font-bold mb-2">{o.providerTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{o.providerDesc}</p>
          </button>
        </div>
      </Shell>
    );
  }

  // ── STEP 2: Individual or Company ─────────────────────────────────────────
  if (step === 2) {
    const typeLabel = accountType === "project_poster" ? o.posterLabel : o.providerLabel;

    const handleBack = () => {
      if (accountType === "service_provider") {
        // For SP, go back to plan selection
        setStep(1);
        setShowPlanSelection(true);
      } else {
        setStep(1);
      }
    };

    return (
      <Shell maxW="max-w-xl">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto mb-6 transition-colors"
          data-testid="back-to-step-1"
        >
          <ChevronLeft className="w-4 h-4" /> {o.backBtn}
        </button>

        <div className="text-center mb-8">
          <div className="inline-block text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-3">
            {typeLabel}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{o.step2Question}</h1>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => handleSubtypeSelect("individual")}
            className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountSubtype === "individual" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
            }`}
            data-testid="select-subtype-individual"
          >
            <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg mb-0.5">{o.individualTitle}</div>
                <div className="text-sm text-muted-foreground">{o.individualDesc}</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSubtypeSelect("company")}
            className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountSubtype === "company" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
            }`}
            data-testid="select-subtype-company"
          >
            <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg mb-0.5">{o.companyTitle}</div>
                <div className="text-sm text-muted-foreground">{o.companyDesc}</div>
              </div>
            </div>
          </button>
        </div>
      </Shell>
    );
  }

  // ── STEP 3: Confirmation ──────────────────────────────────────────────────
  const combinedLabel = getCombinedLabel();
  const combinedMeaning = getCombinedMeaning();
  const isProjectPoster = accountType === "project_poster";

  return (
    <Shell maxW="max-w-lg">
      <button
        type="button"
        onClick={() => setStep(2)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto mb-6 transition-colors"
        data-testid="back-to-step-2"
      >
        <ChevronLeft className="w-4 h-4" /> {o.backBtn}
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{o.step3Title}</h1>
      <p className="text-center text-muted-foreground text-sm mb-8">{o.step3Subtitle}</p>

      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-7 mb-6">
        <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-3">{o.yourSelection}</div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            {isProjectPoster
              ? <Briefcase className="w-7 h-7 text-white" />
              : <Building2 className="w-7 h-7 text-white" />
            }
          </div>
          <div>
            <div className="text-xl font-bold leading-tight">{combinedLabel}</div>
            {planType && !isProjectPoster && (
              <div className="text-sm text-primary font-medium mt-0.5">
                {PLAN_CONFIG[planType].badge[language] ?? PLAN_CONFIG[planType].badge.en} Plan · CHF {PLAN_CONFIG[planType].monthlyChf}{o.perMonth}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-muted-foreground bg-white/60 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span className="leading-relaxed">{combinedMeaning}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setStep(2)} data-testid="confirm-back">
          <ChevronLeft className="w-4 h-4 mr-1" /> {o.backBtn}
        </Button>
        <Button className="flex-1 font-semibold" onClick={handleConfirm} data-testid="confirm-and-continue">
          {o.confirmBtn} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Shell>
  );
}

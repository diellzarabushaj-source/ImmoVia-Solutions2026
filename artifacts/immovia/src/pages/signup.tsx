import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useUser } from "@clerk/react";
import { setPendingSignup } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  User,
  Building2,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Phone,
  MapPin,
} from "lucide-react";
import { PlanCards, PLAN_CONFIG } from "@/components/PlanCards";
import type { PlanType } from "@/components/PlanCards";

const PENDING_PLAN_KEY = "immovia_pending_plan";
const SP_WORKER_TYPE_KEY = "immovia_sp_worker_type";
const SP_FIRST_NAME_KEY = "immovia_sp_first_name";
const SP_LAST_NAME_KEY = "immovia_sp_last_name";
const SP_COMPANY_NAME_KEY = "immovia_sp_company_name";
const SP_PHONE_KEY = "immovia_sp_phone";
const SP_CITY_KEY = "immovia_sp_city";
const POSTER_ACCOUNT_TYPE_KEY = "immovia_poster_account_type";
const POSTER_FIRST_NAME_KEY = "immovia_poster_first_name";
const POSTER_LAST_NAME_KEY = "immovia_poster_last_name";

type AccountType = "project_poster" | "service_provider";
type AccountSubtype = "individual" | "company";

const L = {
  sq: {
    choosePlan: "Zgjidhni Paketën",
    planSub: "Zgjidhni nivelin e duhur para se të vazhdoni.",
    perMonth: "/ muaj",
    step1of3: "Hapi 1 nga 3", step2of3: "Hapi 2 nga 3", step3of3: "Hapi 3 nga 3",
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
    termsAgreeLabel: "Kam lexuar dhe pranoj",
    termsAgreeError: "Duhet të pranosh kushtet para se të vazhdosh.",
    chooseBtn: "Zgjidhni",
    // SP details form
    spDetailsTitle: "Të dhënat tuaja",
    spDetailsSubtitle: "Plotësoni informacionin bazë. Pas kësaj do të krijoni llogarinë dhe do të paguani.",
    workerTypeLabel: "Lloji i aktivitetit",
    individual: "Profesionist Individual",
    individualDesc2: "Punoj si individ ose i vetëpunësuar",
    company: "Kompani / Firmë",
    companyDesc2: "Drejtoj një kompani ose firmë",
    firstNameLabel: "Emri",
    lastNameLabel: "Mbiemri",
    companyNameLabel: "Emri i Kompanisë",
    phoneLabel: "Numri i Telefonit",
    cityLabel: "Qyteti",
    ph_firstName: "p.sh. Arben",
    ph_lastName: "p.sh. Hoxha",
    ph_company: "p.sh. Hoxha Ndërtim Sh.p.k.",
    ph_phone: "p.sh. +41 79 123 45 67",
    ph_city: "p.sh. Zürich",
    continueToAccount: "Vazhdo me Krijimin e Llogarisë",
    errorRequired: "Ky fushë është e detyrueshme.",
    errorPhone: "Numri i telefonit duhet të ketë të paktën 7 karaktere.",
    planLabel: "Paketa juaj",
    setupFee: "Tarifa njëherë: CHF 149",
    totalFirst: "Pagesa e parë",
  },
  en: {
    choosePlan: "Choose Your Plan",
    planSub: "Select the level that fits your business before continuing.",
    perMonth: "/ mo",
    step1of3: "Step 1 of 3", step2of3: "Step 2 of 3", step3of3: "Step 3 of 3",
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
    termsAgreeLabel: "I have read and agree to the",
    termsAgreeError: "You must accept the terms before continuing.",
    chooseBtn: "Choose",
    spDetailsTitle: "Your Details",
    spDetailsSubtitle: "Fill in your basic information. You will then create your account and pay.",
    workerTypeLabel: "Business type",
    individual: "Individual Professional",
    individualDesc2: "I work as an individual or self-employed",
    company: "Company / Firm",
    companyDesc2: "I run a company or firm",
    firstNameLabel: "First Name",
    lastNameLabel: "Last Name",
    companyNameLabel: "Company Name",
    phoneLabel: "Phone Number",
    cityLabel: "City",
    ph_firstName: "e.g. John",
    ph_lastName: "e.g. Smith",
    ph_company: "e.g. Smith Construction GmbH",
    ph_phone: "e.g. +41 79 123 45 67",
    ph_city: "e.g. Zurich",
    continueToAccount: "Continue to Account Setup",
    errorRequired: "This field is required.",
    errorPhone: "Phone number must be at least 7 characters.",
    planLabel: "Your plan",
    setupFee: "One-time setup fee: CHF 149",
    totalFirst: "First payment",
  },
  de: {
    choosePlan: "Paket wählen",
    planSub: "Wählen Sie das passende Paket für Ihr Unternehmen.",
    perMonth: "/ Mo.",
    step1of3: "Schritt 1 von 3", step2of3: "Schritt 2 von 3", step3of3: "Schritt 3 von 3",
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
    termsAgreeLabel: "Ich habe die",
    termsAgreeError: "Bitte akzeptieren Sie die Nutzungsbedingungen, um fortzufahren.",
    chooseBtn: "Wählen",
    spDetailsTitle: "Ihre Angaben",
    spDetailsSubtitle: "Füllen Sie Ihre Grunddaten aus. Danach erstellen Sie Ihr Konto und bezahlen.",
    workerTypeLabel: "Unternehmenstyp",
    individual: "Einzelunternehmer",
    individualDesc2: "Ich bin selbstständig oder Einzelperson",
    company: "Unternehmen / Firma",
    companyDesc2: "Ich leite ein Unternehmen oder eine Firma",
    firstNameLabel: "Vorname",
    lastNameLabel: "Nachname",
    companyNameLabel: "Unternehmensname",
    phoneLabel: "Telefonnummer",
    cityLabel: "Stadt",
    ph_firstName: "z.B. Hans",
    ph_lastName: "z.B. Müller",
    ph_company: "z.B. Müller Bau GmbH",
    ph_phone: "z.B. +41 79 123 45 67",
    ph_city: "z.B. Zürich",
    continueToAccount: "Weiter zur Kontoerstellung",
    errorRequired: "Dieses Feld ist erforderlich.",
    errorPhone: "Telefonnummer muss mindestens 7 Zeichen haben.",
    planLabel: "Ihr Paket",
    setupFee: "Einmalige Einrichtungsgebühr: CHF 149",
    totalFirst: "Erste Zahlung",
  },
  fr: {
    choosePlan: "Choisir un forfait",
    planSub: "Sélectionnez le niveau adapté à votre activité avant de continuer.",
    perMonth: "/ mois",
    step1of3: "Étape 1 sur 3", step2of3: "Étape 2 sur 3", step3of3: "Étape 3 sur 3",
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
    termsAgreeLabel: "J'ai lu et j'accepte les",
    termsAgreeError: "Vous devez accepter les conditions avant de continuer.",
    chooseBtn: "Choisir",
    spDetailsTitle: "Vos coordonnées",
    spDetailsSubtitle: "Remplissez vos informations de base. Vous créerez ensuite votre compte et paierez.",
    workerTypeLabel: "Type d'activité",
    individual: "Professionnel indépendant",
    individualDesc2: "Je travaille en tant qu'indépendant",
    company: "Société / Entreprise",
    companyDesc2: "Je dirige une société ou entreprise",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom de famille",
    companyNameLabel: "Nom de la société",
    phoneLabel: "Numéro de téléphone",
    cityLabel: "Ville",
    ph_firstName: "ex. Jean",
    ph_lastName: "ex. Dupont",
    ph_company: "ex. Dupont Construction Sàrl",
    ph_phone: "ex. +41 79 123 45 67",
    ph_city: "ex. Zurich",
    continueToAccount: "Continuer vers la création du compte",
    errorRequired: "Ce champ est obligatoire.",
    errorPhone: "Le numéro de téléphone doit contenir au moins 7 caractères.",
    planLabel: "Votre forfait",
    setupFee: "Frais d'activation uniques : CHF 149",
    totalFirst: "Premier paiement",
  },
};

// ── Module-level components (MUST be outside the main component to prevent
//    React from treating them as new types on every render, which would
//    unmount inputs and lose focus after each keystroke) ───────────────────

function SignupProgressBar({ visualStep }: { visualStep: number }) {
  const totalDots = 3;
  return (
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
}

function SignupShell({
  children,
  maxW = "max-w-3xl",
  stepLabel,
  alreadyText,
  signInText,
  visualStep,
}: {
  children: React.ReactNode;
  maxW?: string;
  stepLabel: string;
  alreadyText: string;
  signInText: string;
  visualStep: number;
}) {
  return (
    <div className={`container mx-auto px-4 py-12 md:py-20 ${maxW}`}>
      <div className="flex justify-center mb-8">
        <img src="/logo-color.png" alt="ImmoVia365" className="h-14 md:h-16 w-auto object-contain" decoding="async" />
      </div>
      <SignupProgressBar visualStep={visualStep} />
      <div className="text-center mb-1">
        <span className="inline-block text-xs font-bold text-primary/70 uppercase tracking-widest mb-3">
          {stepLabel}
        </span>
      </div>
      {children}
      <p className="text-center text-sm text-muted-foreground mt-8">
        {alreadyText}{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          {signInText}
        </Link>
      </p>
    </div>
  );
}

export default function Signup() {
  const { isSignedIn, isLoaded } = useUser();
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const o = L[language as keyof typeof L] ?? L.en;

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [accountSubtype, setAccountSubtype] = useState<AccountSubtype | null>(null);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // SP details form state
  const [spWorkerType, setSpWorkerType] = useState<AccountSubtype | null>(null);
  const [spFirstName, setSpFirstName] = useState("");
  const [spLastName, setSpLastName] = useState("");
  const [spCompanyName, setSpCompanyName] = useState("");
  const [spPhone, setSpPhone] = useState("");
  const [spCity, setSpCity] = useState("");
  const [spErrors, setSpErrors] = useState<Record<string, string>>({});

  // Project poster name state
  const [posterFirstName, setPosterFirstName] = useState("");
  const [posterLastName, setPosterLastName] = useState("");
  const [posterErrors, setPosterErrors] = useState<Record<string, string>>({});

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
      setShowPlanSelection(true);
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

  const handlePlanConfirm = () => {
    if (!planType) return;
    localStorage.setItem(PENDING_PLAN_KEY, planType);
    setShowPlanSelection(false);
    // SP skips step 2 (subtype only) — goes directly to details form (step 3)
    setStep(3);
  };

  const handleSubtypeSelect = (subtype: AccountSubtype) => {
    setAccountSubtype(subtype);
    setStep(3);
  };

  // SP details form submission
  const handleSpDetailsSubmit = () => {
    const e: Record<string, string> = {};
    if (!spWorkerType) e.workerType = o.errorRequired;
    if (spWorkerType === "individual") {
      if (!spFirstName.trim()) e.firstName = o.errorRequired;
      if (!spLastName.trim()) e.lastName = o.errorRequired;
    } else if (spWorkerType === "company") {
      if (!spCompanyName.trim()) e.companyName = o.errorRequired;
    }
    if (!spPhone.trim() || spPhone.trim().length < 7) e.phone = o.errorPhone;
    if (!spCity.trim()) e.city = o.errorRequired;
    setSpErrors(e);
    if (!termsAgreed) { setTermsError(true); return; }
    if (Object.keys(e).length > 0) return;

    // Store all details to localStorage
    localStorage.setItem(SP_WORKER_TYPE_KEY, spWorkerType!);
    localStorage.setItem(SP_FIRST_NAME_KEY, spFirstName.trim());
    localStorage.setItem(SP_LAST_NAME_KEY, spLastName.trim());
    localStorage.setItem(SP_COMPANY_NAME_KEY, spCompanyName.trim());
    localStorage.setItem(SP_PHONE_KEY, spPhone.trim());
    localStorage.setItem(SP_CITY_KEY, spCity.trim());

    setPendingSignup({ accountType: "service_provider", accountSubtype: spWorkerType!, language });
    window.location.href = `${basePath}/sign-up`;
  };

  // Project poster confirmation (with name validation)
  const handleConfirm = () => {
    if (!accountType || !accountSubtype) return;
    const e: Record<string, string> = {};
    if (!posterFirstName.trim()) e.firstName = o.errorRequired;
    if (!posterLastName.trim()) e.lastName = o.errorRequired;
    setPosterErrors(e);
    if (!termsAgreed) { setTermsError(true); return; }
    if (Object.keys(e).length > 0) return;

    // Store poster name + subtype so signup-complete can sync them
    localStorage.setItem(POSTER_ACCOUNT_TYPE_KEY, accountSubtype);
    localStorage.setItem(POSTER_FIRST_NAME_KEY, posterFirstName.trim());
    localStorage.setItem(POSTER_LAST_NAME_KEY, posterLastName.trim());

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

  // ── Progress (always 3 dots) ───────────────────────────────────────────────
  const isSP = accountType === "service_provider";

  const getStepLabel = (): string => {
    if (!isSP) {
      return step === 1 ? o.step1of3 : step === 2 ? o.step2of3 : o.step3of3;
    }
    if (step === 1 && !showPlanSelection) return o.step1of3;
    if (showPlanSelection) return o.step2of3;
    return o.step3of3;
  };

  const getVisualStep = (): number => {
    if (!isSP) return step;
    if (step === 1 && !showPlanSelection) return 1;
    if (showPlanSelection) return 2;
    return 3;
  };

  const visualStep = getVisualStep();
  const shellProps = { stepLabel: getStepLabel(), alreadyText: o.alreadyHaveAccount, signInText: o.signIn, visualStep };

  // ── PLAN SELECTION (SP only) ───────────────────────────────────────────────
  if (showPlanSelection && accountType === "service_provider") {
    const planConfig = planType ? PLAN_CONFIG[planType] : null;
    const planPrice = planConfig?.monthlyChf ?? 0;
    const firstTotal = planPrice + 149;

    return (
      <SignupShell {...shellProps} maxW="max-w-4xl">
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
          <PlanCards selected={planType} onSelect={setPlanType} />
        </div>

        {planType && planConfig && (
          <div className="max-w-sm mx-auto mb-4 bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm text-center text-muted-foreground">
            {o.planLabel}: <span className="font-semibold text-foreground">CHF {planPrice}{o.perMonth}</span>
            {" + "}
            <span className="text-amber-700 font-medium">CHF 149</span>
            {" → "}
            {o.totalFirst}: <span className="font-bold text-foreground">CHF {firstTotal}</span>
          </div>
        )}

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
      </SignupShell>
    );
  }

  // ── STEP 1: Account type ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SignupShell {...shellProps}>
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
      </SignupShell>
    );
  }

  // ── STEP 2: Individual or Company (project posters only) ──────────────────
  if (step === 2) {
    const typeLabel = accountType === "project_poster" ? o.posterLabel : o.providerLabel;
    return (
      <SignupShell {...shellProps} maxW="max-w-xl">
        <button
          type="button"
          onClick={() => setStep(1)}
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
      </SignupShell>
    );
  }

  // ── STEP 3-SP: Details form (service providers) ───────────────────────────
  if (step === 3 && accountType === "service_provider") {
    const planConfig = planType ? PLAN_CONFIG[planType] : PLAN_CONFIG.basic;
    const planPrice = planConfig.monthlyChf;
    const firstTotal = planPrice + 149;
    const planBadge = planConfig.badge[language as keyof typeof planConfig.badge] ?? planConfig.badge.en;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-6">
            <img src="/logo-color.png" alt="ImmoVia365" className="h-14 w-auto object-contain" decoding="async" />
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-0 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < 3 ? "bg-primary text-white" : "bg-primary text-white ring-4 ring-primary/20"
                }`}>
                  {s < 3 ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className="w-10 h-0.5 bg-primary" />}
              </div>
            ))}
          </div>

          <div className="text-center mb-5">
            <span className="inline-block text-xs font-bold text-primary/70 uppercase tracking-widest mb-2">
              {o.step3of3}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-serif mb-1">{o.spDetailsTitle}</h1>
            <p className="text-muted-foreground text-sm">{o.spDetailsSubtitle}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 space-y-5">
            {/* Plan summary */}
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-0.5">{o.planLabel}</div>
                <div className="font-bold text-sm">
                  {planBadge} — CHF {planPrice}{o.perMonth}
                  <span className="ml-2 text-xs font-normal text-amber-700">+ {o.setupFee}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {o.totalFirst}: <span className="font-bold text-foreground">CHF {firstTotal}</span>
                </div>
              </div>
            </div>

            {/* Worker type */}
            <div>
              <label className="block text-sm font-semibold mb-2">{o.workerTypeLabel}</label>
              <div className="grid grid-cols-2 gap-3">
                {(["individual", "company"] as AccountSubtype[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSpWorkerType(type);
                      setSpErrors((p) => ({ ...p, workerType: "" }));
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      spWorkerType === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      spWorkerType === type ? "bg-primary/20" : "bg-slate-100"
                    }`}>
                      {type === "individual"
                        ? <User className="w-4 h-4 text-primary" />
                        : <Building2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{type === "individual" ? o.individual : o.company}</div>
                      <div className="text-xs text-muted-foreground">{type === "individual" ? o.individualDesc2 : o.companyDesc2}</div>
                    </div>
                  </button>
                ))}
              </div>
              {spErrors.workerType && <p className="text-xs text-destructive mt-1">{spErrors.workerType}</p>}
            </div>

            {/* Name fields — show only after worker type selected */}
            {spWorkerType === "individual" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">{o.firstNameLabel}</label>
                  <Input
                    value={spFirstName}
                    onChange={(e) => { setSpFirstName(e.target.value); setSpErrors((p) => ({ ...p, firstName: "" })); }}
                    placeholder={o.ph_firstName}
                    className={spErrors.firstName ? "border-destructive" : ""}
                  />
                  {spErrors.firstName && <p className="text-xs text-destructive mt-1">{spErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{o.lastNameLabel}</label>
                  <Input
                    value={spLastName}
                    onChange={(e) => { setSpLastName(e.target.value); setSpErrors((p) => ({ ...p, lastName: "" })); }}
                    placeholder={o.ph_lastName}
                    className={spErrors.lastName ? "border-destructive" : ""}
                  />
                  {spErrors.lastName && <p className="text-xs text-destructive mt-1">{spErrors.lastName}</p>}
                </div>
              </div>
            )}

            {spWorkerType === "company" && (
              <div>
                <label className="block text-sm font-semibold mb-1">{o.companyNameLabel}</label>
                <Input
                  value={spCompanyName}
                  onChange={(e) => { setSpCompanyName(e.target.value); setSpErrors((p) => ({ ...p, companyName: "" })); }}
                  placeholder={o.ph_company}
                  className={spErrors.companyName ? "border-destructive" : ""}
                />
                {spErrors.companyName && <p className="text-xs text-destructive mt-1">{spErrors.companyName}</p>}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" />{o.phoneLabel}</span>
              </label>
              <Input
                type="tel"
                value={spPhone}
                onChange={(e) => { setSpPhone(e.target.value); setSpErrors((p) => ({ ...p, phone: "" })); }}
                placeholder={o.ph_phone}
                className={spErrors.phone ? "border-destructive" : ""}
              />
              {spErrors.phone && <p className="text-xs text-destructive mt-1">{spErrors.phone}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />{o.cityLabel}</span>
              </label>
              <Input
                value={spCity}
                onChange={(e) => { setSpCity(e.target.value); setSpErrors((p) => ({ ...p, city: "" })); }}
                placeholder={o.ph_city}
                className={spErrors.city ? "border-destructive" : ""}
              />
              {spErrors.city && <p className="text-xs text-destructive mt-1">{spErrors.city}</p>}
            </div>

            {/* Terms & Conditions checkbox */}
            <div className="pt-1">
              <label className={`flex items-start gap-2.5 cursor-pointer select-none rounded-xl border p-3 transition-colors ${termsError && !termsAgreed ? "border-destructive bg-destructive/5" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => { setTermsAgreed(e.target.checked); if (e.target.checked) setTermsError(false); }}
                  className="mt-0.5 h-4 w-4 accent-primary flex-shrink-0"
                />
                <span className="text-sm text-muted-foreground leading-snug">
                  {o.termsAgreeLabel}{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                    {t.footer.terms}
                  </a>{" & "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                    {t.footer.privacy}
                  </a>
                </span>
              </label>
              {termsError && !termsAgreed && (
                <p className="text-xs text-destructive mt-1.5 ml-1">{o.termsAgreeError}</p>
              )}
            </div>

            <div className="pt-1">
              <Button
                size="lg"
                onClick={handleSpDetailsSubmit}
                className="w-full font-semibold"
              >
                {o.continueToAccount} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setShowPlanSelection(true); setStep(1); }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto mt-5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> {o.backBtn}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {o.alreadyHaveAccount}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {o.signIn}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── STEP 3: Confirmation (project posters only) ───────────────────────────
  const combinedLabel = getCombinedLabel();
  const combinedMeaning = getCombinedMeaning();
  const isProjectPoster = accountType === "project_poster";

  return (
    <SignupShell {...shellProps} maxW="max-w-lg">
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
                {PLAN_CONFIG[planType].badge[language as keyof (typeof PLAN_CONFIG)[typeof planType]["badge"]] ?? PLAN_CONFIG[planType].badge.en} Plan · CHF {PLAN_CONFIG[planType].monthlyChf}{o.perMonth}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-muted-foreground bg-white/60 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span className="leading-relaxed">{combinedMeaning}</span>
        </div>
      </div>

      {/* Name fields — required for all account types */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">{o.firstNameLabel}</label>
          <Input
            value={posterFirstName}
            onChange={(e) => { setPosterFirstName(e.target.value); setPosterErrors((p) => ({ ...p, firstName: "" })); }}
            placeholder={o.ph_firstName}
            className={posterErrors.firstName ? "border-destructive" : ""}
          />
          {posterErrors.firstName && <p className="text-xs text-destructive mt-1">{posterErrors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{o.lastNameLabel}</label>
          <Input
            value={posterLastName}
            onChange={(e) => { setPosterLastName(e.target.value); setPosterErrors((p) => ({ ...p, lastName: "" })); }}
            placeholder={o.ph_lastName}
            className={posterErrors.lastName ? "border-destructive" : ""}
          />
          {posterErrors.lastName && <p className="text-xs text-destructive mt-1">{posterErrors.lastName}</p>}
        </div>
      </div>

      {/* Terms & Conditions checkbox */}
      <div className="mb-4">
        <label className={`flex items-start gap-2.5 cursor-pointer select-none rounded-xl border p-3 transition-colors ${termsError && !termsAgreed ? "border-destructive bg-destructive/5" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
          <input
            type="checkbox"
            checked={termsAgreed}
            onChange={(e) => { setTermsAgreed(e.target.checked); if (e.target.checked) setTermsError(false); }}
            className="mt-0.5 h-4 w-4 accent-primary flex-shrink-0"
          />
          <span className="text-sm text-muted-foreground leading-snug">
            {o.termsAgreeLabel}{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
              {t.footer.terms}
            </a>{" & "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
              {t.footer.privacy}
            </a>
          </span>
        </label>
        {termsError && !termsAgreed && (
          <p className="text-xs text-destructive mt-1.5 ml-1">{o.termsAgreeError}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setStep(2)} data-testid="confirm-back">
          <ChevronLeft className="w-4 h-4 mr-1" /> {o.backBtn}
        </Button>
        <Button className="flex-1 font-semibold" onClick={handleConfirm} data-testid="confirm-and-continue">
          {o.confirmBtn} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </SignupShell>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { useCreateCompany } from "@workspace/api-client-react";
import { useCategories } from "@/hooks/useCategories";
import { PLAN_CONFIG } from "@/components/PlanCards";
import type { PlanType } from "@/components/PlanCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, ChevronLeft, User, Building2, Check, ArrowRight,
  MapPin, Phone, CheckCircle2, CreditCard, Info,
} from "lucide-react";

const PENDING_PLAN_KEY = "immovia_pending_plan";

type WorkerType = "individual" | "company";

interface FormData {
  workerType: WorkerType | null;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  city: string;
  services: string[];
  description: string;
}

const L = {
  sq: {
    logoAlt: "ImmoVia365",
    step1Title: "Të dhënat tuaja",
    step1Subtitle: "Plotësoni informacionin bazë për profilin tuaj.",
    step2Title: "Shërbimet tuaja",
    step2Subtitle: "Zgjidhni shërbimet dhe shkruani një përshkrim të shkurtër.",
    individual: "Profesionist Individual",
    individualDesc: "Punoj si individ ose i vetëpunësuar",
    company: "Kompani / Firmë",
    companyDesc: "Drejtoj një kompani ose firmë",
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
    ph_desc: "Ofrojmë shërbime profesionale renovimi...",
    servicesLabel: "Shërbimet (zgjidhni të paktën një)",
    descLabel: "Përshkrim i shkurtër (opsional)",
    nextBtn: "Vazhdo",
    submitBtn: "Krijoni Profilin",
    submitting: "Duke krijuar profilin...",
    backBtn: "Kthehu",
    stepOf: (a: number, b: number) => `Hapi ${a} nga ${b}`,
    errorRequired: "Ky fushë është e detyrueshme.",
    errorPhone: "Numri i telefonit duhet të ketë të paktën 7 karaktere.",
    errorMinServices: "Zgjidhni të paktën një shërbim.",
    errorSubmit: "Ndodhi një gabim. Ju lutemi provoni përsëri.",
    planLabel: "Paketa juaj",
    perMonth: "/muaj",
    setupFee: "Pagesat online aktivizohen më vonë",
    totalFirst: "Pagesa e parë",
    workerTypeLabel: "Lloji i aktivitetit",
  },
  en: {
    logoAlt: "ImmoVia365",
    step1Title: "Your Details",
    step1Subtitle: "Fill in your basic profile information.",
    step2Title: "Your Services",
    step2Subtitle: "Select your services and add a short description.",
    individual: "Individual Professional",
    individualDesc: "I work as an individual or self-employed",
    company: "Company / Firm",
    companyDesc: "I run a company or firm",
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
    ph_desc: "We offer professional renovation services...",
    servicesLabel: "Services (select at least one)",
    descLabel: "Short description (optional)",
    nextBtn: "Continue",
    submitBtn: "Create Profile",
    submitting: "Creating profile...",
    backBtn: "Back",
    stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    errorRequired: "This field is required.",
    errorPhone: "Phone number must be at least 7 characters.",
    errorMinServices: "Select at least one service.",
    errorSubmit: "An error occurred. Please try again.",
    planLabel: "Your plan",
    perMonth: "/month",
    setupFee: "Online payments will be activated later",
    totalFirst: "First payment",
    workerTypeLabel: "Business type",
  },
  de: {
    logoAlt: "ImmoVia365",
    step1Title: "Ihre Angaben",
    step1Subtitle: "Füllen Sie Ihre grundlegenden Profilinformationen aus.",
    step2Title: "Ihre Dienstleistungen",
    step2Subtitle: "Wählen Sie Ihre Dienstleistungen und fügen Sie eine Kurzbeschreibung hinzu.",
    individual: "Einzelunternehmer",
    individualDesc: "Ich bin selbstständig oder Einzelperson",
    company: "Unternehmen / Firma",
    companyDesc: "Ich leite ein Unternehmen oder eine Firma",
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
    ph_desc: "Wir bieten professionelle Renovierungsleistungen an...",
    servicesLabel: "Dienstleistungen (mindestens eine wählen)",
    descLabel: "Kurzbeschreibung (optional)",
    nextBtn: "Weiter",
    submitBtn: "Profil erstellen",
    submitting: "Profil wird erstellt...",
    backBtn: "Zurück",
    stepOf: (a: number, b: number) => `Schritt ${a} von ${b}`,
    errorRequired: "Dieses Feld ist erforderlich.",
    errorPhone: "Telefonnummer muss mindestens 7 Zeichen haben.",
    errorMinServices: "Wählen Sie mindestens einen Dienst.",
    errorSubmit: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
    planLabel: "Ihr Paket",
    perMonth: "/Monat",
    setupFee: "Online-Zahlungen werden später aktiviert",
    totalFirst: "Erste Zahlung",
    workerTypeLabel: "Unternehmenstyp",
  },
  fr: {
    logoAlt: "ImmoVia365",
    step1Title: "Vos coordonnées",
    step1Subtitle: "Remplissez vos informations de profil de base.",
    step2Title: "Vos services",
    step2Subtitle: "Sélectionnez vos services et ajoutez une brève description.",
    individual: "Professionnel indépendant",
    individualDesc: "Je travaille en tant qu'indépendant",
    company: "Société / Entreprise",
    companyDesc: "Je dirige une société ou entreprise",
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
    ph_desc: "Nous proposons des services professionnels de rénovation...",
    servicesLabel: "Services (sélectionnez au moins un)",
    descLabel: "Brève description (optionnel)",
    nextBtn: "Continuer",
    submitBtn: "Créer le profil",
    submitting: "Création du profil...",
    backBtn: "Retour",
    stepOf: (a: number, b: number) => `Étape ${a} sur ${b}`,
    errorRequired: "Ce champ est obligatoire.",
    errorPhone: "Le numéro de téléphone doit contenir au moins 7 caractères.",
    errorMinServices: "Sélectionnez au moins un service.",
    errorSubmit: "Une erreur s'est produite. Veuillez réessayer.",
    planLabel: "Votre forfait",
    perMonth: "/mois",
    setupFee: "Les paiements en ligne seront activés ultérieurement",
    totalFirst: "Premier paiement",
    workerTypeLabel: "Type d'activité",
  },
};

export default function ProviderOnboarding() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const l = L[language as keyof typeof L] ?? L.en;

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    workerType: null,
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    city: "",
    services: [],
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "general", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const createCompany = useCreateCompany();
  const { categories } = useCategories("service");

  const planType = (typeof localStorage !== "undefined" ? localStorage.getItem(PENDING_PLAN_KEY) : null) ?? "basic";
  const planConfig = PLAN_CONFIG[planType as PlanType] ?? PLAN_CONFIG.basic;
  const planBadge = planConfig.badge[language] ?? planConfig.badge.en;
  const planPrice = planConfig.monthlyChf;
  const firstTotal = planPrice + 149;

  useEffect(() => {
    if (!loading && (!user || !isServiceProvider(user))) {
      setLocation("/login");
    }
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCompany = formData.workerType === "company";

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: typeof errors = {};
    if (!formData.workerType) e.workerType = l.errorRequired;
    if (!isCompany) {
      if (!formData.firstName.trim()) e.firstName = l.errorRequired;
      if (!formData.lastName.trim()) e.lastName = l.errorRequired;
    } else {
      if (!formData.companyName.trim()) e.companyName = l.errorRequired;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 7) e.phone = l.errorPhone;
    if (!formData.city.trim()) e.city = l.errorRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: typeof errors = {};
    if (formData.services.length === 0) e.services = l.errorMinServices;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const contactName = isCompany
        ? formData.companyName.trim()
        : `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const companyName = isCompany ? formData.companyName.trim() : contactName;

      const company = await createCompany.mutateAsync({
        data: {
          companyName,
          contactName,
          email: user?.email ?? "",
          phone: formData.phone.trim(),
          serviceTypes: formData.services.length > 0 ? formData.services : ["other"],
          city: formData.city.trim(),
          description: formData.description.trim() || undefined,
          workerType: formData.workerType ?? "individual",
          planType,
        },
      });

      localStorage.removeItem(PENDING_PLAN_KEY);

      setLocation("/provider");
    } catch {
      setErrors({ general: l.errorSubmit });
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Plan summary pill ───────────────────────────────────────────────────────

  const PlanSummary = () => (
    <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-8">
      <CreditCard className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-0.5">{l.planLabel}</div>
        <div className="font-bold text-sm text-foreground">
          {planBadge} — CHF {planPrice}{l.perMonth}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({l.setupFee})
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {l.totalFirst}: <span className="font-semibold text-foreground">CHF {firstTotal}</span>
        </div>
      </div>
    </div>
  );

  // ── Progress dots ───────────────────────────────────────────────────────────

  const Progress = () => (
    <div className="flex items-center justify-center gap-0 mb-6">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            s < step ? "bg-primary text-white" : s === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground"
          }`}>
            {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
          </div>
          {s < 2 && (
            <div className={`w-14 h-0.5 transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── STEP 1: Personal details ────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-8">
            <img src="/logo-color.png" alt={l.logoAlt} className="h-14 w-auto object-contain" decoding="async" />
          </div>

          <Progress />

          <div className="text-center mb-6">
            <span className="inline-block text-xs font-bold text-primary/70 uppercase tracking-widest mb-2">
              {l.stepOf(1, 2)}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-serif mb-1">{l.step1Title}</h1>
            <p className="text-muted-foreground text-sm">{l.step1Subtitle}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 space-y-5">
            <PlanSummary />

            {/* Worker type */}
            <div>
              <label className="block text-sm font-semibold mb-2">{l.workerTypeLabel}</label>
              <div className="grid grid-cols-2 gap-3">
                {(["individual", "company"] as WorkerType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, workerType: type }));
                      setErrors((p) => ({ ...p, workerType: undefined }));
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      formData.workerType === type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      formData.workerType === type ? "bg-primary/20" : "bg-slate-100"
                    }`}>
                      {type === "individual"
                        ? <User className="w-4 h-4 text-primary" />
                        : <Building2 className="w-4 h-4 text-primary" />
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{type === "individual" ? l.individual : l.company}</div>
                      <div className="text-xs text-muted-foreground">{type === "individual" ? l.individualDesc : l.companyDesc}</div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.workerType && <p className="text-xs text-destructive mt-1">{errors.workerType}</p>}
            </div>

            {/* Name fields */}
            {formData.workerType === "individual" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">{l.firstNameLabel}</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder={l.ph_firstName}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{l.lastNameLabel}</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder={l.ph_lastName}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>
            )}

            {formData.workerType === "company" && (
              <div>
                <label className="block text-sm font-semibold mb-1">{l.companyNameLabel}</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder={l.ph_company}
                  className={errors.companyName ? "border-destructive" : ""}
                />
                {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" />{l.phoneLabel}</span>
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder={l.ph_phone}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />{l.cityLabel}</span>
              </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                placeholder={l.ph_city}
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={!formData.workerType}
              className="w-full font-semibold"
            >
              {l.nextBtn} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Services ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <img src="/logo-color.png" alt={l.logoAlt} className="h-14 w-auto object-contain" decoding="async" />
        </div>

        <Progress />

        <div className="text-center mb-6">
          <span className="inline-block text-xs font-bold text-primary/70 uppercase tracking-widest mb-2">
            {l.stepOf(2, 2)}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif mb-1">{l.step2Title}</h1>
          <p className="text-muted-foreground text-sm">{l.step2Subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 space-y-5">
          <PlanSummary />

          {/* Services grid */}
          <div>
            <label className="block text-sm font-semibold mb-3">{l.servicesLabel}</label>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isSelected = formData.services.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setFormData((p) => ({
                          ...p,
                          services: isSelected
                            ? p.services.filter((s) => s !== cat.key)
                            : [...p.services, cat.key],
                        }));
                        setErrors((p) => ({ ...p, services: undefined }));
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 font-semibold"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary border-primary" : "border-slate-300"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Duke ngarkuar kategorite...</span>
              </div>
            )}
            {errors.services && <p className="text-xs text-destructive mt-1">{errors.services}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1">{l.descLabel}</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder={l.ph_desc}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Checkout summary */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              {language === "sq" && `Do të ridrejtoheni tek Stripe për të paguar CHF ${planPrice}/muaj + CHF 149 tarifë njëherë (gjithsej CHF ${firstTotal} sot).`}
              {language === "en" && `You'll be redirected to Stripe to pay CHF ${planPrice}/month + CHF 149 one-time setup fee (total CHF ${firstTotal} today).`}
              {language === "de" && `Sie werden zu Stripe weitergeleitet, um CHF ${planPrice}/Monat + CHF 149 Einrichtungsgebühr zu bezahlen (gesamt CHF ${firstTotal} heute).`}
              {language === "fr" && `Vous serez redirigé vers Stripe pour payer CHF ${planPrice}/mois + CHF 149 frais d'activation (total CHF ${firstTotal} aujourd'hui).`}
            </div>
          </div>

          {errors.general && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/30">
              {errors.general}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => void handleSubmit()}
              disabled={submitting || formData.services.length === 0}
              className="w-full bg-[#1a3a6e] hover:bg-[#0f2044] text-white font-semibold"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{l.submitting}</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" />{l.submitBtn}</>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {l.backBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

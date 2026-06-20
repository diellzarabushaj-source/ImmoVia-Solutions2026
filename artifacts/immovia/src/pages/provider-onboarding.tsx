import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { useCreateCompany, useCreatePackageCheckout } from "@workspace/api-client-react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, ChevronLeft, User, Building2, Check, ArrowRight,
  MapPin, Phone, Tag, AlignLeft, CheckCircle2,
} from "lucide-react";

const PENDING_PLAN_KEY = "immovia_pending_plan";

type WorkerType = "individual" | "company";
type StepId = "firstName" | "lastName" | "phone" | "workerType" | "companyName" | "city" | "services" | "description";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  workerType: WorkerType | null;
  companyName: string;
  city: string;
  services: string[];
  description: string;
  suggestedCategory: string;
}

const L = {
  sq: {
    logoAlt: "ImmoVia365",
    title: "Konfiguroni Profilin Tuaj",
    subtitle: "Hap pas hapi, krijoni profilin tuaj si ofrues shërbimi.",
    q_firstName: "Cili është emri juaj?",
    q_lastName: "Cili është mbiemri juaj?",
    q_phone: "Numri juaj i telefonit?",
    q_workerType: "Si operoni?",
    q_companyName: "Emri i kompanisë suaj?",
    q_city: "Në cilën qytet bazoheni?",
    q_services: "Çfarë shërbimesh ofroni?",
    q_description: "Përshkruani shkurtimisht shërbimet tuaja.",
    individual: "Profesionist Individual",
    individualDesc: "Punoj si individ ose i vetëpunësuar",
    company: "Kompani / Firmë",
    companyDesc: "Drejtoj një kompani ose firmë",
    ph_firstName: "p.sh. Arben",
    ph_lastName: "p.sh. Hoxha",
    ph_phone: "p.sh. +41 79 123 45 67",
    ph_companyName: "p.sh. Hoxha Ndërtim Sh.p.k.",
    ph_city: "p.sh. Zürich",
    ph_description: "Ofrojmë shërbime profesionale renovimi...",
    continueBtn: "Vazhdoni",
    submitBtn: "Krijoni Profilin dhe Vazhdoni",
    submitting: "Po krijohet profili...",
    backBtn: "Kthehu",
    stepOf: (a: number, b: number) => `Hapi ${a} nga ${b}`,
    suggestCategory: "Sugjeroni një kategori të re",
    suggestPh: "Emri i kategorisë suaj",
    suggestAdd: "Shto sugjerim",
    errorRequired: "Ky fushë është e detyrueshme.",
    errorMinServices: "Zgjidhni të paktën një shërbim.",
    errorSubmit: "Ndodhi një gabim. Ju lutemi provoni përsëri.",
    selectServices: "Zgjidhni shërbimet:",
    selectedCount: (n: number) => `${n} zgjedhur`,
  },
  en: {
    logoAlt: "ImmoVia365",
    title: "Set Up Your Profile",
    subtitle: "Answer a few questions, step by step, to create your provider profile.",
    q_firstName: "What is your first name?",
    q_lastName: "What is your last name?",
    q_phone: "What is your phone number?",
    q_workerType: "How do you operate?",
    q_companyName: "What is your company name?",
    q_city: "What city are you based in?",
    q_services: "What services do you offer?",
    q_description: "Briefly describe your services.",
    individual: "Individual Professional",
    individualDesc: "I work as an individual or self-employed",
    company: "Company / Firm",
    companyDesc: "I run a company or firm",
    ph_firstName: "e.g. John",
    ph_lastName: "e.g. Smith",
    ph_phone: "e.g. +41 79 123 45 67",
    ph_companyName: "e.g. Smith Construction GmbH",
    ph_city: "e.g. Zurich",
    ph_description: "We offer professional renovation services...",
    continueBtn: "Continue",
    submitBtn: "Create Profile & Continue",
    submitting: "Creating profile...",
    backBtn: "Back",
    stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    suggestCategory: "Suggest a new category",
    suggestPh: "Your category name",
    suggestAdd: "Add suggestion",
    errorRequired: "This field is required.",
    errorMinServices: "Select at least one service.",
    errorSubmit: "An error occurred. Please try again.",
    selectServices: "Select services:",
    selectedCount: (n: number) => `${n} selected`,
  },
  de: {
    logoAlt: "ImmoVia365",
    title: "Profil einrichten",
    subtitle: "Richten Sie Schritt für Schritt Ihr Dienstleister-Profil ein.",
    q_firstName: "Wie heissen Sie mit Vornamen?",
    q_lastName: "Wie heissen Sie mit Nachnamen?",
    q_phone: "Ihre Telefonnummer?",
    q_workerType: "Wie sind Sie tätig?",
    q_companyName: "Wie heisst Ihr Unternehmen?",
    q_city: "In welcher Stadt sind Sie tätig?",
    q_services: "Welche Dienstleistungen bieten Sie an?",
    q_description: "Beschreiben Sie kurz Ihre Dienstleistungen.",
    individual: "Einzelunternehmer",
    individualDesc: "Ich bin selbstständig oder Einzelperson",
    company: "Unternehmen / Firma",
    companyDesc: "Ich leite ein Unternehmen oder eine Firma",
    ph_firstName: "z.B. Hans",
    ph_lastName: "z.B. Müller",
    ph_phone: "z.B. +41 79 123 45 67",
    ph_companyName: "z.B. Müller Bau GmbH",
    ph_city: "z.B. Zürich",
    ph_description: "Wir bieten professionelle Renovierungsleistungen an...",
    continueBtn: "Weiter",
    submitBtn: "Profil erstellen & Weiter",
    submitting: "Profil wird erstellt...",
    backBtn: "Zurück",
    stepOf: (a: number, b: number) => `Schritt ${a} von ${b}`,
    suggestCategory: "Neue Kategorie vorschlagen",
    suggestPh: "Name Ihrer Kategorie",
    suggestAdd: "Vorschlag hinzufügen",
    errorRequired: "Dieses Feld ist erforderlich.",
    errorMinServices: "Wählen Sie mindestens einen Dienst.",
    errorSubmit: "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
    selectServices: "Dienstleistungen auswählen:",
    selectedCount: (n: number) => `${n} ausgewählt`,
  },
  fr: {
    logoAlt: "ImmoVia365",
    title: "Configurer votre profil",
    subtitle: "Répondez étape par étape pour créer votre profil prestataire.",
    q_firstName: "Quel est votre prénom ?",
    q_lastName: "Quel est votre nom de famille ?",
    q_phone: "Votre numéro de téléphone ?",
    q_workerType: "Comment exercez-vous ?",
    q_companyName: "Quel est le nom de votre société ?",
    q_city: "Dans quelle ville êtes-vous basé ?",
    q_services: "Quels services proposez-vous ?",
    q_description: "Décrivez brièvement vos services.",
    individual: "Professionnel indépendant",
    individualDesc: "Je travaille en tant qu'indépendant",
    company: "Société / Entreprise",
    companyDesc: "Je dirige une société ou entreprise",
    ph_firstName: "ex. Jean",
    ph_lastName: "ex. Dupont",
    ph_phone: "ex. +41 79 123 45 67",
    ph_companyName: "ex. Dupont Construction Sàrl",
    ph_city: "ex. Zurich",
    ph_description: "Nous proposons des services professionnels de rénovation...",
    continueBtn: "Continuer",
    submitBtn: "Créer le profil & Continuer",
    submitting: "Création du profil...",
    backBtn: "Retour",
    stepOf: (a: number, b: number) => `Étape ${a} sur ${b}`,
    suggestCategory: "Suggérer une nouvelle catégorie",
    suggestPh: "Nom de votre catégorie",
    suggestAdd: "Ajouter",
    errorRequired: "Ce champ est obligatoire.",
    errorMinServices: "Sélectionnez au moins un service.",
    errorSubmit: "Une erreur s'est produite. Veuillez réessayer.",
    selectServices: "Sélectionnez des services :",
    selectedCount: (n: number) => `${n} sélectionné(s)`,
  },
};

function getSteps(workerType: WorkerType | null): StepId[] {
  const base: StepId[] = ["firstName", "lastName", "phone", "workerType"];
  if (workerType === "company") {
    return [...base, "companyName", "city", "services", "description"];
  }
  return [...base, "city", "services", "description"];
}

export default function ProviderOnboarding() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const l = L[language as keyof typeof L] ?? L.en;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "", lastName: "", phone: "", workerType: null,
    companyName: "", city: "", services: [], description: "",
    suggestedCategory: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const createCompany = useCreateCompany();
  const createPackageCheckout = useCreatePackageCheckout();
  const { categories } = useCategories("service");

  const planType = (typeof localStorage !== "undefined" ? localStorage.getItem(PENDING_PLAN_KEY) : null) ?? "basic";

  const steps = getSteps(formData.workerType);
  const totalSteps = steps.length;
  const stepId = steps[currentStep];

  useEffect(() => {
    if (!loading && (!user || !isServiceProvider(user))) {
      setLocation("/login");
    }
  }, [loading, user]);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  }, [currentStep]);

  const canAdvance = (): boolean => {
    switch (stepId) {
      case "firstName": return formData.firstName.trim().length >= 1;
      case "lastName": return formData.lastName.trim().length >= 1;
      case "phone": return formData.phone.trim().length >= 5;
      case "workerType": return formData.workerType !== null;
      case "companyName": return formData.companyName.trim().length >= 2;
      case "city": return formData.city.trim().length >= 2;
      case "services": return formData.services.length > 0;
      case "description": return formData.description.trim().length >= 5;
      default: return false;
    }
  };

  const advance = () => {
    if (!canAdvance()) {
      setError(stepId === "services" ? l.errorMinServices : l.errorRequired);
      return;
    }
    setError(null);
    const newSteps = getSteps(formData.workerType);
    if (currentStep < newSteps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      void handleSubmit();
    }
  };

  const goBack = () => {
    setError(null);
    if (currentStep > 0) setCurrentStep((p) => p - 1);
    else setLocation("/signup");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && stepId !== "description" && stepId !== "services" && stepId !== "workerType") {
      e.preventDefault();
      advance();
    }
  };

  const toggleService = (key: string) => {
    setFormData((prev) => {
      const has = prev.services.includes(key);
      return { ...prev, services: has ? prev.services.filter((s) => s !== key) : [...prev.services, key] };
    });
    setError(null);
  };

  const addSuggestedCategory = () => {
    const val = formData.suggestedCategory.trim();
    if (!val) return;
    const key = `_suggested:${val}`;
    if (!formData.services.includes(key)) {
      setFormData((prev) => ({ ...prev, services: [...prev.services, key], suggestedCategory: "" }));
    }
    setShowSuggest(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const contactName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const companyName =
        formData.workerType === "company"
          ? formData.companyName.trim()
          : contactName;

      const regularServices = formData.services.filter((s) => !s.startsWith("_suggested:"));
      const suggestedTags = formData.services
        .filter((s) => s.startsWith("_suggested:"))
        .map((s) => s.replace("_suggested:", ""));

      const company = await createCompany.mutateAsync({
        data: {
          companyName,
          contactName,
          email: user?.email ?? "",
          phone: formData.phone.trim(),
          serviceTypes: regularServices.length > 0 ? regularServices : ["other"],
          customServiceTags: suggestedTags.length > 0 ? suggestedTags : undefined,
          city: formData.city.trim(),
          description: formData.description.trim(),
          workerType: formData.workerType ?? "individual",
          planType,
        },
      });

      localStorage.removeItem(PENDING_PLAN_KEY);

      const checkout = await createPackageCheckout.mutateAsync({
        id: company.id,
        data: { email: user?.email ?? "", planType },
      });

      if (checkout.url) {
        window.location.href = checkout.url;
      } else {
        setLocation("/provider");
      }
    } catch {
      setError(l.errorSubmit);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStepList = getSteps(formData.workerType);
  const progressPct = totalSteps > 0 ? Math.round(((currentStep) / totalSteps) * 100) : 0;

  const stepIcon: Record<StepId, React.ReactNode> = {
    firstName: <User className="w-5 h-5" />,
    lastName: <User className="w-5 h-5" />,
    phone: <Phone className="w-5 h-5" />,
    workerType: <Building2 className="w-5 h-5" />,
    companyName: <Building2 className="w-5 h-5" />,
    city: <MapPin className="w-5 h-5" />,
    services: <Tag className="w-5 h-5" />,
    description: <AlignLeft className="w-5 h-5" />,
  };

  const qLabel: Record<StepId, string> = {
    firstName: l.q_firstName,
    lastName: l.q_lastName,
    phone: l.q_phone,
    workerType: l.q_workerType,
    companyName: l.q_companyName,
    city: l.q_city,
    services: l.q_services,
    description: l.q_description,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      <div className="container mx-auto px-4 py-10 max-w-xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo-color.png" alt={l.logoAlt} className="h-12 w-auto object-contain" decoding="async" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">{l.title}</h1>
          <p className="text-sm text-muted-foreground">{l.subtitle}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{l.stepOf(currentStep + 1, currentStepList.length)}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Completed steps as bubbles */}
        {currentStep > 0 && (
          <div className="space-y-2 mb-6">
            {currentStepList.slice(0, currentStep).map((sid, idx) => {
              let val = "";
              if (sid === "firstName") val = formData.firstName;
              else if (sid === "lastName") val = formData.lastName;
              else if (sid === "phone") val = formData.phone;
              else if (sid === "workerType") val = formData.workerType === "individual" ? l.individual : l.company;
              else if (sid === "companyName") val = formData.companyName;
              else if (sid === "city") val = formData.city;
              else if (sid === "services") val = l.selectedCount(formData.services.length);
              else if (sid === "description") val = formData.description.slice(0, 60) + (formData.description.length > 60 ? "…" : "");
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-primary/70 font-medium uppercase tracking-wide leading-none mb-0.5">{qLabel[sid]}</div>
                    <div className="text-sm font-semibold text-foreground truncate">{val}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current step card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          {/* Step icon + question */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {stepIcon[stepId]}
            </div>
            <h2 className="text-xl font-bold leading-tight">{qLabel[stepId]}</h2>
          </div>

          {/* Input area */}
          {stepId === "workerType" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["individual", "company"] as WorkerType[]).map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => { setFormData((p) => ({ ...p, workerType: wt })); setError(null); }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    formData.workerType === wt
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      formData.workerType === wt ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {wt === "individual" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{wt === "individual" ? l.individual : l.company}</div>
                      <div className="text-xs text-muted-foreground">{wt === "individual" ? l.individualDesc : l.companyDesc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {stepId === "services" && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">{l.selectServices}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isSelected = formData.services.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => toggleService(cat.key)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary" : "bg-muted"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
                {formData.services
                  .filter((s) => s.startsWith("_suggested:"))
                  .map((s) => {
                    const val = s.replace("_suggested:", "");
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-primary bg-primary/5 text-primary font-medium text-left text-sm"
                      >
                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="truncate">{val} *</span>
                      </button>
                    );
                  })}
              </div>

              {/* Suggest category */}
              <div className="mt-3 border-t pt-3">
                {!showSuggest ? (
                  <button
                    type="button"
                    onClick={() => setShowSuggest(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    + {l.suggestCategory}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      className="text-sm h-8"
                      placeholder={l.suggestPh}
                      value={formData.suggestedCategory}
                      onChange={(e) => setFormData((p) => ({ ...p, suggestedCategory: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSuggestedCategory(); } }}
                    />
                    <Button size="sm" variant="outline" onClick={addSuggestedCategory}>{l.suggestAdd}</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {stepId === "description" && (
            <Textarea
              ref={(el) => { inputRef.current = el; }}
              rows={4}
              placeholder={l.ph_description}
              value={formData.description}
              onChange={(e) => { setFormData((p) => ({ ...p, description: e.target.value })); setError(null); }}
              className="resize-none"
            />
          )}

          {(stepId === "firstName" ||
            stepId === "lastName" ||
            stepId === "phone" ||
            stepId === "companyName" ||
            stepId === "city") && (
            <Input
              ref={(el) => { inputRef.current = el; }}
              type={stepId === "phone" ? "tel" : "text"}
              placeholder={
                stepId === "firstName" ? l.ph_firstName :
                stepId === "lastName" ? l.ph_lastName :
                stepId === "phone" ? l.ph_phone :
                stepId === "companyName" ? l.ph_companyName :
                l.ph_city
              }
              value={
                stepId === "firstName" ? formData.firstName :
                stepId === "lastName" ? formData.lastName :
                stepId === "phone" ? formData.phone :
                stepId === "companyName" ? formData.companyName :
                formData.city
              }
              onChange={(e) => {
                const val = e.target.value;
                setFormData((p) => ({
                  ...p,
                  [stepId]: val,
                }));
                setError(null);
              }}
              onKeyDown={handleKeyDown}
            />
          )}

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-none"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {l.backBtn}
            </Button>

            {currentStep < currentStepList.length - 1 ? (
              <Button type="button" onClick={advance} className="flex-1 font-semibold">
                {l.continueBtn}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !canAdvance()}
                className="flex-1 font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {l.submitting}
                  </>
                ) : (
                  <>
                    {l.submitBtn}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

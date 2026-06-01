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

type AccountType = "project_poster" | "service_provider";
type AccountSubtype = "individual" | "company";

export default function Signup() {
  const { isSignedIn, isLoaded } = useUser();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [accountSubtype, setAccountSubtype] = useState<AccountSubtype | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const o = t.onboarding;

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) setLocation("/dashboard");
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const preselected = params.get("account_type") as AccountType | null;
    if (preselected === "project_poster" || preselected === "service_provider") {
      setAccountType(preselected);
      setStep(2);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setAccountSubtype(null);
    setStep(2);
  };

  const handleSubtypeSelect = (subtype: AccountSubtype) => {
    setAccountSubtype(subtype);
    setStep(3);
  };

  const handleConfirm = () => {
    if (!accountType || !accountSubtype) return;
    setPendingSignup({ accountType, accountSubtype, language });
    window.location.href = `${basePath}/sign-up`;
  };

  // ── Combined label helpers ────────────────────────────────────────────────

  const getCombinedLabel = (): string => {
    if (accountType === "project_poster" && accountSubtype === "individual") return o.labelIndividualPoster;
    if (accountType === "project_poster" && accountSubtype === "company")    return o.labelCompanyPoster;
    if (accountType === "service_provider" && accountSubtype === "individual") return o.labelIndividualProvider;
    return o.labelCompanyProvider;
  };

  const getCombinedMeaning = (): string => {
    if (accountType === "project_poster" && accountSubtype === "individual") return o.meaningIndividualPoster;
    if (accountType === "project_poster" && accountSubtype === "company")    return o.meaningCompanyPoster;
    if (accountType === "service_provider" && accountSubtype === "individual") return o.meaningIndividualProvider;
    return o.meaningCompanyProvider;
  };

  const stepLabel = step === 1 ? o.step1of3 : step === 2 ? o.step2of3 : o.step3of3;

  // ── Progress bar ─────────────────────────────────────────────────────────

  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {([1, 2, 3] as const).map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s < step
                ? "bg-primary text-white"
                : s === step
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
          </div>
          {s < 3 && (
            <div className={`w-10 h-0.5 transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />
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
          {stepLabel}
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

  // ── STEP 1: Account type ──────────────────────────────────────────────────

  if (step === 1) {
    return (
      <Shell>
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{o.title}</h1>
        <p className="text-center text-muted-foreground mb-8">{o.step1Question}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project Poster */}
          <button
            type="button"
            onClick={() => handleAccountTypeSelect("project_poster")}
            className={`text-left p-7 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountType === "project_poster"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
            data-testid="select-account-type-project_poster"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
              {o.posterLabel}
            </div>
            <h3 className="text-xl font-bold mb-2">{o.posterTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{o.posterDesc}</p>
          </button>

          {/* Service Provider */}
          <button
            type="button"
            onClick={() => handleAccountTypeSelect("service_provider")}
            className={`text-left p-7 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountType === "service_provider"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
            data-testid="select-account-type-service_provider"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
              {o.providerLabel}
            </div>
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

    return (
      <Shell maxW="max-w-xl">
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
          {/* Individual */}
          <button
            type="button"
            onClick={() => handleSubtypeSelect("individual")}
            className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountSubtype === "individual"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
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

          {/* Company */}
          <button
            type="button"
            onClick={() => handleSubtypeSelect("company")}
            className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-md group ${
              accountSubtype === "company"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
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

  const combinedLabel   = getCombinedLabel();
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

      {/* Summary card */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-7 mb-6">
        <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-3">
          {o.yourSelection}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            {isProjectPoster
              ? <Briefcase className="w-7 h-7 text-white" />
              : <Building2 className="w-7 h-7 text-white" />
            }
          </div>
          <div>
            <div className="text-xl font-bold leading-tight">{combinedLabel}</div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-muted-foreground bg-white/60 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span className="leading-relaxed">{combinedMeaning}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={() => setStep(2)}
          data-testid="confirm-back"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> {o.backBtn}
        </Button>
        <Button
          className="flex-1 font-semibold"
          onClick={handleConfirm}
          data-testid="confirm-and-continue"
        >
          {o.confirmBtn} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Shell>
  );
}

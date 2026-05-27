import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { setPendingSignup } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Briefcase, User, Building2, ChevronLeft } from "lucide-react";

type AccountType = "project_poster" | "service_provider";
type AccountSubtype = "individual" | "company";

export default function Signup() {
  const { isSignedIn, isLoaded } = useUser();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) setLocation("/dashboard");
  }, [isLoaded, isSignedIn]);

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
  };

  const handleSubtypeSelect = (subtype: AccountSubtype) => {
    setPendingSignup({ accountType: accountType!, accountSubtype: subtype, language });
    window.location.href = `${basePath}/sign-up`;
  };

  const accountTypeLabel = (type: AccountType) =>
    type === "project_poster" ? "Project Poster" : "Service Provider";

  const subtypeLabel = (sub: AccountSubtype) =>
    sub === "individual" ? "Individual" : "Company";

  const fullLabel = (type: AccountType, sub: AccountSubtype) =>
    `${sub === "individual" ? "Individual" : "Company"} ${type === "project_poster" ? "Project Poster" : "Service Provider"}`;

  // ── Step 1: Account type ───────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <img src="/logo-color.png" alt="ImmoVia" className="h-16 md:h-20 w-auto object-contain" decoding="async" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">Create an Account</h1>
          <p className="text-muted-foreground">What do you want to do?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Project Poster */}
          <button
            type="button"
            onClick={() => handleAccountTypeSelect("project_poster")}
            className="text-left p-8 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:shadow-lg group"
            data-testid="role-client"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Project Poster</div>
            <h3 className="text-xl font-bold mb-2">I need work done</h3>
            <p className="text-sm text-muted-foreground">Post a project and receive applications from individuals or companies.</p>
          </button>

          {/* Service Provider */}
          <button
            type="button"
            onClick={() => handleAccountTypeSelect("service_provider")}
            className="text-left p-8 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:shadow-lg group"
            data-testid="role-provider"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Service Provider</div>
            <h3 className="text-xl font-bold mb-2">I want to offer my services</h3>
            <p className="text-sm text-muted-foreground">Create your profile, browse open projects, and apply for work.</p>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    );
  }

  // ── Step 2: Individual or Company ──────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-5">
          <img src="/logo-color.png" alt="ImmoVia" className="h-16 md:h-20 w-auto object-contain" decoding="async" />
        </div>
        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          {accountTypeLabel(accountType!)}
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">Are you an individual or a company?</h1>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mx-auto"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {(["individual", "company"] as AccountSubtype[]).map((sub) => (
          <button
            key={sub}
            type="button"
            onClick={() => handleSubtypeSelect(sub)}
            className="text-left p-6 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:shadow-lg group"
            data-testid={`subtype-${sub}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {sub === "individual"
                  ? <User className="w-5 h-5 text-primary" />
                  : <Building2 className="w-5 h-5 text-primary" />
                }
              </div>
              <div>
                <div className="text-xs text-primary font-semibold uppercase tracking-wide">
                  {fullLabel(accountType!, sub)}
                </div>
                <div className="font-bold text-lg">{subtypeLabel(sub)}</div>
                <div className="text-sm text-muted-foreground">
                  {sub === "individual"
                    ? "Registering as a single person"
                    : "Registering as a business or organization"
                  }
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { setPendingSignup, type ProviderType } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Home, Building2, User, Users } from "lucide-react";

export default function Signup() {
  const { isSignedIn, isLoaded } = useUser();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"client" | "service_provider" | null>(null);
  const [providerType, setProviderType] = useState<ProviderType>("individual");

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) setLocation("/dashboard");
  }, [isLoaded, isSignedIn]);

  const handleRoleSelect = (selectedRole: "client" | "service_provider") => {
    if (selectedRole === "client") {
      setPendingSignup({ role: selectedRole, language });
      window.location.href = `${basePath}/sign-up`;
    } else {
      setRole(selectedRole);
    }
  };

  const handleProviderContinue = () => {
    setPendingSignup({ role: "service_provider", providerType, language });
    window.location.href = `${basePath}/sign-up`;
  };

  // Role selection screen
  if (!role) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <img
              src="/logo-color.png"
              alt="ImmoVia"
              className="h-16 md:h-20 w-auto object-contain"
              decoding="async"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">{t.auth.signupTitle}</h1>
          <p className="text-muted-foreground">{t.auth.chooseRole}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => handleRoleSelect("client")}
            className="text-left p-8 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:shadow-lg group"
            data-testid="role-client"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t.auth.roleHomeowner}</h3>
            <p className="text-sm text-muted-foreground">{t.auth.roleHomeownerDesc}</p>
          </button>
          <button
            type="button"
            onClick={() => setRole("service_provider")}
            className="text-left p-8 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:shadow-lg group"
            data-testid="role-provider"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t.auth.roleContractor}</h3>
            <p className="text-sm text-muted-foreground">{t.auth.roleContractorDesc}</p>
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            {t.auth.loginLink}
          </Link>
        </p>
      </div>
    );
  }

  // Provider type selection screen
  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-5">
          <img
            src="/logo-color.png"
            alt="ImmoVia"
            className="h-16 md:h-20 w-auto object-contain"
            decoding="async"
          />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">{t.auth.signupContractor}</h1>
        <button
          type="button"
          onClick={() => setRole(null)}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          &larr; {t.auth.changeRole}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6">
        <div>
          <p className="font-medium text-foreground mb-3">{t.auth.providerType}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["individual", "small_team", "company"] as ProviderType[]).map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setProviderType(pt)}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  providerType === pt ? "border-primary bg-primary/5" : "border-border"
                }`}
                data-testid={`provider-type-${pt}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {pt === "individual" && <User className="w-4 h-4 text-primary" />}
                  {pt === "small_team" && <Users className="w-4 h-4 text-primary" />}
                  {pt === "company" && <Building2 className="w-4 h-4 text-primary" />}
                </div>
                <div className="text-xs font-semibold">
                  {pt === "individual" && t.auth.providerTypeIndividual}
                  {pt === "small_team" && t.auth.providerTypeSmallTeam}
                  {pt === "company" && t.auth.providerTypeCompany}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleProviderContinue}
          data-testid="button-signup"
        >
          {t.auth.createAccount}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            {t.auth.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}

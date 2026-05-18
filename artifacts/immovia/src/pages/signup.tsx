import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, type ProviderType } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Home, Building2, Loader2, User, Users } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"client" | "service_provider" | null>(null);
  const [providerType, setProviderType] = useState<ProviderType>("individual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    city: "",
    companyName: "",
    serviceTypes: "",
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);
    try {
      await signup({
        email: form.email,
        password: form.password,
        role,
        providerType: role === "service_provider" ? providerType : undefined,
        fullName: form.fullName,
        phone: form.phone || undefined,
        city: form.city || undefined,
        language,
        companyName: role === "service_provider" ? form.companyName : undefined,
        serviceTypes:
          role === "service_provider" && form.serviceTypes
            ? form.serviceTypes.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
      });
      setLocation(role === "service_provider" ? "/provider" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">{t.auth.signupTitle}</h1>
          <p className="text-muted-foreground">{t.auth.chooseRole}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setRole("client")}
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

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">
          {role === "service_provider" ? t.auth.signupContractor : t.auth.signupHomeowner}
        </h1>
        <button
          type="button"
          onClick={() => setRole(null)}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← {t.auth.changeRole}
        </button>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">{t.auth.fullName}</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={update("fullName")}
              required
              minLength={2}
              data-testid="input-fullname"
            />
          </div>

          {role === "service_provider" && (
            <>
              <div>
                <Label className="mb-2 block">{t.auth.providerType}</Label>
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
              <div>
                <Label htmlFor="companyName">{t.auth.companyName}</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={update("companyName")}
                  required={providerType === "company"}
                  data-testid="input-company"
                />
              </div>
              <div>
                <Label htmlFor="serviceTypes">{t.auth.serviceTypes}</Label>
                <Textarea
                  id="serviceTypes"
                  value={form.serviceTypes}
                  onChange={update("serviceTypes")}
                  placeholder={t.auth.serviceTypesPlaceholder}
                  rows={2}
                  data-testid="input-services"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              required
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={update("password")}
              required
              minLength={6}
              data-testid="input-password"
            />
            <p className="text-xs text-muted-foreground mt-1">{t.auth.passwordHint}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">{t.auth.phone}</Label>
              <Input id="phone" value={form.phone} onChange={update("phone")} data-testid="input-phone" />
            </div>
            <div>
              <Label htmlFor="city">{t.auth.city}</Label>
              <Input id="city" value={form.city} onChange={update("city")} data-testid="input-city" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="signup-error">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.auth.createAccount}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t.auth.haveAccount}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {t.auth.loginLink}
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

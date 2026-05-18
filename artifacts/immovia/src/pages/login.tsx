import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateError = (msg: string): string => {
    if (msg.includes("unavailable") || msg.includes("unexpected error") || msg.includes("ENOTFOUND")) return t.auth.serverUnavailable;
    if (msg.includes("Invalid credentials") || msg.includes("invalid credentials")) return t.auth.invalidCredentials;
    if (msg.includes("already registered") || msg.includes("already exists")) return t.auth.emailTaken;
    return t.auth.authError;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-5">
          <img
            src="/logo-color.png"
            alt="ImmoVia"
            className="h-16 md:h-20 w-auto object-contain"
            decoding="async"
          />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">{t.auth.loginTitle}</h1>
        <p className="text-muted-foreground text-sm">{t.auth.loginSubtitle}</p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.auth.loginButton}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              {t.auth.signupLink}
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PENDING_PLAN_KEY = "immovia_pending_plan";
const SP_WORKER_TYPE_KEY = "immovia_sp_worker_type";
const SP_FIRST_NAME_KEY = "immovia_sp_first_name";
const SP_LAST_NAME_KEY = "immovia_sp_last_name";
const SP_COMPANY_NAME_KEY = "immovia_sp_company_name";
const SP_PHONE_KEY = "immovia_sp_phone";
const SP_CITY_KEY = "immovia_sp_city";

function clearSpStorage() {
  localStorage.removeItem(PENDING_PLAN_KEY);
  localStorage.removeItem(SP_WORKER_TYPE_KEY);
  localStorage.removeItem(SP_FIRST_NAME_KEY);
  localStorage.removeItem(SP_LAST_NAME_KEY);
  localStorage.removeItem(SP_COMPANY_NAME_KEY);
  localStorage.removeItem(SP_PHONE_KEY);
  localStorage.removeItem(SP_CITY_KEY);
}

type Status =
  | "waiting_auth"
  | "checking_profile"
  | "creating_company"
  | "creating_checkout"
  | "redirecting"
  | "error";

const STATUS_LABELS: Record<string, Record<Status, string>> = {
  de: {
    waiting_auth: "Konto wird verifiziert…",
    checking_profile: "Profil wird geprüft…",
    creating_company: "Profil wird erstellt…",
    creating_checkout: "Zahlung wird vorbereitet…",
    redirecting: "Weiterleitung zu Stripe…",
    error: "Ein Fehler ist aufgetreten.",
  },
  en: {
    waiting_auth: "Verifying account…",
    checking_profile: "Checking profile…",
    creating_company: "Creating profile…",
    creating_checkout: "Preparing payment…",
    redirecting: "Redirecting to Stripe…",
    error: "An error occurred.",
  },
  sq: {
    waiting_auth: "Duke verifikuar llogarinë…",
    checking_profile: "Duke kontrolluar profilin…",
    creating_company: "Duke krijuar profilin…",
    creating_checkout: "Duke përgatitur pagesën…",
    redirecting: "Duke ridrejtuar te Stripe…",
    error: "Ndodhi një gabim.",
  },
  fr: {
    waiting_auth: "Vérification du compte…",
    checking_profile: "Vérification du profil…",
    creating_company: "Création du profil…",
    creating_checkout: "Préparation du paiement…",
    redirecting: "Redirection vers Stripe…",
    error: "Une erreur s'est produite.",
  },
};

export default function SignupComplete() {
  const [, setLocation] = useLocation();
  const { user, isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<Status>("waiting_auth");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const lang = (typeof localStorage !== "undefined"
    ? localStorage.getItem("immovia_lang") ?? "de"
    : "de") as keyof typeof STATUS_LABELS;
  const labels = STATUS_LABELS[lang] ?? STATUS_LABELS.de;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setLocation("/login");
      return;
    }

    const pendingPlan = localStorage.getItem(PENDING_PLAN_KEY);

    // No pending plan → not a SP registration → go to appropriate dashboard
    if (!pendingPlan) {
      setLocation("/provider");
      return;
    }

    void runSpFlow();
  }, [isLoaded, isSignedIn, user, retryCount]);

  const runSpFlow = async () => {
    setErrorMsg(null);

    try {
      const planType = localStorage.getItem(PENDING_PLAN_KEY) ?? "basic";
      const workerType = localStorage.getItem(SP_WORKER_TYPE_KEY) ?? "individual";
      const firstName = localStorage.getItem(SP_FIRST_NAME_KEY) ?? "";
      const lastName = localStorage.getItem(SP_LAST_NAME_KEY) ?? "";
      const companyNameStored = localStorage.getItem(SP_COMPANY_NAME_KEY) ?? "";
      const phone = localStorage.getItem(SP_PHONE_KEY) ?? "";
      const city = localStorage.getItem(SP_CITY_KEY) ?? "";

      const email = user?.primaryEmailAddress?.emailAddress ?? "";

      // ── 1. Check existing profile ─────────────────────────────────────────
      setStatus("checking_profile");
      const profileResp = await fetch("/api/provider/profile");
      if (!profileResp.ok && profileResp.status !== 401 && profileResp.status !== 404) {
        throw new Error(`profile_check_failed_${profileResp.status}`);
      }

      let companyId: number | null = null;
      let packageAlreadyPaid = false;

      if (profileResp.ok) {
        const profile = await profileResp.json() as {
          company?: { id: number; packagePaid?: boolean | null } | null;
        };
        if (profile.company) {
          companyId = profile.company.id;
          packageAlreadyPaid = !!profile.company.packagePaid;
        }
      }

      // ── 2. Already fully paid → go to dashboard ───────────────────────────
      if (packageAlreadyPaid) {
        clearSpStorage();
        setLocation("/provider");
        return;
      }

      // ── 3. Create company if it doesn't exist yet ─────────────────────────
      if (!companyId) {
        setStatus("creating_company");

        const displayName = workerType === "company"
          ? companyNameStored
          : `${firstName} ${lastName}`.trim();
        const companyName = workerType === "company" ? companyNameStored : displayName;
        const contactName = displayName || companyName;

        const createResp = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: companyName || contactName,
            contactName,
            email,
            phone: phone || "+41",
            serviceTypes: ["other"],
            city: city || "Zürich",
            workerType,
            planType,
          }),
        });

        if (!createResp.ok) {
          const errText = await createResp.text();
          throw new Error(`create_company_failed: ${errText}`);
        }

        const company = await createResp.json() as { id: number };
        companyId = company.id;
      }

      // ── 4. Create Stripe package checkout ────────────────────────────────
      setStatus("creating_checkout");
      const checkoutResp = await fetch(`/api/companies/${companyId}/package-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planType }),
      });

      if (!checkoutResp.ok) {
        const errText = await checkoutResp.text();
        throw new Error(`create_checkout_failed: ${errText}`);
      }

      const checkout = await checkoutResp.json() as { url?: string };

      // ── 5. Redirect to Stripe ─────────────────────────────────────────────
      setStatus("redirecting");
      clearSpStorage();

      if (checkout.url) {
        window.location.href = checkout.url;
      } else {
        // Fallback: go to provider dashboard (payment may have been created)
        setLocation("/provider");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("error");
      setErrorMsg(msg);
    }
  };

  if (status === "error") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold mb-2">
            {labels.error}
          </h2>
          {errorMsg && (
            <p className="text-xs text-muted-foreground mb-5 font-mono bg-slate-100 rounded p-2 text-left break-all">
              {errorMsg}
            </p>
          )}
          <Button
            onClick={() => {
              setStatus("waiting_auth");
              setRetryCount((c) => c + 1);
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === "de" ? "Erneut versuchen" :
             lang === "sq" ? "Provo Përsëri" :
             lang === "fr" ? "Réessayer" :
             "Retry"}
          </Button>
          <button
            type="button"
            className="block mt-3 text-sm text-muted-foreground hover:text-primary mx-auto"
            onClick={() => {
              clearSpStorage();
              setLocation("/provider-onboarding");
            }}
          >
            {lang === "de" ? "Manuell fortfahren" :
             lang === "sq" ? "Vazhdo manualisht" :
             lang === "fr" ? "Continuer manuellement" :
             "Continue manually"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="flex justify-center mb-2">
        <img src="/logo-color.png" alt="ImmoVia365" className="h-12 w-auto object-contain" decoding="async" />
      </div>
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground animate-pulse">{labels[status]}</p>
    </div>
  );
}

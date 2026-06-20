import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const PENDING_PLAN_KEY = "immovia_pending_plan";

export default function SignupComplete() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const pendingPlan = localStorage.getItem(PENDING_PLAN_KEY);
    if (pendingPlan) {
      setLocation("/provider-onboarding");
    } else {
      setLocation("/provider");
    }
  }, [setLocation]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

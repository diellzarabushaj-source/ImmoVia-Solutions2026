import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import ClientDashboard from "./client-dashboard";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "admin") setLocation("/admin");
    else if (isServiceProvider(user)) setLocation("/provider");
  }, [user, loading, setLocation]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Project Posters (and unknown) go to client dashboard
  return <ClientDashboard />;
}

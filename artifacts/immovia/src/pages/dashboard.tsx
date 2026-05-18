import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, normalizeRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import ClientDashboard from "./client-dashboard";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    const role = normalizeRole(user.role);
    if (role === "service_provider") setLocation("/provider");
    else if (role === "admin") setLocation("/admin");
  }, [user, loading, setLocation]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = normalizeRole(user.role);
  if (role === "client") return <ClientDashboard />;
  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

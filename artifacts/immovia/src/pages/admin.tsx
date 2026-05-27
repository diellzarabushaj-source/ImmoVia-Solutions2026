import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@clerk/react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Hammer,
  Building2,
  Clock,
  Users,
  FileText,
  Tag,
  Flag,
  Settings,
  LogOut,
  Shield,
  Eye,
  Loader2,
  ChevronRight,
  ShieldOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { AdminOverview } from "./admin/overview";
import { AdminProjects } from "./admin/projects";
import { AdminCompanies } from "./admin/companies";
import { AdminPending } from "./admin/pending";
import { AdminUsers } from "./admin/users";
import { AdminApplications } from "./admin/applications";
import { AdminCategories } from "./admin/categories";
import { AdminReports } from "./admin/reports";
import { AdminSettings } from "./admin/settings";

// ─── Nav Config ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { path: "/admin/projects", label: "Projects", icon: Hammer },
  { path: "/admin/companies", label: "Companies", icon: Building2 },
  { path: "/admin/pending", label: "Pending Review", icon: Clock, badge: true },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/applications", label: "Applications", icon: FileText },
  { path: "/admin/categories", label: "Categories", icon: Tag },
  { path: "/admin/reports", label: "Reports", icon: Flag, badge: true },
  { path: "/admin/settings", label: "Settings", icon: Settings },
] as const;

// ─── Pending Badges ───────────────────────────────────────────────────────────

function usePendingCounts() {
  const [pendingTotal, setPendingTotal] = useState(0);
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects?status=pending", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/companies?status=pending", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([projects, companies]) => {
        setPendingTotal(
          (Array.isArray(projects) ? projects.length : 0) +
          (Array.isArray(companies) ? companies.length : 0)
        );
      })
      .catch(() => {});

    fetch("/api/admin/reports", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d: { status: string }[]) => setOpenReports(d.filter((r) => r.status === "open").length))
      .catch(() => {});
  }, []);

  return { pendingTotal, openReports };
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const [location] = useLocation();
  const { pendingTotal, openReports } = usePendingCounts();

  const getBadgeCount = (path: string) => {
    if (path === "/admin/pending") return pendingTotal;
    if (path === "/admin/reports") return openReports;
    return 0;
  };

  return (
    <aside className="w-64 min-w-[256px] bg-[#0f2044] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">ImmoVia</div>
          <div className="text-white/50 text-xs">Admin Console</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = "exact" in item && item.exact
            ? location === item.path
            : location === item.path || location.startsWith(item.path + "/");
          const badge = "badge" in item ? getBadgeCount(item.path) : 0;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-bold px-1 ${isActive ? "bg-white text-[#0f2044]" : "bg-[#e85d26] text-white"}`}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider + breadcrumb to site */}
      <div className="px-2 py-2">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer">
          <Eye className="h-3.5 w-3.5" /> View public site
        </Link>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function AdminShell({ onLogout }: { onLogout: () => void }) {
  usePageMeta({ title: "Admin — ImmoVia", noindex: true });
  const [location] = useLocation();

  const renderContent = () => {
    if (location === "/admin") return <AdminOverview />;
    if (location.startsWith("/admin/projects")) return <AdminProjects />;
    if (location.startsWith("/admin/companies")) return <AdminCompanies />;
    if (location.startsWith("/admin/pending")) return <AdminPending />;
    if (location.startsWith("/admin/users")) return <AdminUsers />;
    if (location.startsWith("/admin/applications")) return <AdminApplications />;
    if (location.startsWith("/admin/categories")) return <AdminCategories />;
    if (location.startsWith("/admin/reports")) return <AdminReports />;
    if (location.startsWith("/admin/settings")) return <AdminSettings />;
    return <AdminOverview />;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar onLogout={onLogout} />
      <main className="flex-1 min-w-0 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2044] to-[#1a3a6e] px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <ShieldOff className="h-8 w-8 text-white/70" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/60 text-sm mb-6">
          You do not have admin permissions to access this area.
        </p>
        <div className="flex flex-col gap-2 items-center">
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Return to site
            </Button>
          </Link>
          <button
            onClick={onLogout}
            className="text-xs text-white/40 hover:text-white/70 mt-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const auth = useAuth();

  // Redirect to sign-in if not authenticated with Clerk
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      window.location.href = `${basePath}/sign-in`;
    }
  }, [isLoaded, isSignedIn]);

  // Loading: waiting for Clerk or DB sync
  if (!isLoaded || auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2044]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  // Not signed into Clerk
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2044]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  // Signed in but not admin
  if (auth.user?.role !== "admin") {
    return <AccessDenied onLogout={auth.logout} />;
  }

  return <AdminShell onLogout={auth.logout} />;
}

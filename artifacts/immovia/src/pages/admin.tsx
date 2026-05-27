import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  EyeOff,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { AdminOverview } from "./admin/overview";
import { AdminProjects } from "./admin/projects";
import { AdminCompanies } from "./admin/companies";
import { AdminPending } from "./admin/pending";
import { AdminUsers } from "./admin/users";
import { AdminApplications } from "./admin/applications";
import { AdminCategories } from "./admin/categories";
import { AdminReports } from "./admin/reports";
import { AdminSettings } from "./admin/settings";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthState = "loading" | "authenticated" | "unauthenticated";

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

// ─── Login Form ───────────────────────────────────────────────────────────────

function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Invalid credentials.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2044] to-[#1a3a6e] px-4">
      <Card className="w-full max-w-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a6e]">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">ImmoVia Admin</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Restricted access</p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#1a3a6e] hover:bg-[#0f2044]"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
              ) : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pending Badges ───────────────────────────────────────────────────────────

function usePendingCounts() {
  const [pendingProjects, setPendingProjects] = useState(0);
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => {
    fetch("/api/projects?status=pending", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d: unknown[]) => setPendingProjects(d.length))
      .catch(() => {});

    fetch("/api/admin/reports", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d: { status: string }[]) => setOpenReports(d.filter((r) => r.status === "open").length))
      .catch(() => {});
  }, []);

  return { pendingProjects, openReports };
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const [location] = useLocation();
  const { pendingProjects, openReports } = usePendingCounts();

  const getBadgeCount = (path: string) => {
    if (path === "/admin/pending") return pendingProjects;
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

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    fetch("/api/admin-auth/verify", { credentials: "include" })
      .then((r) => { setAuthState(r.ok ? "authenticated" : "unauthenticated"); })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2044]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <AdminLoginForm onSuccess={() => setAuthState("authenticated")} />;
  }

  return <AdminShell onLogout={() => setAuthState("unauthenticated")} />;
}

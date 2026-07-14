import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  Hammer,
  Building2,
  Clock,
  Users,
  Tag,
  Flag,
  Settings,
  LogOut,
  Shield,
  Eye,
  Loader2,
  ChevronRight,
  ShieldOff,
  Star,
} from "lucide-react";

import { AdminOverview } from "./admin/overview";
import { AdminProjects } from "./admin/projects";
import { AdminCompanies } from "./admin/companies";
import { AdminPending } from "./admin/pending";
import { AdminUsers } from "./admin/users";
import { AdminApplications } from "./admin/applications";
import { AdminCategories } from "./admin/categories";
import { AdminReports } from "./admin/reports";
import { AdminReviews } from "./admin/reviews";
import { AdminSettings } from "./admin/settings";

type AuthState = "loading" | "authenticated" | "unauthenticated" | "forbidden";

type NavItem = {
  path: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: boolean;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

function buildNavGroups(t: ReturnType<typeof useLanguage>["t"]): NavGroup[] {
  return [
    {
      group: "",
      items: [
        {
          path: "/admin",
          label: t.admin.navOverview,
          sublabel: t.admin.navOverviewSub,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          path: "/admin/pending",
          label: t.admin.navPending,
          sublabel: t.admin.navPendingSub,
          icon: Clock,
          badge: true,
        },
      ],
    },
    {
      group: t.admin.groupMarketplace,
      items: [
        {
          path: "/admin/projects",
          label: t.admin.navProjects,
          sublabel: t.admin.navProjectsSub,
          icon: Hammer,
        },
        {
          path: "/admin/companies",
          label: t.admin.navCompanies,
          sublabel: t.admin.navCompaniesSub,
          icon: Building2,
        },
      ],
    },
    {
      group: t.admin.groupAccounts,
      items: [
        {
          path: "/admin/users",
          label: t.admin.navUsers,
          sublabel: t.admin.navUsersSub,
          icon: Users,
        },
      ],
    },
    {
      group: t.admin.groupSystem,
      items: [
        {
          path: "/admin/categories",
          label: t.admin.navCategories,
          sublabel: t.admin.navCategoriesSub,
          icon: Tag,
        },
        {
          path: "/admin/reports",
          label: t.admin.navReports,
          sublabel: t.admin.navReportsSub,
          icon: Flag,
          badge: true,
        },
        {
          path: "/admin/reviews",
          label: t.admin.navReviews,
          sublabel: t.admin.navReviewsSub,
          icon: Star,
        },
        {
          path: "/admin/settings",
          label: t.admin.navSettings,
          sublabel: t.admin.navSettingsSub,
          icon: Settings,
        },
      ],
    },
  ];
}

function AdminAccessCard({
  state,
  onSignIn,
  onSignOut,
}: {
  state: "unauthenticated" | "forbidden";
  onSignIn: () => void;
  onSignOut: () => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const forbidden = state === "forbidden";
  const Icon = forbidden ? ShieldOff : Shield;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2044] to-[#1a3a6e] px-4">
      <Card className="w-full max-w-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a6e]">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            {forbidden ? "Administrator access required" : t.admin.loginTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {forbidden
              ? "This Clerk account is signed in, but it is not authorized for the admin dashboard."
              : t.admin.loginRestricted}
          </p>
        </CardHeader>
        <CardContent className="pb-8 space-y-3">
          <Button
            type="button"
            className="w-full bg-[#1a3a6e] hover:bg-[#0f2044]"
            onClick={forbidden ? onSignOut : onSignIn}
          >
            {forbidden ? t.admin.signOut : t.admin.signIn}
          </Button>
          <Link
            href="/"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t.admin.viewPublicSite}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function usePendingCounts() {
  const [pendingTotal, setPendingTotal] = useState(0);
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => {
    fetch("/api/projects?status=pending", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((projects) => {
        setPendingTotal(Array.isArray(projects) ? projects.length : 0);
      })
      .catch(() => {});

    fetch("/api/admin/reports", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((reports: { status: string }[]) =>
        setOpenReports(reports.filter((report) => report.status === "open").length),
      )
      .catch(() => {});
  }, []);

  return { pendingTotal, openReports };
}

function AdminSidebar({
  onLogout,
}: {
  onLogout: () => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const { pendingTotal, openReports } = usePendingCounts();
  const navGroups = buildNavGroups(t);

  const getBadgeCount = (path: string) => {
    if (path === "/admin/pending") return pendingTotal;
    if (path === "/admin/reports") return openReports;
    return 0;
  };

  const isActive = (item: NavItem) =>
    item.exact
      ? location === item.path
      : location === item.path || location.startsWith(`${item.path}/`);

  return (
    <aside className="w-64 min-w-[256px] bg-[#0f2044] min-h-screen flex flex-col">
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">
            {t.admin.brand}
          </div>
          <div className="text-white/50 text-xs">{t.admin.console}</div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.group}>
            {group.group && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const badge = item.badge ? getBadgeCount(item.path) : 0;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group ${
                      active
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        active
                          ? "text-white"
                          : "text-white/40 group-hover:text-white/70"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] leading-tight mt-0.5 ${
                          active
                            ? "text-white/60"
                            : "text-white/25 group-hover:text-white/40"
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                    {badge > 0 && (
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-bold px-1 flex-shrink-0 ${
                          active
                            ? "bg-white text-[#0f2044]"
                            : "bg-[#e85d26] text-white"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                    {active && (
                      <ChevronRight className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2 py-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" /> {t.admin.viewPublicSite}
        </Link>
      </div>

      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t.admin.signOut}
        </button>
      </div>
    </aside>
  );
}

function AdminShell({
  onLogout,
}: {
  onLogout: () => void | Promise<void>;
}) {
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
    if (location.startsWith("/admin/reviews")) return <AdminReviews />;
    if (location.startsWith("/admin/settings")) return <AdminSettings />;
    return <AdminOverview />;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar onLogout={onLogout} />
      <main className="flex-1 min-w-0 overflow-auto">{renderContent()}</main>
    </div>
  );
}

export default function AdminDashboard() {
  usePageMeta({ title: "Admin — ImmoVia365", noindex: true });

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setAuthState("unauthenticated");
        return;
      }

      setAuthState("loading");

      try {
        const token = await getToken();
        const response = await fetch("/api/admin-auth/verify", {
          credentials: "include",
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        });

        if (cancelled) return;

        if (response.ok) {
          setAuthState("authenticated");
        } else if (response.status === 403) {
          setAuthState("forbidden");
        } else {
          setAuthState("unauthenticated");
        }
      } catch {
        if (!cancelled) setAuthState("unauthenticated");
      }
    }

    void verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const handleSignIn = () => {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const adminUrl = `${window.location.origin}${basePath}/admin`;
    window.location.assign(
      `${basePath}/sign-in?redirect_url=${encodeURIComponent(adminUrl)}`,
    );
  };

  const handleLogout = async () => {
    await signOut();
    setAuthState("unauthenticated");
    window.location.assign("/");
  };

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2044]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (authState === "unauthenticated" || authState === "forbidden") {
    return (
      <AdminAccessCard
        state={authState}
        onSignIn={handleSignIn}
        onSignOut={handleLogout}
      />
    );
  }

  return <AdminShell onLogout={handleLogout} />;
}

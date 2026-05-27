import { useEffect, useState } from "react";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Hammer, Building2, Clock, CheckCircle2, Users, Globe,
  FileText, XCircle, Loader2, UserCheck, Briefcase, User,
  ArrowRight, TrendingUp, Shield, AlertCircle, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface PendingProject {
  id: number;
  fullName: string;
  email: string;
  projectType: string;
  city: string;
  budget: string | null;
  createdAt: string;
}

interface PendingCompany {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  city: string;
  createdAt: string;
}

function StatCard({
  label, value, icon: Icon, color, bg, note,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  note?: string;
}) {
  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href}>
          <button className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </Link>
      )}
    </div>
  );
}

export function AdminOverview() {
  const { data: stats, isLoading, refetch: refetchStats } = useGetAdminStats();
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<Record<string, "approved" | "rejected">>({});

  const loadPending = () => {
    fetch("/api/projects?status=pending", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPendingProjects(d as PendingProject[]))
      .catch(() => {});
    fetch("/api/companies?status=pending", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPendingCompanies(d as PendingCompany[]))
      .catch(() => {});
  };

  useEffect(() => { loadPending(); }, []);

  const action = async (key: string, url: string, body: object, done: "approved" | "rejected") => {
    setActionLoading(key);
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    setActionLoading(null);
    setActionDone((prev) => ({ ...prev, [key]: done }));
    loadPending();
    refetchStats();
  };

  const s = stats as (typeof stats & {
    individualProjectPosters?: number;
    companyProjectPosters?: number;
    individualServiceProviders?: number;
    companyServiceProviders?: number;
  }) | undefined;

  const totalPending = (s?.pendingProjects ?? 0) + (s?.pendingCompanies ?? 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#1a3a6e]" />
            Admin Overview
          </h1>
          <p className="text-sm text-gray-400 mt-1">All platform activity at a glance</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>Today</p>
          <p className="font-medium text-gray-600">{format(new Date(), "MMM d, yyyy")}</p>
        </div>
      </div>

      {/* ── Alert: items needing action ── */}
      {totalPending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">
              {totalPending} item{totalPending !== 1 ? "s" : ""} waiting for your review
            </span>
            <span className="text-amber-600"> — approve or reject below</span>
          </div>
          <Link href="/admin/pending">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs">
              Go to Pending <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* ── SECTION 1: Users ── */}
      <div>
        <SectionHeader title="Users" subtitle="Registered accounts by type" href="/admin/users" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={isLoading ? "…" : (s?.totalUsers ?? 0)} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Project Posters" value={isLoading ? "…" : (s?.projectPosters ?? 0)} icon={Briefcase} color="text-indigo-600" bg="bg-indigo-50" note={`${s?.individualProjectPosters ?? 0} ind. · ${s?.companyProjectPosters ?? 0} co.`} />
          <StatCard label="Service Providers" value={isLoading ? "…" : (s?.serviceProviders ?? 0)} icon={UserCheck} color="text-purple-600" bg="bg-purple-50" note={`${s?.individualServiceProviders ?? 0} ind. · ${s?.companyServiceProviders ?? 0} co.`} />
          <StatCard label="Approved Profiles" value={isLoading ? "…" : (s?.approvedCompanies ?? 0)} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        </div>
      </div>

      {/* ── SECTION 2: Projects ── */}
      <div>
        <SectionHeader title="Projects" subtitle="All submitted renovation & construction requests" href="/admin/projects" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Projects" value={isLoading ? "…" : (s?.totalProjects ?? 0)} icon={Hammer} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Open (Public)" value={isLoading ? "…" : (s?.openProjects ?? 0)} icon={Globe} color="text-emerald-600" bg="bg-emerald-50" note="Visible on /projects" />
          <StatCard label="Pending Review" value={isLoading ? "…" : (s?.pendingProjects ?? 0)} icon={Clock} color="text-amber-600" bg="bg-amber-50" note="Need your approval" />
          <StatCard label="Companies" value={isLoading ? "…" : (s?.totalCompanies ?? 0)} icon={Building2} color="text-violet-600" bg="bg-violet-50" />
        </div>
      </div>

      {/* ── SECTION 3: Pending Actions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Pending Projects */}
        <div>
          <SectionHeader
            title={`Pending Projects ${pendingProjects.length > 0 ? `(${pendingProjects.length})` : ""}`}
            subtitle='Approve → makes project "open" and visible to contractors'
            href="/admin/projects"
          />
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            {pendingProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <CheckCircle2 className="h-8 w-8 text-green-300" />
                <p className="text-sm font-medium">No pending projects</p>
                <p className="text-xs">All caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingProjects.map((p) => {
                  const approveKey = `proj-approve-${p.id}`;
                  const rejectKey = `proj-reject-${p.id}`;
                  const done = actionDone[approveKey] || actionDone[rejectKey];
                  return (
                    <div key={p.id} className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${done ? "opacity-40 bg-gray-50" : "hover:bg-gray-50"}`}>
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Hammer className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{p.fullName}</span>
                          <Badge variant="outline" className="text-xs capitalize bg-blue-50 text-blue-700 border-blue-200">{p.projectType}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.city}{p.budget ? ` · ${p.budget}` : ""}</p>
                        <p className="text-xs text-gray-400">{p.email} · {format(new Date(p.createdAt), "MMM d, yyyy")}</p>
                      </div>
                      {done ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${done === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {done === "approved" ? "Approved" : "Rejected"}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            disabled={actionLoading !== null}
                            onClick={() => action(approveKey, `/api/projects/${p.id}`, { status: "open" }, "approved")}
                          >
                            {actionLoading === approveKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3 w-3 mr-1" />Approve</>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            disabled={actionLoading !== null}
                            onClick={() => action(rejectKey, `/api/projects/${p.id}`, { status: "cancelled" }, "rejected")}
                          >
                            {actionLoading === rejectKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <><XCircle className="h-3 w-3 mr-1" />Reject</>}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Pending Companies */}
        <div>
          <SectionHeader
            title={`Pending Companies ${pendingCompanies.length > 0 ? `(${pendingCompanies.length})` : ""}`}
            subtitle="Approve → company becomes visible in the public directory"
            href="/admin/companies"
          />
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            {pendingCompanies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <CheckCircle2 className="h-8 w-8 text-green-300" />
                <p className="text-sm font-medium">No pending companies</p>
                <p className="text-xs">All caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingCompanies.map((c) => {
                  const approveKey = `comp-approve-${c.id}`;
                  const rejectKey = `comp-reject-${c.id}`;
                  const done = actionDone[approveKey] || actionDone[rejectKey];
                  return (
                    <div key={c.id} className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${done ? "opacity-40 bg-gray-50" : "hover:bg-gray-50"}`}>
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{c.companyName}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{c.contactName} · {c.city}</p>
                        <p className="text-xs text-gray-400">{c.email} · {format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                      </div>
                      {done ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${done === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {done === "approved" ? "Approved" : "Rejected"}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            disabled={actionLoading !== null}
                            onClick={() => action(approveKey, `/api/companies/${c.id}`, { status: "approved" }, "approved")}
                          >
                            {actionLoading === approveKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3 w-3 mr-1" />Approve</>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            disabled={actionLoading !== null}
                            onClick={() => action(rejectKey, `/api/companies/${c.id}`, { status: "rejected" }, "rejected")}
                          >
                            {actionLoading === rejectKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <><XCircle className="h-3 w-3 mr-1" />Reject</>}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── SECTION 4: Status breakdown + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Projects by status */}
        <div>
          <SectionHeader title="Projects by Status" subtitle="Distribution of all submitted projects" />
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-5 pb-4 space-y-3">
              {(s?.projectsByStatus ?? []).length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>
              )}
              {(s?.projectsByStatus ?? []).map((item) => {
                const total = s?.totalProjects ?? 1;
                const pct = Math.round((item.count / total) * 100);
                const colorMap: Record<string, string> = {
                  open: "bg-emerald-500",
                  pending: "bg-amber-400",
                  reviewing: "bg-blue-400",
                  matched: "bg-purple-500",
                  cancelled: "bg-red-400",
                };
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colorMap[item.label] ?? "bg-gray-300"}`} />
                        <span className="text-sm capitalize text-gray-700 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-sm font-bold text-gray-900 w-6 text-right">{item.count}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorMap[item.label] ?? "bg-gray-300"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <div>
          <SectionHeader title="Recent Activity" subtitle="Last submissions across the platform" />
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-4 pb-2">
              {(s?.recentActivity ?? []).length === 0 && (
                <p className="text-sm text-gray-400 py-6 text-center">No activity yet</p>
              )}
              <div className="divide-y divide-gray-50">
                {(s?.recentActivity ?? []).map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "project" ? "bg-blue-50" : "bg-orange-50"}`}>
                      {item.type === "project"
                        ? <Hammer className="h-3.5 w-3.5 text-blue-500" />
                        : <Building2 className="h-3.5 w-3.5 text-orange-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SECTION 5: Quick nav ── */}
      <div>
        <SectionHeader title="Quick Navigation" subtitle="Jump to any section" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: "/admin/projects", label: "All Projects", icon: Hammer, color: "text-blue-600", bg: "bg-blue-50" },
            { href: "/admin/companies", label: "Companies", icon: Building2, color: "text-orange-600", bg: "bg-orange-50" },
            { href: "/admin/pending", label: "Pending Review", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { href: "/admin/users", label: "Users", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { href: "/admin/applications", label: "Applications", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map((nav) => (
            <Link key={nav.href} href={nav.href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${nav.bg} group-hover:scale-110 transition-transform`}>
                  <nav.icon className={`h-5 w-5 ${nav.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-600 text-center">{nav.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

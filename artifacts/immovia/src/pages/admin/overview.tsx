import { useEffect, useState } from "react";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Hammer, Building2, Clock, CheckCircle2, Users, TrendingUp,
  FileText, AlertTriangle, XCircle, Loader2
} from "lucide-react";
import { format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
    case "reviewing":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
    case "approved":
    case "matched":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Approved</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
    case "rejected":
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

interface QuickMetrics {
  totalUsers: number;
  totalApplications: number;
  openReports: number;
}

interface PendingProject {
  id: number;
  fullName: string;
  projectType: string;
  city: string;
  createdAt: string;
  status: string;
}

interface PendingCompany {
  id: number;
  companyName: string;
  contactName: string;
  city: string;
  createdAt: string;
  status: string;
}

export function AdminOverview() {
  const { data: stats, isLoading, refetch: refetchStats } = useGetAdminStats();
  const [quick, setQuick] = useState<QuickMetrics | null>(null);
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPending = () => {
    fetch("/api/projects?status=pending", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPendingProjects((d as PendingProject[]).slice(0, 5)))
      .catch(() => {});

    fetch("/api/companies?status=pending", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPendingCompanies((d as PendingCompany[]).slice(0, 5)))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/applications", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/reports", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
    ]).then(([users, apps, reports]) => {
      setQuick({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalApplications: Array.isArray(apps) ? apps.length : 0,
        openReports: Array.isArray(reports) ? (reports as { status: string }[]).filter((r) => r.status === "open").length : 0,
      });
    }).catch(() => {});

    loadPending();
  }, []);

  const approveProject = async (id: number) => {
    setActionLoading(`proj-approve-${id}`);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status: "matched" }),
    });
    setActionLoading(null);
    loadPending();
    refetchStats();
  };

  const rejectProject = async (id: number) => {
    setActionLoading(`proj-reject-${id}`);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status: "cancelled" }),
    });
    setActionLoading(null);
    loadPending();
    refetchStats();
  };

  const approveCompany = async (id: number) => {
    setActionLoading(`comp-approve-${id}`);
    await fetch(`/api/companies/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status: "approved" }),
    });
    setActionLoading(null);
    loadPending();
    refetchStats();
  };

  const rejectCompany = async (id: number) => {
    setActionLoading(`comp-reject-${id}`);
    await fetch(`/api/companies/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status: "rejected" }),
    });
    setActionLoading(null);
    loadPending();
    refetchStats();
  };

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: Hammer, color: "text-blue-600" },
    { label: "Pending Projects", value: stats?.pendingProjects ?? 0, icon: Clock, color: "text-yellow-600" },
    { label: "Total Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-indigo-600" },
    { label: "Pending Companies", value: stats?.pendingCompanies ?? 0, icon: Clock, color: "text-orange-600" },
    { label: "Registered Users", value: quick?.totalUsers ?? "—", icon: Users, color: "text-green-600" },
    { label: "Applications", value: quick?.totalApplications ?? "—", icon: FileText, color: "text-purple-600" },
    { label: "Open Reports", value: quick?.openReports ?? "—", icon: AlertTriangle, color: "text-red-500" },
    { label: "Approved", value: (stats?.totalProjects ?? 0) - (stats?.pendingProjects ?? 0), icon: TrendingUp, color: "text-emerald-600" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide statistics at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Card key={card.label} className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="text-2xl font-bold text-gray-900">
                {isLoading && typeof card.value === "number" && card.value === 0 ? "…" : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending quick-action lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Projects */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hammer className="h-4 w-4 text-yellow-500" />
              Pending Projects
              {pendingProjects.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                  {pendingProjects.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingProjects.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" /> All caught up
              </div>
            ) : (
              <div className="space-y-2">
                {pendingProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.fullName}</div>
                      <div className="text-xs text-gray-400 capitalize">{p.projectType} · {p.city}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button size="sm" variant="outline"
                        className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
                        disabled={actionLoading !== null}
                        onClick={() => approveProject(p.id)}
                      >
                        {actionLoading === `proj-approve-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline"
                        className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionLoading !== null}
                        onClick={() => rejectProject(p.id)}
                      >
                        {actionLoading === `proj-reject-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Companies */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              Pending Companies
              {pendingCompanies.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                  {pendingCompanies.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingCompanies.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" /> All caught up
              </div>
            ) : (
              <div className="space-y-2">
                {pendingCompanies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{c.companyName}</div>
                      <div className="text-xs text-gray-400">{c.contactName} · {c.city}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button size="sm" variant="outline"
                        className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
                        disabled={actionLoading !== null}
                        onClick={() => approveCompany(c.id)}
                      >
                        {actionLoading === `comp-approve-${c.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline"
                        className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionLoading !== null}
                        onClick={() => rejectCompany(c.id)}
                      >
                        {actionLoading === `comp-reject-${c.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(stats?.projectsByStatus ?? []).map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
              {!stats?.projectsByStatus?.length && (
                <p className="text-sm text-gray-400 py-2">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.recentActivity ?? []).map((item) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell className="text-sm font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-xs text-gray-500">{format(new Date(item.createdAt), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
                {!stats?.recentActivity?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-6">No activity yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

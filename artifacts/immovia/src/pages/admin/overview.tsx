import { useEffect, useState } from "react";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Hammer, Building2, Clock, CheckCircle2, Users, TrendingUp, FileText, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
    case "reviewing":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
    case "approved":
    case "matched":
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>;
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
  totalRevenue: number;
}

export function AdminOverview() {
  const { data: stats, isLoading } = useGetAdminStats();
  const [quick, setQuick] = useState<QuickMetrics | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/applications", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/reports", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/metrics", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ]).then(([users, apps, reports, metrics]) => {
      setQuick({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalApplications: Array.isArray(apps) ? apps.length : 0,
        openReports: Array.isArray(reports) ? (reports as { status: string }[]).filter((r) => r.status === "open").length : 0,
        totalRevenue: (metrics as { totalRevenue?: number } | null)?.totalRevenue ?? 0,
      });
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: Hammer, color: "text-blue-600" },
    { label: "Pending Projects", value: stats?.pendingProjects ?? 0, icon: Clock, color: "text-yellow-600" },
    { label: "Total Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-indigo-600" },
    { label: "Pending Companies", value: stats?.pendingCompanies ?? 0, icon: Clock, color: "text-orange-600" },
    { label: "Registered Users", value: quick?.totalUsers ?? "—", icon: Users, color: "text-green-600" },
    { label: "Applications", value: quick?.totalApplications ?? "—", icon: FileText, color: "text-purple-600" },
    { label: "Open Reports", value: quick?.openReports ?? "—", icon: AlertTriangle, color: "text-red-500" },
    { label: "Total Revenue", value: quick ? `${((quick.totalRevenue) / 100).toFixed(0)} €` : "—", icon: TrendingUp, color: "text-emerald-600" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide statistics at a glance</p>
      </div>

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
            <CardTitle className="text-sm font-semibold text-gray-700">Projects by Type</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(stats?.projectsByType ?? []).map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
              {!stats?.projectsByType?.length && (
                <p className="text-sm text-gray-400 py-2">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
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

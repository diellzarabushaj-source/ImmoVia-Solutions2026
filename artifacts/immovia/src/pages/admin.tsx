import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/contexts/AuthContext";
import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { 
  useGetAdminStats, 
  useListProjects, 
  useListCompanies,
  useUpdateProject,
  useUpdateCompany,
  useDeleteProject,
  useDeleteCompany,
  getGetAdminStatsQueryKey,
  getListProjectsQueryKey,
  getListCompaniesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2, 
  Hammer, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MoreHorizontal,
  Trash2,
  LogOut,
  ShieldOff
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


function AdminDashboardContent() {
  const { t } = useLanguage();
  usePageMeta({ title: `Admin — ImmoVia`, noindex: true });
  const queryClient = useQueryClient();
  
  const { data: stats } = useGetAdminStats();
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: companies, isLoading: companiesLoading } = useListCompanies();
  
  const updateProject = useUpdateProject();
  const updateCompany = useUpdateCompany();
  const deleteProject = useDeleteProject();
  const deleteCompany = useDeleteCompany();

  const handleUpdateProjectStatus = (id: number, status: string) => {
    updateProject.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        }
      }
    );
  };

  const handleUpdateCompanyStatus = (id: number, status: string) => {
    updateCompany.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        }
      }
    );
  };

  const handleDeleteProject = (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          }
        }
      );
    }
  };

  const handleDeleteCompany = (id: number) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteCompany.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          }
        }
      );
    }
  };

  const { signOut } = useClerk();
  const handleLogout = () => signOut();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
      case 'matched':
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">{t.admin.title}</h1>
          <p className="text-muted-foreground">Platform overview and management</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.totalProjects}</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.pendingProjects}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingProjects || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.totalCompanies}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.pendingCompanies}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingCompanies || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">{t.admin.projectsTab}</TabsTrigger>
          <TabsTrigger value="companies">{t.admin.companiesTab}</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-admin-billing">{t.adminBilling.title}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-0">
          <Card>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!projectsLoading && projects?.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.fullName}</div>
                        <div className="text-xs text-muted-foreground">{project.email}</div>
                      </TableCell>
                      <TableCell className="capitalize">{project.projectType}</TableCell>
                      <TableCell>{project.city}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(project.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdateProjectStatus(project.id, 'matched')}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateProjectStatus(project.id, 'cancelled')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {projects?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No projects found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="mt-0">
          <Card>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!companiesLoading && companies?.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.companyName}</TableCell>
                      <TableCell>
                        <div className="text-sm">{company.contactName}</div>
                        <div className="text-xs text-muted-foreground">{company.email}</div>
                      </TableCell>
                      <TableCell>{company.city}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(company.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, 'approved')}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, 'rejected')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No companies found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-0">
          <AdminBillingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminBillingPanel() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<{ mrr: number; activeSubscriptions: number; packRevenue: number; totalRevenue: number } | null>(null);
  const [subs, setSubs] = useState<Array<{ id: string; userId: string; planName: string; status: string; priceCents: number; currency: string }>>([]);
  const [txns, setTxns] = useState<Array<{ id: string; userId: string; delta: number; bucket: string; reason: string; createdAt: string }>>([]);
  const [innerTab, setInnerTab] = useState<"metrics" | "subscriptions" | "transactions">("metrics");

  useEffect(() => {
    fetch("/api/admin/metrics", { credentials: "include" }).then((r) => r.ok ? r.json() : null).then(setMetrics).catch(() => {});
    fetch("/api/admin/subscriptions", { credentials: "include" }).then((r) => r.ok ? r.json() : []).then((d) => setSubs(d?.items ?? d ?? [])).catch(() => {});
    fetch("/api/admin/transactions", { credentials: "include" }).then((r) => r.ok ? r.json() : []).then((d) => setTxns(d?.items ?? d ?? [])).catch(() => {});
  }, []);

  const fmtMoney = (cents: number) => `${(cents / 100).toFixed(2)} EUR`;

  return (
    <Card className="p-4">
      <div className="flex gap-2 mb-4">
        <Button variant={innerTab === "metrics" ? "default" : "outline"} size="sm" onClick={() => setInnerTab("metrics")} data-testid="admin-billing-metrics">{t.adminBilling.tabMetrics}</Button>
        <Button variant={innerTab === "subscriptions" ? "default" : "outline"} size="sm" onClick={() => setInnerTab("subscriptions")} data-testid="admin-billing-subs">{t.adminBilling.tabSubscriptions}</Button>
        <Button variant={innerTab === "transactions" ? "default" : "outline"} size="sm" onClick={() => setInnerTab("transactions")} data-testid="admin-billing-txns">{t.adminBilling.tabTransactions}</Button>
      </div>

      {innerTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4"><div className="text-xs text-muted-foreground">{t.adminBilling.mrr}</div><div className="text-2xl font-bold">{metrics ? fmtMoney(metrics.mrr) : "—"}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">{t.adminBilling.activeSubscriptions}</div><div className="text-2xl font-bold">{metrics?.activeSubscriptions ?? "—"}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">{t.adminBilling.packRevenue}</div><div className="text-2xl font-bold">{metrics ? fmtMoney(metrics.packRevenue) : "—"}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">{t.adminBilling.totalRevenue}</div><div className="text-2xl font-bold">{metrics ? fmtMoney(metrics.totalRevenue) : "—"}</div></Card>
        </div>
      )}

      {innerTab === "subscriptions" && (
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {subs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>
            ) : subs.map((s) => (
              <TableRow key={s.id}><TableCell className="font-mono text-xs">{s.userId.slice(0, 8)}</TableCell><TableCell>{s.planName}</TableCell><TableCell>{fmtMoney(s.priceCents)}</TableCell><TableCell>{s.status}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {innerTab === "transactions" && (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Delta</TableHead><TableHead>Bucket</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
          <TableBody>
            {txns.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>
            ) : txns.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-xs">{format(new Date(tx.createdAt), 'MMM d')}</TableCell>
                <TableCell className="font-mono text-xs">{tx.userId.slice(0, 8)}</TableCell>
                <TableCell className={tx.delta < 0 ? "text-red-600" : "text-green-600"}>{tx.delta > 0 ? `+${tx.delta}` : tx.delta}</TableCell>
                <TableCell>{tx.bucket}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{tx.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldOff className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-2">Admin access required</p>
          <p className="text-sm text-muted-foreground mb-6">Please sign in with an admin account.</p>
          <Button
            className="bg-[#1a3a6e] hover:bg-[#0f2044]"
            onClick={() => setLocation("/sign-in")}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldOff className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-2">Access denied</p>
          <p className="text-sm text-muted-foreground">Your account does not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboardContent />;
}

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Hammer,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Trash2,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthState = "loading" | "authenticated" | "unauthenticated";

// ─── Admin Login Form ────────────────────────────────────────────────────────

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
            <Button type="submit" className="w-full bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
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

// ─── Add Project Dialog ──────────────────────────────────────────────────────

function AddProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    projectType: "renovation",
    description: "",
    city: "",
    budget: "",
    timeline: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        projectType: form.projectType,
        description: form.description,
        city: form.city,
      };
      if (form.budget.trim()) body.budget = form.budget;
      if (form.timeline.trim()) body.timeline = form.timeline;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to create project.");
        return;
      }
      onCreated();
      onClose();
      setForm({ fullName: "", email: "", phone: "", projectType: "renovation", description: "", city: "", budget: "", timeline: "" });
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Hammer className="h-4 w-4" /> Add Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.fullName} onChange={set("fullName")} required disabled={loading} placeholder="Client name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={set("email")} required disabled={loading} placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={set("phone")} required disabled={loading} placeholder="+355..." />
            </div>
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Input value={form.city} onChange={set("city")} required disabled={loading} placeholder="Tirana" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Project Type *</Label>
            <Select value={form.projectType} onValueChange={(v) => setForm((f) => ({ ...f, projectType: v }))}>
              <SelectTrigger disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="renovation">Renovation</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="interior">Interior</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={set("description")} required disabled={loading} placeholder="Project details..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Input value={form.budget} onChange={set("budget")} disabled={loading} placeholder="e.g. 10000 EUR" />
            </div>
            <div className="space-y-1.5">
              <Label>Timeline</Label>
              <Input value={form.timeline} onChange={set("timeline")} disabled={loading} placeholder="e.g. 3 months" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Add Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Company Dialog ──────────────────────────────────────────────────────

const SERVICE_TYPE_OPTIONS = [
  "renovation", "construction", "plumbing", "electrical",
  "painting", "flooring", "roofing", "landscaping",
  "interior-design", "cleaning", "hvac", "other",
];

function AddCompanyDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    description: "",
    website: "",
    workerType: "company",
  });
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleService = (s: string) =>
    setServiceTypes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceTypes.length === 0) {
      setError("Select at least one service type.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        city: form.city,
        serviceTypes,
        workerType: form.workerType,
      };
      if (form.description.trim()) body.description = form.description;
      if (form.website.trim()) body.website = form.website;

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to create company.");
        return;
      }
      onCreated();
      onClose();
      setForm({ companyName: "", contactName: "", email: "", phone: "", city: "", description: "", website: "", workerType: "company" });
      setServiceTypes([]);
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Add Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={form.companyName} onChange={set("companyName")} required disabled={loading} placeholder="Company SH.P.K." />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person *</Label>
              <Input value={form.contactName} onChange={set("contactName")} required disabled={loading} placeholder="Name Surname" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={set("email")} required disabled={loading} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={set("phone")} required disabled={loading} placeholder="+355..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Input value={form.city} onChange={set("city")} required disabled={loading} placeholder="Tirana" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.workerType} onValueChange={(v) => setForm((f) => ({ ...f, workerType: v }))}>
                <SelectTrigger disabled={loading}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Services * <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
            <div className="grid grid-cols-3 gap-1.5">
              {SERVICE_TYPE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => toggleService(s)}
                  className={`text-xs rounded px-2 py-1.5 border transition-colors text-left capitalize ${
                    serviceTypes.includes(s)
                      ? "bg-[#1a3a6e] text-white border-[#1a3a6e]"
                      : "bg-white text-muted-foreground border-border hover:border-[#1a3a6e]"
                  }`}
                >
                  {s.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set("description")} disabled={loading} placeholder="About the company..." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input value={form.website} onChange={set("website")} disabled={loading} placeholder="https://..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Admin Dashboard Content ─────────────────────────────────────────────────

function AdminDashboardContent({ onLogout }: { onLogout: () => void }) {
  const { t } = useLanguage();
  usePageMeta({ title: `Admin — ImmoVia`, noindex: true });
  const queryClient = useQueryClient();

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);

  const { data: stats } = useGetAdminStats();
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: companies, isLoading: companiesLoading } = useListCompanies();

  const updateProject = useUpdateProject();
  const updateCompany = useUpdateCompany();
  const deleteProject = useDeleteProject();
  const deleteCompany = useDeleteCompany();

  const invalidateProjects = () => {
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };
  const invalidateCompanies = () => {
    queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleUpdateProjectStatus = (id: number, status: string) => {
    updateProject.mutate({ id, data: { status } }, { onSuccess: invalidateProjects });
  };

  const handleUpdateCompanyStatus = (id: number, status: string) => {
    updateCompany.mutate({ id, data: { status } }, { onSuccess: invalidateCompanies });
  };

  const handleDeleteProject = (id: number) => {
    if (!confirm("Delete this project?")) return;
    deleteProject.mutate({ id }, { onSuccess: invalidateProjects });
  };

  const handleDeleteCompany = (id: number) => {
    if (!confirm("Delete this company?")) return;
    deleteCompany.mutate({ id }, { onSuccess: invalidateCompanies });
  };

  const handleLogout = async () => {
    await fetch("/api/admin-auth/logout", { method: "POST", credentials: "include" });
    onLogout();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "reviewing":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
      case "matched":
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
      case "cancelled":
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
        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.totalProjects}</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalProjects || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.pendingProjects}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.pendingProjects || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.totalCompanies}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.admin.pendingCompanies}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.pendingCompanies || 0}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">{t.admin.projectsTab}</TabsTrigger>
          <TabsTrigger value="companies">{t.admin.companiesTab}</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-admin-billing">{t.adminBilling.title}</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-0">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Project
            </Button>
          </div>
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
                  {projectsLoading && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  )}
                  {!projectsLoading && projects?.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.fullName}</div>
                        <div className="text-xs text-muted-foreground">{project.email}</div>
                      </TableCell>
                      <TableCell className="capitalize">{project.projectType}</TableCell>
                      <TableCell>{project.city}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(project.createdAt), "MMM d, yyyy")}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleUpdateProjectStatus(project.id, "matched")}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateProjectStatus(project.id, "pending")}>
                              <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Set Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateProjectStatus(project.id, "cancelled")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProject(project.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!projectsLoading && projects?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No projects found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="mt-0">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddCompanyOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Company
            </Button>
          </div>
          <Card>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companiesLoading && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  )}
                  {!companiesLoading && companies?.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.companyName}</TableCell>
                      <TableCell>
                        <div className="text-sm">{company.contactName}</div>
                        <div className="text-xs text-muted-foreground">{company.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(company.serviceTypes ?? []).slice(0, 2).map((s: string) => (
                            <span key={s} className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 capitalize">{s}</span>
                          ))}
                          {(company.serviceTypes ?? []).length > 2 && (
                            <span className="inline-block text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">+{(company.serviceTypes ?? []).length - 2}</span>
                          )}
                          {(company.serviceTypes ?? []).length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{company.city}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(company.createdAt), "MMM d, yyyy")}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, "approved")}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, "reviewing")}>
                              <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Set Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateCompanyStatus(company.id, "rejected")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCompany(company.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!companiesLoading && companies?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No companies found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-0">
          <AdminBillingPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddProjectDialog
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onCreated={invalidateProjects}
      />
      <AddCompanyDialog
        open={addCompanyOpen}
        onClose={() => setAddCompanyOpen(false)}
        onCreated={invalidateCompanies}
      />
    </div>
  );
}

// ─── Billing Panel ───────────────────────────────────────────────────────────

function AdminBillingPanel() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<{ mrr: number; activeSubscriptions: number; packRevenue: number; totalRevenue: number } | null>(null);
  const [subs, setSubs] = useState<Array<{ id: string; userId: string; planName: string; status: string; priceCents: number; currency: string }>>([]);
  const [txns, setTxns] = useState<Array<{ id: string; userId: string; delta: number; bucket: string; reason: string; createdAt: string }>>([]);
  const [innerTab, setInnerTab] = useState<"metrics" | "subscriptions" | "transactions">("metrics");

  useEffect(() => {
    fetch("/api/admin/metrics", { credentials: "include" }).then((r) => r.ok ? r.json() : null).then(setMetrics).catch(() => {});
    fetch("/api/admin/subscriptions", { credentials: "include" }).then((r) => r.ok ? r.json() : []).then((d) => setSubs((d as { items?: typeof subs })?.items ?? d ?? [])).catch(() => {});
    fetch("/api/admin/transactions", { credentials: "include" }).then((r) => r.ok ? r.json() : []).then((d) => setTxns((d as { items?: typeof txns })?.items ?? d ?? [])).catch(() => {});
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
            {subs.length === 0
              ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>
              : subs.map((s) => (
                <TableRow key={s.id}><TableCell className="font-mono text-xs">{s.userId.slice(0, 8)}</TableCell><TableCell>{s.planName}</TableCell><TableCell>{fmtMoney(s.priceCents)}</TableCell><TableCell>{s.status}</TableCell></TableRow>
              ))}
          </TableBody>
        </Table>
      )}
      {innerTab === "transactions" && (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Delta</TableHead><TableHead>Bucket</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
          <TableBody>
            {txns.length === 0
              ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>
              : txns.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs">{format(new Date(tx.createdAt), "MMM d")}</TableCell>
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

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    fetch("/api/admin-auth/verify", { credentials: "include" })
      .then((r) => { setAuthState(r.ok ? "authenticated" : "unauthenticated"); })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3a6e]" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <AdminLoginForm onSuccess={() => setAuthState("authenticated")} />;
  }

  return <AdminDashboardContent onLogout={() => setAuthState("unauthenticated")} />;
}

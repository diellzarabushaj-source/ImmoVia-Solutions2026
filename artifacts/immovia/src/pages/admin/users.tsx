import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Loader2, Search, CheckCircle2, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  accountType: string | null;
  accountSubtype: string | null;
  city: string | null;
  language: string;
  verified: boolean;
  createdAt: string;
}

function accountTypeLabel(accountType: string | null, accountSubtype: string | null): string {
  const type = accountType === "project_poster" ? "Project Poster"
    : accountType === "service_provider" ? "Service Provider"
    : null;
  const sub = accountSubtype === "individual" ? "Individual"
    : accountSubtype === "company" ? "Company"
    : null;
  if (!type) return "Admin";
  if (!sub) return type;
  return `${sub} ${type}`;
}

function AccountTypeBadge({ accountType, accountSubtype, role }: { accountType: string | null; accountSubtype: string | null; role: string }) {
  if (role === "admin") {
    return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Admin</Badge>;
  }
  if (accountType === "project_poster") {
    return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
      {accountTypeLabel(accountType, accountSubtype)}
    </Badge>;
  }
  if (accountType === "service_provider") {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
      {accountTypeLabel(accountType, accountSubtype)}
    </Badge>;
  }
  return <Badge variant="outline" className="text-xs">{accountTypeLabel(accountType, accountSubtype)}</Badge>;
}

type PendingAction = {
  userId: number;
  action: "approve" | "suspend" | "reactivate" | "delete";
  label: string;
  description: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [accountSubtypeFilter, setAccountSubtypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirm, setConfirm] = useState<PendingAction | null>(null);
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setUsers(data as AdminUser[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const performAction = async () => {
    if (!confirm) return;
    setActing(true);
    await fetch(`/api/admin/users/${confirm.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: confirm.action }),
    });
    setActing(false);
    setConfirm(null);
    load();
  };

  const requestAction = (u: AdminUser, action: PendingAction["action"]) => {
    const labels: Record<string, { label: string; desc: string }> = {
      approve: { label: "Approve User", desc: `Approve "${u.fullName}" and mark them as verified.` },
      suspend: { label: "Suspend User", desc: `Suspend "${u.fullName}" — they will no longer be verified.` },
      reactivate: { label: "Reactivate User", desc: `Reactivate "${u.fullName}" and restore their verified status.` },
      delete: { label: "Delete User", desc: `Permanently delete "${u.fullName}". This cannot be undone.` },
    };
    setConfirm({ userId: u.id, action, label: labels[action].label, description: labels[action].desc });
  };

  const nonAdminUsers = users.filter((u) => u.role !== "admin");

  const stats = {
    total: nonAdminUsers.length,
    projectPosters: nonAdminUsers.filter((u) => u.accountType === "project_poster").length,
    serviceProviders: nonAdminUsers.filter((u) => u.accountType === "service_provider").length,
    verified: users.filter((u) => u.verified).length,
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = accountTypeFilter === "all" ||
      (accountTypeFilter === "admin" ? u.role === "admin" : u.accountType === accountTypeFilter);
    const matchSubtype = accountSubtypeFilter === "all" || u.accountSubtype === accountSubtypeFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "verified" ? u.verified : !u.verified);
    return matchSearch && matchType && matchSubtype && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} registered accounts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: stats.total },
          { label: "Project Posters", value: stats.projectPosters },
          { label: "Service Providers", value: stats.serviceProviders },
          { label: "Verified", value: stats.verified },
        ].map((s) => (
          <Card key={s.label} className="p-4 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{loading ? "…" : s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search name, email, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Account type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All account types</SelectItem>
            <SelectItem value="project_poster">Project Posters</SelectItem>
            <SelectItem value="service_provider">Service Providers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={accountSubtypeFilter} onValueChange={setAccountSubtypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Subtype" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subtypes</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">User</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Account Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Joined</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!loading && filtered.map((u) => (
              <TableRow key={u.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-sm">{u.fullName}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </TableCell>
                <TableCell>
                  <AccountTypeBadge accountType={u.accountType} accountSubtype={u.accountSubtype} role={u.role} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">{u.city ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={u.verified ? "verified" : "unverified"} />
                </TableCell>
                <TableCell className="text-xs text-gray-400">
                  {format(new Date(u.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel className="text-xs text-gray-500">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {!u.verified && (
                        <DropdownMenuItem onClick={() => requestAction(u, "approve")} className="text-sm">
                          <ShieldCheck className="h-3.5 w-3.5 mr-2 text-green-600" /> Approve
                        </DropdownMenuItem>
                      )}
                      {u.verified && (
                        <DropdownMenuItem onClick={() => requestAction(u, "suspend")} className="text-sm">
                          <ShieldOff className="h-3.5 w-3.5 mr-2 text-yellow-600" /> Suspend
                        </DropdownMenuItem>
                      )}
                      {!u.verified && (
                        <DropdownMenuItem onClick={() => requestAction(u, "reactivate")} className="text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-blue-600" /> Reactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => requestAction(u, "delete")}
                        className="text-sm text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-400">No users match your filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.label ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.action === "delete" ? "Delete" : "Confirm"}
        variant={confirm?.action === "delete" ? "destructive" : "default"}
        onConfirm={() => { void performAction(); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

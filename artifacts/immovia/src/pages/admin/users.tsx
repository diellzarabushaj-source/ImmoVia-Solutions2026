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
import { Loader2, Search, CheckCircle2, Users, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  providerType: string | null;
  city: string | null;
  language: string;
  verified: boolean;
  createdAt: string;
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "admin":
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Admin</Badge>;
    case "service_provider":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Provider</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">Client</Badge>;
  }
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
  const [roleFilter, setRoleFilter] = useState("all");
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

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "verified" ? u.verified : !u.verified);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === "client" || u.role === "homeowner").length,
    providers: users.filter((u) => u.role === "service_provider").length,
    verified: users.filter((u) => u.verified).length,
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} registered accounts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: stats.total },
          { label: "Clients", value: stats.clients },
          { label: "Providers", value: stats.providers },
          { label: "Verified", value: stats.verified },
        ].map((s) => (
          <Card key={s.label} className="p-4 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{loading ? "…" : s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search name, email, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="homeowner">Homeowners</SelectItem>
            <SelectItem value="service_provider">Providers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
              <TableHead className="text-xs font-semibold text-gray-600">Role</TableHead>
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
                  <div className="text-xs text-gray-500">{u.email}</div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={u.role} />
                  {u.providerType && <div className="text-xs text-gray-400 mt-0.5 capitalize">{u.providerType.replace("_", " ")}</div>}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{u.city ?? "—"}</TableCell>
                <TableCell>
                  {u.verified
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span>
                    : <span className="text-xs text-gray-400">Unverified</span>}
                </TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {!u.verified && (
                        <DropdownMenuItem onClick={() => requestAction(u, "approve")}>
                          <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> Approve
                        </DropdownMenuItem>
                      )}
                      {u.verified && (
                        <DropdownMenuItem onClick={() => requestAction(u, "suspend")}>
                          <ShieldOff className="mr-2 h-4 w-4 text-amber-600" /> Suspend
                        </DropdownMenuItem>
                      )}
                      {!u.verified && (
                        <DropdownMenuItem onClick={() => requestAction(u, "reactivate")}>
                          <RefreshCw className="mr-2 h-4 w-4 text-blue-600" /> Reactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => requestAction(u, "delete")}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-400">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {confirm && (
        <ConfirmDialog
          open={true}
          title={confirm.label}
          description={confirm.description}
          confirmLabel={acting ? "Processing…" : confirm.label}
          variant={confirm.action === "delete" ? "destructive" : "default"}
          onConfirm={performAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

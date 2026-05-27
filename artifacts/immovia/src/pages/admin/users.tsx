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
import { Loader2, Search, CheckCircle2, Users } from "lucide-react";
import { format } from "date-fns";

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

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setUsers(data as AdminUser[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === "client").length,
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
          <Input className="pl-9" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="service_provider">Providers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><Users className="h-4 w-4 mr-1.5" /> Refresh</Button>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">User</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Role</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Language</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Verified</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Joined</TableHead>
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
                <TableCell className="text-xs uppercase text-gray-500">{u.language}</TableCell>
                <TableCell>
                  {u.verified
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <span className="text-xs text-gray-400">—</span>}
                </TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-400">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
import { Loader2, MoreHorizontal, CheckCircle2, XCircle, Flag, Trash2, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Report {
  id: number;
  reporterId: number | null;
  targetType: string;
  targetId: number;
  reason: string;
  status: string;
  createdAt: string;
}

export function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/reports", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setReports(data as Report[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteReport = async () => {
    if (deleteTarget === null) return;
    await fetch(`/api/admin/reports/${deleteTarget}`, { method: "DELETE", credentials: "include" });
    setDeleteTarget(null);
    load();
  };

  const filtered = reports.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch = !search ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.targetType.toLowerCase().includes(search.toLowerCase()) ||
      String(r.targetId).includes(search) ||
      (r.reporterId !== null && String(r.reporterId).includes(search));
    return matchStatus && matchSearch;
  });
  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reports.length} total — {openCount} open
            {openCount > 0 && <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">{openCount}</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search reason, target…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">ID</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Target</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Reason</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Reporter ID</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!loading && filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-gray-50">
                <TableCell className="text-xs text-gray-500">#{r.id}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">{r.targetType}</Badge>
                  <span className="text-xs text-gray-500 ml-1">#{r.targetId}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-700 max-w-[200px] truncate">{r.reason}</TableCell>
                <TableCell className="text-xs text-gray-500">{r.reporterId ? `#${r.reporterId}` : "—"}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(r.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => updateStatus(r.id, "resolved")}><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Resolve</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus(r.id, "dismissed")}><XCircle className="mr-2 h-4 w-4 text-gray-400" /> Dismiss</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus(r.id, "open")}><Flag className="mr-2 h-4 w-4 text-red-500" /> Reopen</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(r.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                  <span>No {statusFilter !== "all" ? statusFilter + " " : ""}reports</span>
                </div>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {deleteTarget !== null && (
        <ConfirmDialog
          open={true}
          title="Delete Report"
          description="Permanently delete this report? This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={deleteReport}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

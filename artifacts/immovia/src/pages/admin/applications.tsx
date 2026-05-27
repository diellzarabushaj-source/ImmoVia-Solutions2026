import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2, MoreHorizontal, CheckCircle2, XCircle, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ApplicationItem {
  id: number;
  projectId: number | null;
  companyId: number | null;
  status: string;
  message: string | null;
  createdAt: string;
  project: { id: number; fullName: string; city: string } | null;
  company: { id: number; companyName: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
    case "accepted":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Accepted</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function AddApplicationDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (projectId.trim()) body.projectId = Number(projectId);
      if (companyId.trim()) body.companyId = Number(companyId);
      if (message.trim()) body.message = message;
      const res = await fetch("/api/admin/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? "Failed."); return; }
      onCreated(); onClose();
      setProjectId(""); setCompanyId(""); setMessage("");
    } catch { setError("Connection error."); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Application Match</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Project ID</Label><Input value={projectId} onChange={(e) => setProjectId(e.target.value)} type="number" placeholder="Leave blank if N/A" disabled={loading} /></div>
          <div className="space-y-1.5"><Label>Company ID</Label><Input value={companyId} onChange={(e) => setCompanyId(e.target.value)} type="number" placeholder="Leave blank if N/A" disabled={loading} /></div>
          <div className="space-y-1.5"><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} disabled={loading} placeholder="Optional note…" /></div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminApplications() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/applications", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setApps(data as ApplicationItem[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteApp = async (id: number) => {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/admin/applications/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Project–company match applications — {apps.length} total</p>
        </div>
        <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Match
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">ID</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Project</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Company</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Message</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!loading && apps.map((a) => (
              <TableRow key={a.id} className="hover:bg-gray-50">
                <TableCell className="text-xs text-gray-500">#{a.id}</TableCell>
                <TableCell>
                  {a.project ? (
                    <div>
                      <div className="text-sm font-medium">{a.project.fullName}</div>
                      <div className="text-xs text-gray-400">{a.project.city}</div>
                    </div>
                  ) : <span className="text-xs text-gray-400">#{a.projectId ?? "—"}</span>}
                </TableCell>
                <TableCell>
                  {a.company ? (
                    <div className="text-sm">{a.company.companyName}</div>
                  ) : <span className="text-xs text-gray-400">#{a.companyId ?? "—"}</span>}
                </TableCell>
                <TableCell className="text-xs text-gray-600 max-w-[180px] truncate">{a.message ?? "—"}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(a.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => updateStatus(a.id, "accepted")}><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Accept</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus(a.id, "pending")}><Clock className="mr-2 h-4 w-4 text-yellow-500" /> Set Pending</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus(a.id, "rejected")}><XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteApp(a.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && apps.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-400">No applications yet. Create a match to get started.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AddApplicationDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />
    </div>
  );
}

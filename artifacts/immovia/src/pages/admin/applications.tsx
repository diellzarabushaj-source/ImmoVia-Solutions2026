import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface ApplicationItem {
  id: number;
  projectId: number | null;
  applicantUserId: number | null;
  message: string | null;
  proposedPrice: string | null;
  status: string;
  createdAt: string;
  project: { id: number; fullName: string; city: string } | null;
  applicant: { id: number; fullName: string; email: string } | null;
}

function AddApplicationDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [applicantUserId, setApplicantUserId] = useState("");
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");

  const reset = () => { setProjectId(""); setApplicantUserId(""); setMessage(""); setProposedPrice(""); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (projectId.trim()) body.projectId = Number(projectId);
      if (applicantUserId.trim()) body.applicantUserId = Number(applicantUserId);
      if (message.trim()) body.message = message;
      if (proposedPrice.trim()) body.proposedPrice = proposedPrice;
      const res = await fetch("/api/admin/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? "Failed."); return; }
      onCreated(); onClose(); reset();
    } catch { setError("Connection error."); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Application</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Project ID</Label><Input value={projectId} onChange={(e) => setProjectId(e.target.value)} type="number" placeholder="Leave blank if N/A" disabled={loading} /></div>
          <div className="space-y-1.5"><Label>Applicant User ID</Label><Input value={applicantUserId} onChange={(e) => setApplicantUserId(e.target.value)} type="number" placeholder="Leave blank if N/A" disabled={loading} /></div>
          <div className="space-y-1.5"><Label>Proposed Price</Label><Input value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} placeholder="e.g. €5,000" disabled={loading} /></div>
          <div className="space-y-1.5"><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} disabled={loading} placeholder="Optional note…" /></div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); reset(); }} disabled={loading}>Cancel</Button>
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
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

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

  const deleteApp = async () => {
    if (deleteTarget === null) return;
    await fetch(`/api/admin/applications/${deleteTarget}`, { method: "DELETE", credentials: "include" });
    setDeleteTarget(null);
    load();
  };

  const filtered = statusFilter === "all" ? apps : apps.filter((a) => a.status === statusFilter);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Service provider applications to projects — {apps.length} total</p>
        </div>
        <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">Project</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Applicant</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Proposed Price</TableHead>
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
            {!loading && filtered.map((a) => (
              <TableRow key={a.id} className="hover:bg-gray-50">
                <TableCell>
                  {a.project ? (
                    <div>
                      <div className="text-sm font-medium">{a.project.fullName}</div>
                      <div className="text-xs text-gray-400">{a.project.city}</div>
                    </div>
                  ) : <span className="text-xs text-gray-400">#{a.projectId ?? "—"}</span>}
                </TableCell>
                <TableCell>
                  {a.applicant ? (
                    <div>
                      <div className="text-sm font-medium">{a.applicant.fullName}</div>
                      <div className="text-xs text-gray-400">{a.applicant.email}</div>
                    </div>
                  ) : <span className="text-xs text-gray-400">#{a.applicantUserId ?? "—"}</span>}
                </TableCell>
                <TableCell className="text-sm text-gray-700 font-medium">{a.proposedPrice ?? "—"}</TableCell>
                <TableCell className="text-xs text-gray-600 max-w-[160px] truncate">{a.message ?? "—"}</TableCell>
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
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(a.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-400">No applications found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AddApplicationDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={load} />

      {deleteTarget !== null && (
        <ConfirmDialog
          open={true}
          title="Delete Application"
          description="Permanently delete this application? This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={deleteApp}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

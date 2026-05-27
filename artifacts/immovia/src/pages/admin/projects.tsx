import { useState } from "react";
import {
  useListProjects, useUpdateProject, useDeleteProject,
  getListProjectsQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  MoreHorizontal, CheckCircle2, XCircle, Clock, Trash2, Loader2,
  Plus, Hammer, Eye, Search
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";

function AddProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", projectType: "renovation",
    description: "", city: "", budget: "", timeline: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = {
        fullName: form.fullName, email: form.email, phone: form.phone,
        projectType: form.projectType, description: form.description, city: form.city,
      };
      if (form.budget.trim()) body.budget = form.budget;
      if (form.timeline.trim()) body.timeline = form.timeline;
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? "Failed."); return; }
      onCreated(); onClose();
      setForm({ fullName: "", email: "", phone: "", projectType: "renovation", description: "", city: "", budget: "", timeline: "" });
    } catch { setError("Connection error."); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Hammer className="h-4 w-4" /> Add Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.fullName} onChange={set("fullName")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} required disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone} onChange={set("phone")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>City *</Label><Input value={form.city} onChange={set("city")} required disabled={loading} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Project Type *</Label>
            <Select value={form.projectType} onValueChange={(v) => setForm((f) => ({ ...f, projectType: v }))}>
              <SelectTrigger disabled={loading}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="renovation">Renovation</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="interior">Interior</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Description *</Label><Textarea value={form.description} onChange={set("description")} required disabled={loading} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Budget</Label><Input value={form.budget} onChange={set("budget")} disabled={loading} placeholder="e.g. 10000 EUR" /></div>
            <div className="space-y-1.5"><Label>Timeline</Label><Input value={form.timeline} onChange={set("timeline")} disabled={loading} placeholder="e.g. 3 months" /></div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
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

export function AdminProjects() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: projects, isLoading } = useListProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleDelete = () => {
    if (deleteTarget === null) return;
    deleteProject.mutate({ id: deleteTarget }, { onSuccess: invalidate });
    setDeleteTarget(null);
  };

  const filtered = (projects ?? []).filter((p) => {
    const matchSearch = !search ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.projectType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects?.length ?? 0} total project requests</p>
        </div>
        <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Project
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="reviewing">reviewing</SelectItem>
            <SelectItem value="open">open</SelectItem>
            <SelectItem value="matched">matched</SelectItem>
            <SelectItem value="cancelled">cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">Client</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Description</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Location</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Budget</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Size</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={9} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!isLoading && filtered.map((project) => (
              <TableRow key={project.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-sm">{project.fullName}</div>
                  <div className="text-xs text-gray-500">{project.email}</div>
                </TableCell>
                <TableCell className="capitalize text-sm">{project.projectType}</TableCell>
                <TableCell className="max-w-[160px]">
                  {project.description ? (
                    <span className="text-xs text-gray-500 truncate block">{project.description}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{project.city}</TableCell>
                <TableCell className="text-sm text-gray-600">{project.budget ?? "—"}</TableCell>
                <TableCell className="text-sm text-gray-600">{(project as { size?: string }).size ?? "—"}</TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(project.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell><StatusBadge status={project.status} /></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <a href={`/projects`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" /> View on /projects
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-400 font-normal">Set status →</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "open" } }, { onSuccess: invalidate })}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "reviewing" } }, { onSuccess: invalidate })}>
                        <Eye className="mr-2 h-4 w-4 text-blue-500" /> reviewing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "matched" } }, { onSuccess: invalidate })}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-purple-500" /> matched
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "pending" } }, { onSuccess: invalidate })}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" /> pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "cancelled" } }, { onSuccess: invalidate })}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> cancelled
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(project.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-gray-400">No projects found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AddProjectDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={invalidate} />

      {deleteTarget !== null && (
        <ConfirmDialog
          open={true}
          title="Delete Project"
          description="Permanently delete this project request? This cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

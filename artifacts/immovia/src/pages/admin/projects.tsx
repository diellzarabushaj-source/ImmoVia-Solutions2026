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
  Plus, Hammer, Eye, Search, Globe
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CATEGORIES, getCategoryLabel, type Lang } from "@/lib/categories";
import { useLanguage } from "@/lib/language-context";

function AddProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", projectType: "renovation",
    title: "", description: "", city: "", budget: "", timeline: "",
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
      if (form.title.trim()) body.title = form.title;
      if (form.budget.trim()) body.budget = form.budget;
      if (form.timeline.trim()) body.timeline = form.timeline;
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? t.admin.failed); return; }
      onCreated(); onClose();
      setForm({ fullName: "", email: "", phone: "", projectType: "renovation", title: "", description: "", city: "", budget: "", timeline: "" });
    } catch { setError(t.admin.connectionErrorShort); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Hammer className="h-4 w-4" /> {t.admin.projAdd}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t.admin.fFullName}</Label><Input value={form.fullName} onChange={set("fullName")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>{t.admin.fEmail}</Label><Input type="email" value={form.email} onChange={set("email")} required disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t.admin.fPhone}</Label><Input value={form.phone} onChange={set("phone")} required disabled={loading} /></div>
            <div className="space-y-1.5"><Label>{t.admin.fCity}</Label><Input value={form.city} onChange={set("city")} required disabled={loading} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.fProjectType}</Label>
            <Select value={form.projectType} onValueChange={(v) => setForm((f) => ({ ...f, projectType: v }))}>
              <SelectTrigger disabled={loading}><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>{getCategoryLabel(cat, language as Lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{t.admin.fTitle}</Label><Input value={form.title} onChange={set("title")} disabled={loading} placeholder={t.admin.phTitleExample} /></div>
          <div className="space-y-1.5"><Label>{t.admin.fDescription}</Label><Textarea value={form.description} onChange={set("description")} required disabled={loading} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t.admin.fBudget}</Label><Input value={form.budget} onChange={set("budget")} disabled={loading} placeholder={t.admin.phBudgetExample} /></div>
            <div className="space-y-1.5"><Label>{t.admin.fTimeline}</Label><Input value={form.timeline} onChange={set("timeline")} disabled={loading} placeholder={t.admin.phTimelineExample} /></div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t.admin.cancel}</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.admin.saving}</> : t.admin.projAdd}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminProjects() {
  const { t } = useLanguage();
  const qc = useQueryClient();
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
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.fullName.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.projectType.toLowerCase().includes(q) ||
      ((p as { title?: string | null }).title ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.admin.projTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.admin.totalProjectRequests.replace("{n}", String(projects?.length ?? 0))}</p>
        </div>
        <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> {t.admin.projAdd}
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder={t.admin.searchProjects} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.allStatuses}</SelectItem>
            <SelectItem value="pending">{t.admin.stPendingReview}</SelectItem>
            <SelectItem value="reviewing">{t.admin.stReviewing}</SelectItem>
            <SelectItem value="open">{t.admin.stOpen}</SelectItem>
            <SelectItem value="matched">{t.admin.stMatched}</SelectItem>
            <SelectItem value="cancelled">{t.admin.stCancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colTitleProject}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colClient}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colLocation}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colBudget}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colSize}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.date}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.status}</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!isLoading && filtered.map((project) => (
              <TableRow key={project.id} className="hover:bg-gray-50">
                <TableCell className="max-w-[220px]">
                  <div className="font-semibold text-sm text-gray-900 truncate">
                    {(project as { title?: string | null }).title ?? <span className="text-gray-400 font-normal italic">{t.admin.noTitle}</span>}
                  </div>
                  <div className="text-xs text-gray-500 capitalize mt-0.5">{project.projectType}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{project.fullName}</div>
                  <div className="text-xs text-gray-500">{project.email}</div>
                </TableCell>
                <TableCell className="text-sm">{project.city}</TableCell>
                <TableCell className="text-sm text-gray-600">{project.budget ?? "—"}</TableCell>
                <TableCell className="text-sm text-gray-600">{(project as { size?: string }).size ?? "—"}</TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(project.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell><StatusBadge status={project.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(project.status === "pending" || project.status === "reviewing") && (
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        disabled={updateProject.isPending}
                        onClick={() => updateProject.mutate(
                          { id: project.id, data: { status: "open" } },
                          {
                            onSuccess: () => { invalidate(); toast.success(t.admin.toastProjectPublished); },
                            onError: () => toast.error(t.admin.toastProjectPublishFailed),
                          }
                        )}
                        title={t.admin.publishToWebsite}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {t.admin.publish}
                      </Button>
                    )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t.admin.actions}</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <a href={`/projects/${project.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" /> {t.admin.viewProjectPage}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-400 font-normal">{t.admin.setStatus}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "open" } }, { onSuccess: invalidate })}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> {t.admin.stOpen}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "reviewing" } }, { onSuccess: invalidate })}>
                        <Eye className="mr-2 h-4 w-4 text-blue-500" /> {t.admin.stReviewing}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "matched" } }, { onSuccess: invalidate })}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-purple-500" /> {t.admin.stMatched}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "pending" } }, { onSuccess: invalidate })}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" /> {t.admin.stPendingReview}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateProject.mutate({ id: project.id, data: { status: "cancelled" } }, { onSuccess: invalidate })}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> {t.admin.stCancelled}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(project.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> {t.admin.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-400">{t.admin.noProjectsFound}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AddProjectDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={invalidate} />

      {deleteTarget !== null && (
        <ConfirmDialog
          open={true}
          title={t.admin.projDelete}
          description={t.admin.confirmDeleteProject}
          confirmLabel={t.admin.delete}
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

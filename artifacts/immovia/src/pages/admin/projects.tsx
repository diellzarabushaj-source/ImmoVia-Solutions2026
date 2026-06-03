import { useState } from "react";
import {
  useListProjects, useUpdateProject, useDeleteProject,
  getListProjectsQueryKey, getGetAdminStatsQueryKey,
  type Project
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
  Plus, Hammer, Eye, Search, Globe, LayoutGrid, Table2, Archive
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProjectCard, type ProjectCardData } from "@/components/project/ProjectCard";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/lib/language-context";

function AddProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useLanguage();
  const { categories } = useCategories("project");
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
                {categories.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
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

type AdminProject = Project;

function toCardData(p: AdminProject): ProjectCardData {
  const x = p as unknown as Record<string, unknown>;
  return {
    id: p.id,
    title: (x.title as string | null) ?? null,
    projectType: p.projectType,
    subcategory: (x.subcategory as string | null) ?? null,
    description: p.description,
    city: p.city,
    budget: p.budget ?? null,
    timeline: p.timeline ?? null,
    size: (x.size as string | null) ?? null,
    status: p.status,
    photos: (x.photos as string[] | null) ?? null,
    posterName: (x.posterName as string | null) ?? null,
    posterType: (x.posterType as string | null) ?? null,
    posterAvatarUrl: (x.posterAvatarUrl as string | null) ?? null,
    offersCount: (x.offersCount as number | null) ?? null,
    createdAt: p.createdAt,
  };
}

export function AdminProjects() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [view, setView] = useState<"table" | "cards">(
    () => (typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table")
  );

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

  const handleArchive = (id: number) =>
    updateProject.mutate(
      { id, data: { status: "archived" } },
      {
        onSuccess: () => { invalidate(); toast.success(t.admin.toastProjectArchived); },
        onError: () => toast.error(t.admin.toastProjectArchiveFailed),
      }
    );

  const handlePublish = (id: number) =>
    updateProject.mutate(
      { id, data: { status: "open" } },
      {
        onSuccess: () => { invalidate(); toast.success(t.admin.toastProjectPublished); },
        onError: () => toast.error(t.admin.toastProjectPublishFailed),
      }
    );

  const setStatus = (id: number, status: string) =>
    updateProject.mutate({ id, data: { status } }, { onSuccess: invalidate });

  function renderActions(project: AdminProject) {
    return (
      <div className="flex items-center justify-end gap-1">
        {(project.status === "pending" || project.status === "reviewing") && (
          <Button
            size="sm"
            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            disabled={updateProject.isPending}
            onClick={() => handlePublish(project.id)}
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
            <DropdownMenuItem onClick={() => setStatus(project.id, "open")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> {t.admin.stOpen}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(project.id, "reviewing")}>
              <Eye className="mr-2 h-4 w-4 text-blue-500" /> {t.admin.stReviewing}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(project.id, "matched")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-purple-500" /> {t.admin.stMatched}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(project.id, "pending")}>
              <Clock className="mr-2 h-4 w-4 text-yellow-500" /> {t.admin.stPendingReview}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus(project.id, "cancelled")}>
              <XCircle className="mr-2 h-4 w-4 text-red-500" /> {t.admin.stCancelled}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleArchive(project.id)}>
              <Archive className="mr-2 h-4 w-4 text-amber-600" /> {t.admin.archive}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(project.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> {t.admin.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

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
        <div className="ml-auto inline-flex rounded-md border border-gray-200 p-0.5 bg-white">
          <Button
            size="sm"
            variant={view === "table" ? "default" : "ghost"}
            className={`h-8 px-2.5 text-xs gap-1.5 ${view === "table" ? "bg-[#1a3a6e] hover:bg-[#0f2044]" : "text-gray-600"}`}
            onClick={() => setView("table")}
          >
            <Table2 className="h-4 w-4" /> {t.admin.viewTable}
          </Button>
          <Button
            size="sm"
            variant={view === "cards" ? "default" : "ghost"}
            className={`h-8 px-2.5 text-xs gap-1.5 ${view === "cards" ? "bg-[#1a3a6e] hover:bg-[#0f2044]" : "text-gray-600"}`}
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="h-4 w-4" /> {t.admin.viewCards}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="border border-gray-200 shadow-sm h-40 flex items-center justify-center text-gray-400 text-sm">
          {t.admin.noProjectsFound}
        </Card>
      )}

      {!isLoading && filtered.length > 0 && view === "table" && (
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
              {filtered.map((project) => (
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
                  <TableCell className="text-right">{renderActions(project)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!isLoading && filtered.length > 0 && view === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={toCardData(project)}
              disableLink
              showStatus
              showPoster={false}
              footer={
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <div className="text-xs leading-relaxed">
                    <div className="font-medium text-foreground/80">{project.fullName}</div>
                    <div className="text-muted-foreground">{project.email}</div>
                    {project.phone && <div className="text-muted-foreground">{project.phone}</div>}
                  </div>
                  {renderActions(project)}
                </div>
              }
            />
          ))}
        </div>
      )}

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

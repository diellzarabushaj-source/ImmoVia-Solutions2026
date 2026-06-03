import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Tag, Power, Search, GitBranch, Wrench, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useLanguage } from "@/lib/language-context";

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  active: boolean;
  parentId: number | null;
  createdAt: string;
}

const SERVICE_DEFAULTS = [
  { name: "Renovation & Construction", slug: "renovation", type: "service" },
  { name: "Painting & Plastering", slug: "painting", type: "service" },
  { name: "Electrical & Smart Home", slug: "electrical", type: "service" },
  { name: "Plumbing & Bathroom", slug: "plumbing", type: "service" },
  { name: "Kitchen & Carpentry", slug: "kitchen", type: "service" },
  { name: "Flooring & Tiles", slug: "flooring", type: "service" },
  { name: "Interior Design", slug: "interior_design", type: "service" },
  { name: "Cleaning, Garden & Property", slug: "cleaning", type: "service" },
  { name: "Other", slug: "other", type: "service" },
];

const PROJECT_DEFAULTS = [
  { name: "Renovation & Construction", slug: "renovation", type: "project" },
  { name: "Painting & Plastering", slug: "painting", type: "project" },
  { name: "Electrical & Smart Home", slug: "electrical", type: "project" },
  { name: "Plumbing & Bathroom", slug: "plumbing", type: "project" },
  { name: "Kitchen & Carpentry", slug: "kitchen", type: "project" },
  { name: "Flooring & Tiles", slug: "flooring", type: "project" },
  { name: "Interior Design", slug: "interior_design", type: "project" },
  { name: "Cleaning, Garden & Property", slug: "cleaning", type: "project" },
  { name: "Emergency Repair", slug: "emergency_repair", type: "project" },
  { name: "Other", slug: "other", type: "project" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function CategoryDialog({
  open, onClose, onSaved, initial, allCategories, defaultParentId, defaultType,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Category | null;
  allCategories: Category[];
  defaultParentId?: number | null;
  defaultType?: string;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [type, setType] = useState(initial?.type ?? defaultType ?? "service");
  const [active, setActive] = useState(initial?.active !== undefined ? initial.active : true);
  const [parentId, setParentId] = useState<number | null>(
    initial?.parentId !== undefined ? (initial.parentId ?? null) : (defaultParentId ?? null)
  );

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setType(initial?.type ?? defaultType ?? "service");
      setActive(initial?.active !== undefined ? initial.active : true);
      setParentId(initial?.parentId !== undefined ? (initial.parentId ?? null) : (defaultParentId ?? null));
      setError("");
    }
  }, [open, initial, defaultParentId, defaultType]);

  const parentOptions = allCategories.filter(
    (c) => c.parentId === null && c.id !== initial?.id && c.type === type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { setError(t.admin.nameSlugRequired); return; }
    setError(""); setLoading(true);
    try {
      const url = initial ? `/api/admin/categories/${initial.id}` : "/api/admin/categories";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, slug, type, active, parentId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? t.admin.failed); return; }
      onSaved(); onClose();
    } catch { setError(t.admin.connectionErrorShort); } finally { setLoading(false); }
  };

  const isEditing = !!initial;
  const isSubcategory = parentId !== null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.admin.catEdit : (isSubcategory ? t.admin.catAddSub : t.admin.catAdd)}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t.admin.type}</Label>
            <Select value={type} onValueChange={(v) => { setType(v); setParentId(null); }} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="service">{t.admin.optService}</SelectItem>
                <SelectItem value="project">{t.admin.optProject}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.catParent}</Label>
            <Select
              value={parentId !== null ? String(parentId) : "__none__"}
              onValueChange={(v) => setParentId(v === "__none__" ? null : Number(v))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.admin.catMainCategory}</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.fName}</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} required disabled={loading} placeholder={t.admin.phNameExample} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.fSlug}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={loading} placeholder={t.admin.phSlugExample} />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${active ? "bg-[#1a3a6e]" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <Label className="cursor-pointer" onClick={() => setActive((v) => !v)}>{active ? t.admin.active : t.admin.inactive}</Label>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t.admin.cancel}</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.admin.saving}</> : t.admin.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCategories() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"service" | "project">("service");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setCategories(data as Category[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const tabCategories = categories.filter((c) => c.type === activeTab);
  const parents = tabCategories.filter((c) => c.parentId === null);
  const subcategoriesByParent = (parentId: number) =>
    tabCategories.filter((c) => c.parentId === parentId);

  const filtered = tabCategories.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchActive = activeFilter === "all" ||
      (activeFilter === "active" ? c.active : !c.active);
    return matchSearch && matchActive;
  });

  const filteredParents = filtered.filter((c) => c.parentId === null);
  const filteredSubcategories = (parentId: number) =>
    filtered.filter((c) => c.parentId === parentId);

  const allFilteredRows: Category[] = [];
  for (const p of filteredParents) {
    allFilteredRows.push(p);
    allFilteredRows.push(...filteredSubcategories(p.id));
  }
  const orphanSubs = filtered.filter((c) => c.parentId !== null && !tabCategories.find(p => p.id === c.parentId));
  allFilteredRows.push(...orphanSubs);

  const deleteCategory = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert((d as { error?: string }).error ?? t.admin.failed);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    load();
  };

  const toggleActive = async (cat: Category) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ active: !cat.active }),
    });
    load();
  };

  const seedDefaults = async () => {
    const defaults = activeTab === "service" ? SERVICE_DEFAULTS : PROJECT_DEFAULTS;
    setSeeding(true);
    for (const cat of defaults) {
      await fetch("/api/admin/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(cat),
      }).catch(() => {});
    }
    setSeeding(false);
    load();
  };

  const openAdd = (parentIdArg?: number | null) => {
    setEditing(null);
    setDefaultParentId(parentIdArg ?? null);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setDefaultParentId(null);
    setDialogOpen(true);
  };

  const parentName = (parentId: number | null) => {
    if (parentId === null) return null;
    return categories.find((c) => c.id === parentId)?.name ?? `#${parentId}`;
  };

  const childCount = (id: number) => subcategoriesByParent(id).length;

  const serviceCount = categories.filter(c => c.type === "service").length;
  const projectCount = categories.filter(c => c.type === "project").length;
  const tabCount = activeTab === "service" ? serviceCount : projectCount;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.admin.catTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {serviceCount} {t.admin.catTabService.toLowerCase()} · {projectCount} {t.admin.catTabProject.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {tabCount === 0 && (
            <Button variant="outline" size="sm" onClick={seedDefaults} disabled={seeding}>
              {seeding ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{t.admin.saving}</> : <><Tag className="h-4 w-4 mr-1.5" />{t.admin.seedDefaults}</>}
            </Button>
          )}
          <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => openAdd(null)}>
            <Plus className="h-4 w-4 mr-1.5" /> {t.admin.catAdd}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setActiveTab("service"); setSearch(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "service"
              ? "bg-white text-[#1a3a6e] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          {t.admin.catTabService}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === "service" ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"}`}>
            {serviceCount}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab("project"); setSearch(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "project"
              ? "bg-white text-[#1a3a6e] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {t.admin.catTabProject}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === "project" ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"}`}>
            {projectCount}
          </span>
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder={t.admin.searchCategories} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.optAll}</SelectItem>
            <SelectItem value="active">{t.admin.active}</SelectItem>
            <SelectItem value="inactive">{t.admin.inactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colName}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.catColParent}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colSlug}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.status}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colCreated}</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!loading && allFilteredRows.map((cat) => {
              const isChild = cat.parentId !== null;
              const children = childCount(cat.id);
              return (
                <TableRow key={cat.id} className={`hover:bg-gray-50 ${isChild ? "bg-gray-50/50" : ""}`}>
                  <TableCell className="font-medium text-sm">
                    {isChild ? (
                      <span className="flex items-center gap-1.5 pl-4 text-gray-700">
                        <span className="text-gray-300">└</span>
                        {cat.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {cat.name}
                        {children > 0 && (
                          <span className="text-xs text-gray-400 font-normal">({children})</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {isChild
                      ? <span className="text-[#1a3a6e] font-medium">{parentName(cat.parentId)}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </TableCell>
                  <TableCell><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{cat.slug}</code></TableCell>
                  <TableCell>
                    {cat.active
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{t.admin.active}</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />{t.admin.inactive}</span>}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{format(new Date(cat.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isChild && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-[#1a3a6e]"
                          title={t.admin.catAddSub}
                          onClick={() => openAdd(cat.id)}
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-[#1a3a6e]" title={cat.active ? t.admin.deactivate : t.admin.activate} onClick={() => toggleActive(cat)}>
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(cat)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && allFilteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    {activeTab === "service" ? <Wrench className="h-8 w-8 opacity-30" /> : <FolderOpen className="h-8 w-8 opacity-30" />}
                    <p className="text-sm">
                      {tabCount === 0 ? t.admin.noCategoriesYet : t.admin.noCategoriesMatch}
                    </p>
                    {tabCount === 0 && (
                      <Button size="sm" variant="outline" onClick={seedDefaults} disabled={seeding}>
                        {seeding ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Tag className="h-3.5 w-3.5 mr-1.5" />}
                        {t.admin.seedDefaults}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        initial={editing}
        allCategories={categories}
        defaultParentId={defaultParentId}
        defaultType={activeTab}
      />

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title={t.admin.catDelete}
          description={
            childCount(deleteTarget.id) > 0
              ? t.admin.catDeleteWithChildren
              : t.admin.confirmDeleteCategory
          }
          confirmLabel={t.admin.delete}
          variant="destructive"
          onConfirm={deleteCategory}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

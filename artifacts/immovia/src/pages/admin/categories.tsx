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
import { Loader2, Plus, Pencil, Trash2, Tag, Power, Search } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useLanguage } from "@/lib/language-context";

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  active: boolean;
  createdAt: string;
}

const DEFAULTS = [
  { name: "Renovation", slug: "renovation", type: "service" },
  { name: "Construction", slug: "construction", type: "service" },
  { name: "Interior Design", slug: "interior-design", type: "service" },
  { name: "Plumbing", slug: "plumbing", type: "service" },
  { name: "Electrical", slug: "electrical", type: "service" },
  { name: "Painting", slug: "painting", type: "service" },
  { name: "Flooring", slug: "flooring", type: "service" },
  { name: "Roofing", slug: "roofing", type: "service" },
  { name: "Landscaping", slug: "landscaping", type: "service" },
  { name: "HVAC", slug: "hvac", type: "service" },
  { name: "Cleaning", slug: "cleaning", type: "service" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function CategoryDialog({
  open, onClose, onSaved, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Category | null;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [type, setType] = useState(initial?.type ?? "service");
  const [active, setActive] = useState(initial?.active !== undefined ? initial.active : true);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setType(initial?.type ?? "service");
      setActive(initial?.active !== undefined ? initial.active : true);
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { setError(t.admin.nameSlugRequired); return; }
    setError(""); setLoading(true);
    try {
      const url = initial ? `/api/admin/categories/${initial.id}` : "/api/admin/categories";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ name, slug, type, active }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? t.admin.failed); return; }
      onSaved(); onClose();
    } catch { setError(t.admin.connectionErrorShort); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial ? t.admin.catEdit : t.admin.catAdd}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t.admin.fName}</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} required disabled={loading} placeholder={t.admin.phNameExample} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.fSlug}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={loading} placeholder={t.admin.phSlugExample} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.admin.type}</Label>
            <Select value={type} onValueChange={setType} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="service">{t.admin.optService}</SelectItem>
                <SelectItem value="project">{t.admin.optProject}</SelectItem>
              </SelectContent>
            </Select>
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
  const [seeding, setSeeding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setCategories(data as Category[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = categories.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchActive = activeFilter === "all" ||
      (activeFilter === "active" ? c.active : !c.active);
    return matchSearch && matchActive;
  });

  const deleteCategory = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
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
    setSeeding(true);
    for (const cat of DEFAULTS) {
      await fetch("/api/admin/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(cat),
      }).catch(() => {});
    }
    setSeeding(false);
    load();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.admin.catTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} {t.admin.navCategories.toLowerCase()} — {categories.filter((c) => c.active).length} {t.admin.active.toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button variant="outline" size="sm" onClick={seedDefaults} disabled={seeding}>
              {seeding ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{t.admin.saving}</> : <><Tag className="h-4 w-4 mr-1.5" />{t.admin.seedDefaults}</>}
            </Button>
          )}
          <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> {t.admin.catAdd}
          </Button>
        </div>
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
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colSlug}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.type}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.status}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">{t.admin.colCreated}</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!loading && filtered.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                <TableCell><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{cat.slug}</code></TableCell>
                <TableCell className="text-sm capitalize text-gray-600">{cat.type}</TableCell>
                <TableCell>
                  {cat.active
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{t.admin.active}</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />{t.admin.inactive}</span>}
                </TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(cat.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-[#1a3a6e]" title={cat.active ? t.admin.deactivate : t.admin.activate} onClick={() => toggleActive(cat)}>
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(cat); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-400">{categories.length === 0 ? t.admin.noCategoriesYet : t.admin.noCategoriesMatch}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        initial={editing}
      />

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title={t.admin.catDelete}
          description={t.admin.confirmDeleteCategory}
          confirmLabel={t.admin.delete}
          variant="destructive"
          onConfirm={deleteCategory}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

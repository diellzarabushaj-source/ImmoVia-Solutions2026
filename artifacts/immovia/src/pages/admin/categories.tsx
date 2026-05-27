import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Tag } from "lucide-react";
import { format } from "date-fns";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

const DEFAULTS = [
  { name: "Renovation", slug: "renovation", description: "General renovation services" },
  { name: "Construction", slug: "construction", description: "New builds and structural work" },
  { name: "Interior Design", slug: "interior-design", description: "Interior decoration and design" },
  { name: "Plumbing", slug: "plumbing", description: "Plumbing installation and repair" },
  { name: "Electrical", slug: "electrical", description: "Electrical installation and maintenance" },
  { name: "Painting", slug: "painting", description: "Interior and exterior painting" },
  { name: "Flooring", slug: "flooring", description: "Floor installation and finishing" },
  { name: "Roofing", slug: "roofing", description: "Roof installation and repair" },
  { name: "Landscaping", slug: "landscaping", description: "Garden and outdoor services" },
  { name: "HVAC", slug: "hvac", description: "Heating, ventilation and air conditioning" },
  { name: "Cleaning", slug: "cleaning", description: "Professional cleaning services" },
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setDescription(initial?.description ?? "");
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { setError("Name and slug are required."); return; }
    setError(""); setLoading(true);
    try {
      const url = initial ? `/api/admin/categories/${initial.id}` : "/api/admin/categories";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ name, slug, description: description || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? "Failed."); return; }
      onSaved(); onClose();
    } catch { setError("Connection error."); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} required disabled={loading} placeholder="e.g. Renovation" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug *</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={loading} placeholder="e.g. renovation" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={loading} placeholder="Short description…" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-[#1a3a6e] hover:bg-[#0f2044]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setCategories(data as Category[]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE", credentials: "include" });
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
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categories defined</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button variant="outline" size="sm" onClick={seedDefaults} disabled={seeding}>
              {seeding ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Seeding…</> : <><Tag className="h-4 w-4 mr-1.5" />Seed Defaults</>}
            </Button>
          )}
          <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Category
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Slug</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Description</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Created</TableHead>
              <TableHead className="text-right text-xs font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
            )}
            {!loading && categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                <TableCell><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{cat.slug}</code></TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[240px] truncate">{cat.description ?? "—"}</TableCell>
                <TableCell className="text-xs text-gray-500">{format(new Date(cat.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(cat); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && categories.length === 0 && (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-gray-400">No categories yet. Use "Seed Defaults" to add standard service types.</TableCell></TableRow>
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
    </div>
  );
}

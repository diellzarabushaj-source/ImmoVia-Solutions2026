import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, X, Star, Images } from "lucide-react";
import { PhotoUploader } from "@/components/photo-uploader";

const CATS = [
  "Renovierung & Umbau", "Neubau & Bauarbeiten", "Innenarchitektur",
  "Fassadenarbeiten", "Sanitär & Badezimmer", "Elektroinstallation",
  "Maler & Gipser", "Boden & Platten", "Heizung & Energie",
  "Küche & Schreinerarbeiten", "Garten & Aussenbereich", "Dach & Spenglerei",
  "Sonstiges",
];

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Galerie & Portfolio",
    add: "Projektfoto hinzufügen",
    empty: "Noch keine Portfolio-Bilder vorhanden.",
    emptyHint: "Fügen Sie Fotos Ihrer Arbeiten hinzu, um Ihr Profil attraktiver zu machen.",
    imageLabel: "Foto hochladen",
    itemTitle: "Titel",
    itemTitlePlaceholder: "z.B. Badezimmer-Renovierung Zürich",
    description: "Kurzbeschreibung",
    descPlaceholder: "Beschreiben Sie das Projekt kurz...",
    category: "Kategorie",
    city: "Stadt",
    cityPlaceholder: "z.B. Zürich",
    date: "Projektdatum",
    isBeforeAfter: "Vorher/Nachher",
    isFeatured: "Als Titelbild verwenden",
    save: "Hinzufügen",
    cancel: "Abbrechen",
    delete: "Löschen",
    featured: "Titelbild",
    saving: "Speichern...",
    deleteConfirm: "Bild löschen?",
    portfolioTitle: "Arbeitsbeispiele & Portfolio",
  },
  en: {
    title: "Gallery & Portfolio",
    add: "Add project photo",
    empty: "No portfolio photos yet.",
    emptyHint: "Add photos of your work to make your profile more attractive.",
    imageLabel: "Upload photo",
    itemTitle: "Title",
    itemTitlePlaceholder: "e.g. Bathroom renovation Zurich",
    description: "Short description",
    descPlaceholder: "Briefly describe the project...",
    category: "Category",
    city: "City",
    cityPlaceholder: "e.g. Zurich",
    date: "Project date",
    isBeforeAfter: "Before/After",
    isFeatured: "Use as featured photo",
    save: "Add",
    cancel: "Cancel",
    delete: "Delete",
    featured: "Featured",
    saving: "Saving...",
    deleteConfirm: "Delete photo?",
    portfolioTitle: "Work examples & Portfolio",
  },
  sq: {
    title: "Galeria & Portofoli",
    add: "Shto foto projekti",
    empty: "Ende asnjë foto portofoli.",
    emptyHint: "Shto foto nga punimet tuaja për të bërë profilin tuaj më tërheqës.",
    imageLabel: "Ngarko foto",
    itemTitle: "Titulli",
    itemTitlePlaceholder: "p.sh. Rinovim banio Tiranë",
    description: "Përshkrim i shkurtër",
    descPlaceholder: "Përshkruani projektin shkurtimisht...",
    category: "Kategoria",
    city: "Qyteti",
    cityPlaceholder: "p.sh. Tiranë",
    date: "Data e projektit",
    isBeforeAfter: "Para/Pas",
    isFeatured: "Përdor si fotografi kryesore",
    save: "Shto",
    cancel: "Anulo",
    delete: "Fshi",
    featured: "Kryesore",
    saving: "Duke ruajtur...",
    deleteConfirm: "Fshi foton?",
    portfolioTitle: "Shembuj punimesh & Portofoli",
  },
  fr: {
    title: "Galerie & Portfolio",
    add: "Ajouter une photo de projet",
    empty: "Pas encore de photos de portfolio.",
    emptyHint: "Ajoutez des photos de vos travaux pour rendre votre profil plus attractif.",
    imageLabel: "Télécharger une photo",
    itemTitle: "Titre",
    itemTitlePlaceholder: "ex. Rénovation salle de bain Zurich",
    description: "Courte description",
    descPlaceholder: "Décrivez brièvement le projet...",
    category: "Catégorie",
    city: "Ville",
    cityPlaceholder: "ex. Zurich",
    date: "Date du projet",
    isBeforeAfter: "Avant/Après",
    isFeatured: "Utiliser comme photo vedette",
    save: "Ajouter",
    cancel: "Annuler",
    delete: "Supprimer",
    featured: "Vedette",
    saving: "Enregistrement...",
    deleteConfirm: "Supprimer la photo ?",
    portfolioTitle: "Exemples de travaux & Portfolio",
  },
};

interface PortfolioItem {
  id: number;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  isBeforeAfter?: boolean | null;
  projectDate?: string | null;
  isFeatured?: boolean | null;
  sortOrder: number;
}

interface Props {
  language: string;
}

const DEFAULT_FORM = {
  imageUrl: "",
  imagePath: "",
  title: "",
  description: "",
  category: "",
  city: "",
  projectDate: "",
  isBeforeAfter: false,
  isFeatured: false,
};

export default function GalerieSection({ language }: Props) {
  const l = L[language] ?? L.de;

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/provider/profile");
      const d = await r.json() as { portfolio: PortfolioItem[] };
      setItems(d.portfolio ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAdd = () => {
    setForm({ ...DEFAULT_FORM });
    setOpen(true);
  };

  const addItem = async () => {
    if (!form.imageUrl) return;
    setSaving(true);
    try {
      const r = await fetch("/api/provider/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: form.imageUrl,
          title: form.title || null,
          description: form.description || null,
          category: form.category || null,
          city: form.city || null,
          projectDate: form.projectDate || null,
          isBeforeAfter: form.isBeforeAfter,
          isFeatured: form.isFeatured,
        }),
      });
      if (r.ok) {
        setOpen(false);
        await load();
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`/api/provider/portfolio/${id}`, { method: "DELETE" });
      await load();
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    try {
      await fetch(`/api/provider/portfolio/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      await load();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold">{l.title}</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          {l.add}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Images className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">{l.empty}</p>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">{l.emptyHint}</p>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {l.add}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-video bg-muted">
                <img src={item.imageUrl} alt={item.title ?? ""} className="w-full h-full object-cover" />
                {item.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {l.featured}
                    </Badge>
                  </div>
                )}
                {item.isBeforeAfter && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">{l.isBeforeAfter}</Badge>
                  </div>
                )}
              </div>
              <div className="p-3">
                {item.title && <p className="text-sm font-semibold line-clamp-1">{item.title}</p>}
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                  {item.city && <Badge variant="outline" className="text-xs">{item.city}</Badge>}
                  {item.projectDate && <span className="text-xs text-muted-foreground">{item.projectDate}</span>}
                </div>
                {item.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => toggleFeatured(item)}
                  >
                    <Star className={`w-3 h-3 mr-1 ${item.isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
                    {item.isFeatured ? "Titelbild" : "Featured"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs"
                    onClick={() => deleteItem(item.id)}
                    disabled={deleting === item.id}
                  >
                    {deleting === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{l.add}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1 block">{l.imageLabel}</Label>
              {form.imageUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, imageUrl: "", imagePath: "" }))}>
                    <X className="w-3.5 h-3.5 mr-1" /> {l.delete}
                  </Button>
                </div>
              ) : (
                <PhotoUploader
                  label={l.imageLabel}
                  hint=""
                  value={form.imagePath ? [form.imagePath] : []}
                  onChange={(paths) => {
                    if (paths[0]) {
                      setForm(f => ({ ...f, imagePath: paths[0], imageUrl: `/api/storage${paths[0]}` }));
                    }
                  }}
                />
              )}
            </div>
            <div>
              <Label className="text-xs mb-1 block">{l.itemTitle}</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={l.itemTitlePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">{l.category}</Label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">—</option>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">{l.city}</Label>
                <Input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder={l.cityPlaceholder}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">{l.date}</Label>
              <Input
                value={form.projectDate}
                onChange={e => setForm(f => ({ ...f, projectDate: e.target.value }))}
                placeholder="2024-03"
                type="month"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{l.description}</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={l.descPlaceholder}
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBeforeAfter}
                  onChange={e => setForm(f => ({ ...f, isBeforeAfter: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">{l.isBeforeAfter}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">{l.isFeatured}</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{l.cancel}</Button>
            <Button onClick={addItem} disabled={!form.imageUrl || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {l.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

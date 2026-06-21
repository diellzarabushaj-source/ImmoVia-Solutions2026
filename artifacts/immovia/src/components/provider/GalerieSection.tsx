import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, X, Star, Images, Pencil, Check } from "lucide-react";
import { PhotoUploader } from "@/components/photo-uploader";

/** Max gallery photos by plan slug. Basic/free → 5, pro/premium → 10 */
function photoLimit(planSlug: string): number {
  if (planSlug === "premium" || planSlug === "pro" || planSlug === "professional") return 10;
  return 5;
}

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Portfolio",
    subtitle: "Fügen Sie Fotos Ihrer Projekte hinzu. Klicken Sie auf einen Titel oder eine Beschreibung, um sie direkt zu bearbeiten.",
    add: "Foto hinzufügen",
    empty: "Noch keine Portfolio-Fotos.",
    emptyHint: "Zeigen Sie Ihre besten Projekte und überzeugen Sie potenzielle Kunden.",
    limitReached: "Foto-Limit erreicht ({limit}). Upgrade für mehr Fotos.",
    imageLabel: "Foto hochladen",
    captionTitle: "Titel (optional)",
    captionTitlePlaceholder: "z.B. Badezimmer-Renovierung Zürich",
    captionDesc: "Beschreibung (optional)",
    captionDescPlaceholder: "Kurze Beschreibung des Projekts…",
    save: "Hinzufügen",
    cancel: "Abbrechen",
    saving: "Speichern…",
    deleteConfirm: "Bild löschen?",
    featured: "Titelbild",
    clickToEdit: "Klicken zum Bearbeiten",
    noCaption: "Kein Titel — klicken zum Hinzufügen",
    saved: "Gespeichert",
  },
  en: {
    title: "Portfolio",
    subtitle: "Add photos of your projects. Click any title or description to edit it inline.",
    add: "Add photo",
    empty: "No portfolio photos yet.",
    emptyHint: "Show your best work and win over potential clients.",
    limitReached: "Photo limit reached ({limit}). Upgrade for more photos.",
    imageLabel: "Upload photo",
    captionTitle: "Title (optional)",
    captionTitlePlaceholder: "e.g. Bathroom renovation Zurich",
    captionDesc: "Description (optional)",
    captionDescPlaceholder: "Short description of the project…",
    save: "Add",
    cancel: "Cancel",
    saving: "Saving…",
    deleteConfirm: "Delete photo?",
    featured: "Featured",
    clickToEdit: "Click to edit",
    noCaption: "No title — click to add",
    saved: "Saved",
  },
  sq: {
    title: "Portofoli",
    subtitle: "Shto foto nga projektet tuaja. Klikoni mbi titull ose përshkrim për t'i redaktuar drejtpërdrejt.",
    add: "Shto foto",
    empty: "Ende asnjë foto portofoli.",
    emptyHint: "Trego punimet tuaja më të mira dhe bindo klientët e mundshëm.",
    limitReached: "Kufiri i fotove u arrit ({limit}). Ndrysho planin për më shumë.",
    imageLabel: "Ngarko foto",
    captionTitle: "Titulli (opsional)",
    captionTitlePlaceholder: "p.sh. Rinovim banio Tiranë",
    captionDesc: "Përshkrimi (opsional)",
    captionDescPlaceholder: "Përshkrim i shkurtër i projektit…",
    save: "Shto",
    cancel: "Anulo",
    saving: "Duke ruajtur…",
    deleteConfirm: "Fshi foton?",
    featured: "Kryesore",
    clickToEdit: "Kliko për të redaktuar",
    noCaption: "Pa titull — kliko për të shtuar",
    saved: "U ruajt",
  },
  fr: {
    title: "Portfolio",
    subtitle: "Ajoutez des photos de vos projets. Cliquez sur un titre ou une description pour les modifier en ligne.",
    add: "Ajouter une photo",
    empty: "Pas encore de photos de portfolio.",
    emptyHint: "Montrez vos meilleurs travaux et convainquez vos clients potentiels.",
    limitReached: "Limite de photos atteinte ({limit}). Passez à un plan supérieur.",
    imageLabel: "Télécharger une photo",
    captionTitle: "Titre (optionnel)",
    captionTitlePlaceholder: "ex. Rénovation salle de bain Zurich",
    captionDesc: "Description (optionnel)",
    captionDescPlaceholder: "Brève description du projet…",
    save: "Ajouter",
    cancel: "Annuler",
    saving: "Enregistrement…",
    deleteConfirm: "Supprimer la photo ?",
    featured: "Vedette",
    clickToEdit: "Cliquez pour modifier",
    noCaption: "Sans titre — cliquez pour ajouter",
    saved: "Enregistré",
  },
};

interface PortfolioItem {
  id: number;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  isFeatured?: boolean | null;
  sortOrder: number;
}

interface Props {
  language: string;
}

interface InlineEditProps {
  value: string | null | undefined;
  placeholder: string;
  multiline?: boolean;
  onSave: (val: string) => Promise<void>;
  className?: string;
  emptyLabel: string;
}

function InlineEdit({ value, placeholder, multiline, onSave, className = "", emptyLabel }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  const start = () => {
    setDraft(value ?? "");
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const commit = async () => {
    if (draft === (value ?? "")) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); setEditing(false); }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === "Enter") { e.preventDefault(); void commit(); }
    if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
  };

  if (editing) {
    return (
      <div className="flex items-start gap-1.5">
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={onKey}
            placeholder={placeholder}
            rows={2}
            className={`flex-1 text-sm resize-none rounded-md border border-primary/40 bg-transparent px-2 py-1 outline-none focus:border-primary ${className}`}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={onKey}
            placeholder={placeholder}
            className={`flex-1 text-sm rounded-md border border-primary/40 bg-transparent px-2 py-1 outline-none focus:border-primary ${className}`}
          />
        )}
        {saving
          ? <Loader2 className="w-3.5 h-3.5 mt-1.5 shrink-0 animate-spin text-primary" />
          : <Check className="w-3.5 h-3.5 mt-1.5 shrink-0 text-primary cursor-pointer" onClick={() => void commit()} />
        }
      </div>
    );
  }

  return (
    <button
      onClick={start}
      title={placeholder}
      className={`group/ie w-full text-left flex items-start gap-1 hover:bg-muted/60 rounded px-1 -mx-1 transition-colors ${className}`}
    >
      {value
        ? <span className="flex-1 text-sm leading-snug">{value}</span>
        : <span className="flex-1 text-sm text-muted-foreground/50 italic">{emptyLabel}</span>
      }
      <Pencil className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/0 group-hover/ie:text-muted-foreground/50 transition-colors" />
    </button>
  );
}

export default function GalerieSection({ language }: Props) {
  const l = L[language] ?? L.de;

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null);
  const [planSlug, setPlanSlug] = useState<string>("basic");

  useEffect(() => {
    fetch("/api/provider/app-stats")
      .then(r => r.ok ? r.json() as Promise<{ planSlug?: string }> : null)
      .then(d => { if (d?.planSlug) setPlanSlug(d.planSlug); })
      .catch(() => {});
  }, []);

  const maxPhotos = photoLimit(planSlug);
  const atLimit = items.length >= maxPhotos;

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
    setImageUrl(""); setImagePath(""); setNewTitle(""); setNewDesc("");
    setOpen(true);
  };

  const addItem = async () => {
    if (!imageUrl) return;
    setSaving(true);
    try {
      const r = await fetch("/api/provider/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          title: newTitle || null,
          description: newDesc || null,
        }),
      });
      if (r.ok) { setOpen(false); await load(); }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const patchItem = async (id: number, updates: Partial<Pick<PortfolioItem, "title" | "description" | "isFeatured">>) => {
    // optimistic update
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
    await fetch(`/api/provider/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const deleteItem = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`/api/provider/portfolio/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(it => it.id !== id));
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold">{l.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{l.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Button onClick={openAdd} size="sm" disabled={atLimit}>
            <Plus className="w-4 h-4 mr-1.5" />
            {l.add}
          </Button>
          <span className="text-xs text-muted-foreground">{items.length} / {maxPhotos}</span>
        </div>
      </div>
      {atLimit && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {(l.limitReached ?? "").replace("{limit}", String(maxPhotos))}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Images className="w-12 h-12 mx-auto mb-3 text-muted-foreground/25" />
          <p className="text-sm font-medium">{l.empty}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-5">{l.emptyHint}</p>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            {l.add}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden flex flex-col group/card">
              {/* Photo */}
              <div
                className="relative aspect-video bg-muted cursor-zoom-in overflow-hidden"
                onClick={() => setLightbox(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title ?? ""}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
                />
                {/* Hover overlay controls */}
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors" />
                {/* Featured star */}
                <button
                  onClick={e => { e.stopPropagation(); void patchItem(item.id, { isFeatured: !item.isFeatured }); }}
                  title={l.featured}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100 backdrop-blur-sm"
                >
                  <Star className={`w-3.5 h-3.5 ${item.isFeatured ? "fill-amber-400 text-amber-400" : "text-white"}`} />
                </button>
                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); void deleteItem(item.id); }}
                  title={l.deleteConfirm}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 hover:bg-red-500/80 flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100 backdrop-blur-sm"
                  disabled={deleting === item.id}
                >
                  {deleting === item.id
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    : <X className="w-3.5 h-3.5 text-white" />
                  }
                </button>
                {/* Featured badge */}
                {item.isFeatured && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-amber-400/90 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-amber-700 text-amber-700" />
                    {l.featured}
                  </div>
                )}
              </div>

              {/* Caption — inline editable */}
              <div className="p-3 flex-1 flex flex-col gap-1.5">
                <InlineEdit
                  value={item.title}
                  placeholder={l.captionTitlePlaceholder}
                  emptyLabel={l.noCaption}
                  className="font-semibold"
                  onSave={async (val) => { await patchItem(item.id, { title: val || null }); }}
                />
                <InlineEdit
                  value={item.description}
                  placeholder={l.captionDescPlaceholder}
                  multiline
                  emptyLabel="…"
                  className="text-muted-foreground"
                  onSave={async (val) => { await patchItem(item.id, { description: val || null }); }}
                />
              </div>
            </Card>
          ))}

          {/* Add card */}
          <button
            onClick={openAdd}
            className="aspect-video sm:aspect-auto rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors min-h-[160px]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">{l.add}</span>
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-3xl w-full rounded-2xl overflow-hidden bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img src={lightbox.imageUrl} alt="" className="w-full max-h-[65vh] object-contain bg-black" />
            {(lightbox.title || lightbox.description) && (
              <div className="px-5 py-4">
                {lightbox.title && <p className="font-semibold">{lightbox.title}</p>}
                {lightbox.description && <p className="text-sm text-muted-foreground mt-1">{lightbox.description}</p>}
              </div>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add photo dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l.add}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label className="text-xs mb-1.5 block">{l.imageLabel}</Label>
              {imageUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setImageUrl(""); setImagePath(""); }}>
                    <X className="w-3.5 h-3.5 mr-1" /> {l.cancel}
                  </Button>
                </div>
              ) : (
                <PhotoUploader
                  label={l.imageLabel}
                  hint=""
                  value={imagePath ? [imagePath] : []}
                  onChange={(paths) => {
                    if (paths[0]) {
                      setImagePath(paths[0]);
                      setImageUrl(`/api/storage${paths[0]}`);
                    }
                  }}
                />
              )}
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">{l.captionTitle}</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={l.captionTitlePlaceholder}
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">{l.captionDesc}</Label>
              <Textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder={l.captionDescPlaceholder}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{l.cancel}</Button>
            <Button onClick={() => void addItem()} disabled={!imageUrl || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? l.saving : l.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

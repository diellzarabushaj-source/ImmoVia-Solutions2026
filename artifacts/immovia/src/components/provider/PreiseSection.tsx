import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CircleDollarSign, Eye, EyeOff } from "lucide-react";

const PRICE_TYPES = [
  { id: "stundenansatz", de: "Stundenansatz", en: "Hourly rate", sq: "Tarifa orare", fr: "Tarif horaire" },
  { id: "projektbudget", de: "Projektbudget", en: "Project budget", sq: "Buxheti i projektit", fr: "Budget projet" },
  { id: "besichtigung", de: "Preis nach Besichtigung", en: "Price after inspection", sq: "Çmim pas inspektimit", fr: "Prix après visite" },
  { id: "anfrage", de: "Preis auf Anfrage", en: "Price on request", sq: "Çmim sipas kërkesës", fr: "Prix sur demande" },
];

const UNITS = [
  { id: "std", de: "/Std.", en: "/hr", sq: "/orë", fr: "/h" },
  { id: "tag", de: "/Tag", en: "/day", sq: "/ditë", fr: "/jour" },
  { id: "projekt", de: "/Projekt", en: "/project", sq: "/projekt", fr: "/projet" },
  { id: "qm", de: "/m²", en: "/m²", sq: "/m²", fr: "/m²" },
];

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Preise & Richtwerte",
    priceType: "Preisart",
    priceFrom: "Ab CHF",
    unit: "Einheit",
    note: "Kurzer Hinweis",
    notePlaceholder: "z.B. Mindestauftrag CHF 500, Anfahrt gratis",
    showOnProfile: "Auf Profil anzeigen",
    hidden: "Nicht anzeigen",
    disclaimer: "Preise dienen als Orientierung. Der definitive Preis hängt vom Projektumfang, der Besichtigung und dem Angebot des Anbieters ab.",
    preview: "Vorschau",
    save: "Preise speichern",
    saved: "Preise erfolgreich gespeichert.",
    error: "Fehler beim Speichern.",
    priceLabel: "Richtpreis:",
  },
  en: {
    title: "Prices & Guidelines",
    priceType: "Price type",
    priceFrom: "From CHF",
    unit: "Unit",
    note: "Short note",
    notePlaceholder: "e.g. Minimum order CHF 500, free travel",
    showOnProfile: "Show on profile",
    hidden: "Hidden",
    disclaimer: "Prices are indicative. The final price depends on project scope, inspection and the provider's offer.",
    preview: "Preview",
    save: "Save prices",
    saved: "Prices saved successfully.",
    error: "Error saving.",
    priceLabel: "Indicative price:",
  },
  sq: {
    title: "Çmimet & Orientimi",
    priceType: "Lloji i çmimit",
    priceFrom: "Nga CHF",
    unit: "Njësia",
    note: "Shënim i shkurtër",
    notePlaceholder: "p.sh. Porosia minimale CHF 500",
    showOnProfile: "Shfaq në profil",
    hidden: "Fshehur",
    disclaimer: "Çmimet janë orientuese. Çmimi definitiv varet nga fushëveprimi, inspektimi dhe oferta e ofruesit.",
    preview: "Pamje paraprake",
    save: "Ruaj çmimet",
    saved: "Çmimet u ruajtën me sukses.",
    error: "Gabim gjatë ruajtjes.",
    priceLabel: "Çmim orientues:",
  },
  fr: {
    title: "Prix & Tarifs indicatifs",
    priceType: "Type de prix",
    priceFrom: "À partir de CHF",
    unit: "Unité",
    note: "Note courte",
    notePlaceholder: "ex. Commande minimum CHF 500, déplacement gratuit",
    showOnProfile: "Afficher sur le profil",
    hidden: "Masqué",
    disclaimer: "Les prix sont indicatifs. Le prix définitif dépend de l'étendue du projet, de la visite et de l'offre du prestataire.",
    preview: "Aperçu",
    save: "Enregistrer les prix",
    saved: "Prix enregistrés avec succès.",
    error: "Erreur lors de l'enregistrement.",
    priceLabel: "Prix indicatif :",
  },
};

interface Props {
  language: string;
}

export default function PreiseSection({ language }: Props) {
  const l = L[language] ?? L.de;
  const lang = language as "de" | "en" | "sq" | "fr";

  const [priceType, setPriceType] = useState("anfrage");
  const [priceFrom, setPriceFrom] = useState("");
  const [unit, setUnit] = useState("std");
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/provider/profile")
      .then(r => r.json())
      .then((d: { company?: { priceType?: string | null; priceFromChf?: string | null; priceUnit?: string | null; priceNote?: string | null; priceIsPublic?: boolean | null } | null }) => {
        if (d.company?.priceType) setPriceType(d.company.priceType);
        if (d.company?.priceFromChf) setPriceFrom(d.company.priceFromChf);
        if (d.company?.priceUnit) setUnit(d.company.priceUnit);
        if (d.company?.priceNote) setNote(d.company.priceNote);
        if (d.company?.priceIsPublic != null) setIsPublic(d.company.priceIsPublic);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceType,
          priceFromChf: priceFrom ? Number(priceFrom) : null,
          priceUnit: unit,
          priceNote: note,
          priceIsPublic: isPublic,
        }),
      });
      if (!r.ok) throw new Error();
      setMsg({ type: "ok", text: l.saved });
    } catch {
      setMsg({ type: "err", text: l.error });
    } finally {
      setSaving(false);
    }
  };

  const needsAmount = priceType === "stundenansatz" || priceType === "projektbudget";

  const previewLabel = () => {
    const pt = PRICE_TYPES.find(p => p.id === priceType);
    const ptLabel = pt ? pt[lang] ?? pt.de : priceType;
    if (!needsAmount || !priceFrom) return ptLabel;
    const u = UNITS.find(u => u.id === unit);
    const uLabel = u ? u[lang] ?? u.de : unit;
    return `ab CHF ${priceFrom} ${uLabel}`;
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif font-bold">{l.title}</h2>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CircleDollarSign className="w-4 h-4 text-primary" />
          {l.priceType}
        </h3>
        <div className="space-y-2">
          {PRICE_TYPES.map(pt => (
            <label key={pt.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="priceType"
                value={pt.id}
                checked={priceType === pt.id}
                onChange={() => setPriceType(pt.id)}
                className="w-4 h-4 accent-primary"
              />
              <span className={`text-sm ${priceType === pt.id ? "text-primary font-medium" : "text-foreground"}`}>
                {pt[lang] ?? pt.de}
              </span>
            </label>
          ))}
        </div>
      </Card>

      {needsAmount && (
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">{l.priceFrom}</Label>
              <Input
                type="number"
                min={0}
                value={priceFrom}
                onChange={e => setPriceFrom(e.target.value)}
                placeholder="90"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{l.unit}</Label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {UNITS.map(u => (
                  <option key={u.id} value={u.id}>{u[lang] ?? u.de}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <Label className="text-xs mb-1 block">{l.note}</Label>
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={l.notePlaceholder}
          rows={2}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{note.length}/200</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{l.showOnProfile}</p>
            {isPublic && (
              <p className="text-xs text-muted-foreground mt-0.5">{l.priceLabel} {previewLabel()}</p>
            )}
          </div>
          <button
            onClick={() => setIsPublic(p => !p)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isPublic ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {isPublic ? l.showOnProfile : l.hidden}
          </button>
        </div>
        {isPublic && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">{l.disclaimer}</p>
          </div>
        )}
      </Card>

      {isPublic && (
        <Card className="p-5 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">{l.preview}</p>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm">
            {l.priceLabel} {previewLabel()}
          </Badge>
        </Card>
      )}

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-destructive/10 text-destructive"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {l.save}
        </Button>
      </div>
    </div>
  );
}

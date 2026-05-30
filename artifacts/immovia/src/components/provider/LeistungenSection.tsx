import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, MapPin, X } from "lucide-react";

const CATEGORIES = [
  "Renovierung & Umbau",
  "Neubau & Bauarbeiten",
  "Innenarchitektur & Innenausbau",
  "Fassadenarbeiten",
  "Sanitär & Badezimmer",
  "Elektroinstallation & Smart Home",
  "Maler & Gipser",
  "Boden & Platten",
  "Heizung, Klima & Energie",
  "Küche & Schreinerarbeiten",
  "Garten & Aussenbereich",
  "Reinigung & Umzug",
  "Dach & Spenglerei",
  "Immobilienservice",
  "Andere Dienstleistungen",
];

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Leistungen & Kategorien",
    mainCat: "Hauptkategorien",
    mainCatHint: "Wählen Sie alle Kategorien aus, in denen Sie tätig sind.",
    serviceArea: "Servicegebiet / Einsatzregion",
    serviceAreaPlaceholder: "z.B. Zürich, Bern, Luzern",
    specializations: "Spezialisierungen",
    specializationsHint: "Drücken Sie Enter, um eine Spezialisierung hinzuzufügen.",
    specializationsPlaceholder: "z.B. Dachsanierung, Barrierefreier Umbau",
    save: "Leistungen speichern",
    saved: "Leistungen erfolgreich gespeichert.",
    error: "Fehler beim Speichern.",
  },
  en: {
    title: "Services & Categories",
    mainCat: "Main categories",
    mainCatHint: "Select all categories you work in.",
    serviceArea: "Service area / region",
    serviceAreaPlaceholder: "e.g. Zurich, Bern, Lucerne",
    specializations: "Specializations",
    specializationsHint: "Press Enter to add a specialization.",
    specializationsPlaceholder: "e.g. Roof renovation, Accessible remodeling",
    save: "Save services",
    saved: "Services saved successfully.",
    error: "Error saving.",
  },
  sq: {
    title: "Shërbime & Kategori",
    mainCat: "Kategoritë kryesore",
    mainCatHint: "Zgjidhni të gjitha kategoritë ku punoni.",
    serviceArea: "Zona e shërbimit",
    serviceAreaPlaceholder: "p.sh. Tiranë, Shkodër, Durrës",
    specializations: "Specializime",
    specializationsHint: "Shtypni Enter për të shtuar specializim.",
    specializationsPlaceholder: "p.sh. Rinovim çatie, Ristrukturim",
    save: "Ruaj shërbime",
    saved: "Shërbime u ruajtën me sukses.",
    error: "Gabim gjatë ruajtjes.",
  },
  fr: {
    title: "Services & Catégories",
    mainCat: "Catégories principales",
    mainCatHint: "Sélectionnez toutes les catégories dans lesquelles vous travaillez.",
    serviceArea: "Zone de service / région",
    serviceAreaPlaceholder: "ex. Zurich, Berne, Lucerne",
    specializations: "Spécialisations",
    specializationsHint: "Appuyez sur Entrée pour ajouter une spécialisation.",
    specializationsPlaceholder: "ex. Rénovation toiture, Réaménagement accessible",
    save: "Enregistrer les services",
    saved: "Services enregistrés avec succès.",
    error: "Erreur lors de l'enregistrement.",
  },
};

interface Props {
  language: string;
}

export default function LeistungenSection({ language }: Props) {
  const l = L[language] ?? L.de;

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/provider/profile")
      .then(r => r.json())
      .then((d: { company?: { categories?: string[] | null; serviceArea?: string | null; specializations?: string[] | null } | null }) => {
        if (d.company?.categories) setSelectedCats(d.company.categories);
        if (d.company?.serviceArea) setServiceArea(d.company.serviceArea);
        if (d.company?.specializations) setSpecializations(d.company.specializations);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addSpec = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && specInput.trim()) {
      e.preventDefault();
      if (!specializations.includes(specInput.trim())) {
        setSpecializations(prev => [...prev, specInput.trim()]);
      }
      setSpecInput("");
    }
  };

  const removeSpec = (s: string) => setSpecializations(prev => prev.filter(x => x !== s));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCats,
          serviceArea,
          specializations,
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

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif font-bold">{l.title}</h2>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          {l.mainCat}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{l.mainCatHint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCats.includes(cat)}
                onChange={() => toggleCat(cat)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className={`text-sm transition-colors ${selectedCats.includes(cat) ? "text-primary font-medium" : "text-foreground group-hover:text-primary"}`}>
                {cat}
              </span>
            </label>
          ))}
        </div>
        {selectedCats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {selectedCats.map(cat => (
              <Badge key={cat} className="bg-primary/10 text-primary border-primary/20 text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {l.serviceArea}
        </h3>
        <Input
          value={serviceArea}
          onChange={e => setServiceArea(e.target.value)}
          placeholder={l.serviceAreaPlaceholder}
        />
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          {l.specializations}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{l.specializationsHint}</p>
        <Input
          value={specInput}
          onChange={e => setSpecInput(e.target.value)}
          onKeyDown={addSpec}
          placeholder={l.specializationsPlaceholder}
          className="mb-3"
        />
        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specializations.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button onClick={() => removeSpec(s)} className="ml-1 hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

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

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, MapPin, X, Plus, CheckCircle2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import type { Lang } from "@/lib/categories";
import { validateOtherTag, sanitizeOtherTag, otherTagErrorMessage, buildCustomServiceTag } from "@/lib/validateOtherTag";

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Leistungen & Kategorien",
    mainCat: "Hauptkategorien",
    mainCatHint: "Wählen Sie alle Kategorien und Spezialbereiche aus, in denen Sie tätig sind.",
    serviceArea: "Servicegebiet / Einsatzregion",
    serviceAreaPlaceholder: "z.B. Zürich, Bern, Luzern",
    specializations: "Spezialisierungen",
    specializationsHint: "Drücken Sie Enter, um eine Spezialisierung hinzuzufügen.",
    specializationsPlaceholder: "z.B. Dachsanierung, Barrierefreier Umbau",
    save: "Leistungen speichern",
    saved: "Leistungen erfolgreich gespeichert.",
    error: "Fehler beim Speichern.",
    otherPlaceholder: "Dienst beschreiben…",
    otherHint: "3–40 Zeichen",
    suggestTitle: "Kategorie vorschlagen",
    suggestHint: "Fehlt eine Kategorie? Schlagen Sie sie vor — wir prüfen und fügen sie hinzu.",
    suggestPlaceholder: "z.B. Solaranlage, Fassadenreinigung",
    suggestBtn: "Vorschlag senden",
    suggestSent: "Vorschlag gesendet. Danke!",
    suggestError: "Fehler beim Senden.",
    suggestMin: "Mindestens 3 Zeichen.",
  },
  en: {
    title: "Services & Categories",
    mainCat: "Main categories",
    mainCatHint: "Select all categories and specialties you work in.",
    serviceArea: "Service area / region",
    serviceAreaPlaceholder: "e.g. Zurich, Bern, Lucerne",
    specializations: "Specializations",
    specializationsHint: "Press Enter to add a specialization.",
    specializationsPlaceholder: "e.g. Roof renovation, Accessible remodeling",
    save: "Save services",
    saved: "Services saved successfully.",
    error: "Error saving.",
    otherPlaceholder: "Describe the service…",
    otherHint: "3–40 characters",
    suggestTitle: "Suggest a category",
    suggestHint: "Don't see your category? Suggest it — we'll review and add it.",
    suggestPlaceholder: "e.g. Solar panels, Facade cleaning",
    suggestBtn: "Send suggestion",
    suggestSent: "Suggestion sent. Thank you!",
    suggestError: "Error sending suggestion.",
    suggestMin: "At least 3 characters required.",
  },
  sq: {
    title: "Shërbime & Kategori",
    mainCat: "Kategoritë kryesore",
    mainCatHint: "Zgjidhni të gjitha kategoritë dhe specialitetet ku punoni.",
    serviceArea: "Zona e shërbimit",
    serviceAreaPlaceholder: "p.sh. Tiranë, Shkodër, Durrës",
    specializations: "Specializime",
    specializationsHint: "Shtypni Enter për të shtuar specializim.",
    specializationsPlaceholder: "p.sh. Rinovim çatie, Ristrukturim",
    save: "Ruaj shërbime",
    saved: "Shërbime u ruajtën me sukses.",
    error: "Gabim gjatë ruajtjes.",
    otherPlaceholder: "Përshkruani shërbimin…",
    otherHint: "3–40 karaktere",
    suggestTitle: "Sugjeroni një kategori",
    suggestHint: "Nuk e shihni kategorinë tuaj? Sugjerojeni — do ta shqyrtojmë dhe shtojmë.",
    suggestPlaceholder: "p.sh. Panele diellore, Pastrim fasade",
    suggestBtn: "Dërgo sugjerimin",
    suggestSent: "Sugjerimi u dërgua. Faleminderit!",
    suggestError: "Gabim gjatë dërgimit.",
    suggestMin: "Minimum 3 karaktere.",
  },
  fr: {
    title: "Services & Catégories",
    mainCat: "Catégories principales",
    mainCatHint: "Sélectionnez toutes les catégories et spécialités dans lesquelles vous travaillez.",
    serviceArea: "Zone de service / région",
    serviceAreaPlaceholder: "ex. Zurich, Berne, Lucerne",
    specializations: "Spécialisations",
    specializationsHint: "Appuyez sur Entrée pour ajouter une spécialisation.",
    specializationsPlaceholder: "ex. Rénovation toiture, Réaménagement accessible",
    save: "Enregistrer les services",
    saved: "Services enregistrés avec succès.",
    error: "Erreur lors de l'enregistrement.",
    otherPlaceholder: "Décrivez le service…",
    otherHint: "3–40 caractères",
    suggestTitle: "Suggérer une catégorie",
    suggestHint: "Vous ne voyez pas votre catégorie ? Suggérez-la — nous l'examinerons.",
    suggestPlaceholder: "ex. Panneaux solaires, Nettoyage façade",
    suggestBtn: "Envoyer la suggestion",
    suggestSent: "Suggestion envoyée. Merci !",
    suggestError: "Erreur lors de l'envoi.",
    suggestMin: "Au moins 3 caractères requis.",
  },
};

interface Props {
  language: string;
}

export default function LeistungenSection({ language }: Props) {
  const l = L[language] ?? L.de;
  const lang = (["en", "de", "sq", "fr"].includes(language) ? language : "de") as Lang;
  const { categories } = useCategories("service");

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [otherTagErrors, setOtherTagErrors] = useState<Record<string, string>>({});
  const [serviceArea, setServiceArea] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [suggestInput, setSuggestInput] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestSending, setSuggestSending] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/provider/profile")
      .then(r => r.json())
      .then((d: {
        company?: {
          serviceTypes?: string[] | null;
          customServiceTags?: string[] | null;
          serviceArea?: string | null;
          specializations?: string[] | null;
        } | null;
      }) => {
        const svcTypes = d.company?.serviceTypes ?? [];
        setSelectedCats(svcTypes.filter(s => categories.some(c => c.key === s)));
        setSelectedTags(svcTypes.filter(s => s !== "other" && !categories.some(c => c.key === s)));
        const ot: Record<string, string> = {};
        for (const t of (d.company?.customServiceTags ?? [])) {
          const idx = t.indexOf("|");
          if (idx >= 0) ot[t.slice(0, idx)] = t.slice(idx + 1);
        }
        setOtherTexts(ot);
        if (d.company?.serviceArea) setServiceArea(d.company.serviceArea);
        if (d.company?.specializations) setSpecializations(d.company.specializations);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  const toggleCat = (catKey: string) => {
    if (selectedCats.includes(catKey)) {
      const cat = categories.find(c => c.key === catKey);
      const tagKeys = cat?.subcategories.map(t => t.key) ?? [];
      setSelectedTags(prev => prev.filter(t => !tagKeys.includes(t)));
      setOtherTexts(prev => { const n = { ...prev }; delete n[catKey]; return n; });
      setOtherTagErrors(prev => { const n = { ...prev }; delete n[catKey]; return n; });
      setSelectedCats(prev => prev.filter(c => c !== catKey));
    } else {
      setSelectedCats(prev => [...prev, catKey]);
    }
  };

  const toggleTag = (catKey: string, tagKey: string) => {
    if (tagKey === "other") {
      if (catKey in otherTexts) {
        setOtherTexts(prev => { const n = { ...prev }; delete n[catKey]; return n; });
        setOtherTagErrors(prev => { const n = { ...prev }; delete n[catKey]; return n; });
      } else {
        setOtherTexts(prev => ({ ...prev, [catKey]: "" }));
      }
    } else {
      setSelectedTags(prev =>
        prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]
      );
    }
  };

  const addSpec = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && specInput.trim()) {
      e.preventDefault();
      if (!specializations.includes(specInput.trim()))
        setSpecializations(prev => [...prev, specInput.trim()]);
      setSpecInput("");
    }
  };

  const removeSpec = (s: string) => setSpecializations(prev => prev.filter(x => x !== s));

  const save = async () => {
    const errors: Record<string, string> = {};
    for (const [catKey, text] of Object.entries(otherTexts)) {
      if (text.trim().length < 3) {
        errors[catKey] = l.otherHint;
      } else {
        const result = validateOtherTag(text);
        if (!result.ok) errors[catKey] = otherTagErrorMessage(result.error, lang);
      }
    }
    if (Object.keys(errors).length > 0) { setOtherTagErrors(errors); return; }

    setSaving(true);
    setMsg(null);
    try {
      const customServiceTags = Object.entries(otherTexts)
        .filter(([, t]) => t.trim().length >= 3)
        .map(([catKey, text]) => buildCustomServiceTag(catKey, text));

      const r = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [...selectedCats, ...selectedTags],
          customServiceTags,
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

  const sendSuggestion = async () => {
    if (suggestInput.trim().length < 3) {
      setSuggestMsg({ type: "err", text: l.suggestMin });
      return;
    }
    setSuggestSending(true);
    setSuggestMsg(null);
    try {
      const r = await fetch("/api/categories/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: suggestInput.trim(), type: "service" }),
      });
      if (!r.ok) throw new Error();
      setSuggestMsg({ type: "ok", text: l.suggestSent });
      setSuggestInput("");
      setTimeout(() => { setSuggestOpen(false); setSuggestMsg(null); }, 3000);
    } catch {
      setSuggestMsg({ type: "err", text: l.suggestError });
    } finally {
      setSuggestSending(false);
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
        <div className="space-y-2">
          {categories.map(cat => {
            const isChecked = selectedCats.includes(cat.key);
            return (
              <div key={cat.key} className="border border-border rounded-lg overflow-hidden">
                <label className="flex items-center gap-2.5 cursor-pointer group p-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCat(cat.key)}
                    className="w-4 h-4 rounded border-border accent-primary shrink-0"
                  />
                  <span className={`text-sm transition-colors font-medium ${isChecked ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                    {cat.label}
                  </span>
                </label>
                {isChecked && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map(sub => {
                        const isOther = sub.key === "other";
                        const isTagSelected = isOther ? cat.key in otherTexts : selectedTags.includes(sub.key);
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => toggleTag(cat.key, sub.key)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                              isTagSelected
                                ? "bg-primary/10 border-primary text-primary font-medium"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                    {cat.key in otherTexts && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          maxLength={40}
                          placeholder={l.otherPlaceholder}
                          value={otherTexts[cat.key]}
                          onChange={e => {
                            const sanitized = sanitizeOtherTag(e.target.value);
                            setOtherTexts(prev => ({ ...prev, [cat.key]: sanitized }));
                            if (sanitized.length >= 3) {
                              const result = validateOtherTag(sanitized);
                              setOtherTagErrors(prev => ({
                                ...prev,
                                [cat.key]: result.ok ? "" : otherTagErrorMessage(result.error, lang),
                              }));
                            } else {
                              setOtherTagErrors(prev => ({ ...prev, [cat.key]: "" }));
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">{l.otherHint}</p>
                        {otherTagErrors[cat.key] && (
                          <p className="text-xs text-destructive">{otherTagErrors[cat.key]}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Suggest a category */}
        <div className="mt-4 pt-3 border-t border-border">
          {!suggestOpen ? (
            <button
              type="button"
              onClick={() => { setSuggestOpen(true); setSuggestMsg(null); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {l.suggestTitle}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{l.suggestHint}</p>
              <div className="flex gap-2">
                <Input
                  value={suggestInput}
                  onChange={e => setSuggestInput(e.target.value)}
                  placeholder={l.suggestPlaceholder}
                  maxLength={80}
                  className="text-sm h-8"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void sendSuggestion(); } }}
                  disabled={suggestSending}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void sendSuggestion()}
                  disabled={suggestSending || suggestInput.trim().length < 3}
                  className="h-8 px-3 shrink-0"
                >
                  {suggestSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : l.suggestBtn}
                </Button>
                <button
                  type="button"
                  onClick={() => { setSuggestOpen(false); setSuggestInput(""); setSuggestMsg(null); }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {suggestMsg && (
                <p className={`text-xs flex items-center gap-1 ${suggestMsg.type === "ok" ? "text-green-700" : "text-destructive"}`}>
                  {suggestMsg.type === "ok" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {suggestMsg.text}
                </p>
              )}
            </div>
          )}
        </div>
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

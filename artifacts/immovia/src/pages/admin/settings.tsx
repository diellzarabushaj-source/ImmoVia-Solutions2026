import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface Setting {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

const SETTING_GROUPS: { labelKey: "grpPlatform" | "grpProjects" | "grpCompanies" | "grpContact"; keys: string[] }[] = [
  {
    labelKey: "grpPlatform",
    keys: ["platform.name", "platform.tagline", "platform.maintenance"],
  },
  {
    labelKey: "grpProjects",
    keys: ["projects.auto_approve"],
  },
  {
    labelKey: "grpCompanies",
    keys: ["companies.require_license"],
  },
  {
    labelKey: "grpContact",
    keys: ["contact.support_email", "contact.support_phone"],
  },
];

function settingLabel(key: string): string {
  return key
    .split(".").pop()!
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isBoolKey(key: string): boolean {
  return key.endsWith(".maintenance") || key.endsWith(".auto_approve") || key.endsWith(".require_license");
}

export function AdminSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: Setting[]) => {
        setSettings(data);
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });
        setValues(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(values),
      });
      if (!res.ok) { setError(t.admin.settingsSaveFailed); return; }
      const data: Setting[] = await res.json();
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError(t.admin.connectionErrorShort); } finally { setSaving(false); }
  };

  const allKeys = new Set(settings.map((s) => s.key));
  const ungroupedKeys = settings.map((s) => s.key).filter(
    (k) => !SETTING_GROUPS.flatMap((g) => g.keys).includes(k),
  );

  const groups: { label: string; keys: string[] }[] = [
    ...SETTING_GROUPS.map((g) => ({ label: t.admin[g.labelKey], keys: g.keys })),
    ...(ungroupedKeys.length ? [{ label: t.admin.grpOther, keys: ungroupedKeys }] : []),
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.admin.settingsTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.admin.settingsSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> {t.admin.refresh}
          </Button>
          <Button size="sm" className="bg-[#1a3a6e] hover:bg-[#0f2044]" onClick={handleSave} disabled={saving || loading}>
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{t.admin.saving}</> : <><Save className="h-4 w-4 mr-1.5" />{t.admin.saveChanges}</>}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {t.admin.settingsSaved}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupKeys = group.keys.filter((k) => allKeys.has(k) || values[k] !== undefined);
            if (groupKeys.length === 0) return null;
            return (
              <Card key={group.label} className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">{group.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupKeys.map((key) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">
                        {settingLabel(key)}
                        <span className="ml-2 font-mono text-gray-400 font-normal">{key}</span>
                      </Label>
                      {isBoolKey(key) ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setValues((v) => ({ ...v, [key]: v[key] === "true" ? "false" : "true" }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${values[key] === "true" ? "bg-[#1a3a6e]" : "bg-gray-200"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${values[key] === "true" ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                          <span className="text-sm text-gray-700">{values[key] === "true" ? t.admin.enabled : t.admin.disabled}</span>
                        </div>
                      ) : (
                        <Input
                          value={values[key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                          className="max-w-md text-sm"
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

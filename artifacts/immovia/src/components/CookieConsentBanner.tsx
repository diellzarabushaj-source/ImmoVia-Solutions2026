import { useState, useEffect, useCallback } from "react";
import { Cookie, Shield, Settings2, BarChart3, Megaphone, Wrench, X, Check } from "lucide-react";

const STORAGE_KEY = "immovia_cookie_consent";
const OPEN_EVENT = "immovia:open-cookie-settings";

type Preferences = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  decided: boolean;
  preferences: Preferences;
};

const DEFAULT_PREFS: Preferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

function readStorage(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

function writeStorage(preferences: Preferences) {
  const val: StoredConsent = { decided: true, preferences: { ...preferences, necessary: true } };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}

type Category = {
  key: keyof Preferences;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
};

const CATEGORIES: Category[] = [
  {
    key: "necessary",
    label: "Notwendige Cookies",
    description: "Ermöglichen grundlegende Funktionen wie Seitennavigation, sichere Anmeldung und Sitzungsverwaltung. Diese Cookies sind für den Betrieb der Website erforderlich.",
    icon: Shield,
    required: true,
  },
  {
    key: "functional",
    label: "Funktionale Cookies",
    description: "Speichern Ihre Präferenzen wie Sprache oder Region und verbessern die Nutzererfahrung bei Ihrem nächsten Besuch.",
    icon: Wrench,
    required: false,
  },
  {
    key: "analytics",
    label: "Analytische Cookies",
    description: "Helfen uns zu verstehen, wie Besucher unsere Website nutzen, damit wir Inhalte und Funktionen verbessern können.",
    icon: BarChart3,
    required: false,
  },
  {
    key: "marketing",
    label: "Marketing-Cookies",
    description: "Werden verwendet, um Ihnen relevante Werbung anzuzeigen. Aktuell sind keine Marketing-Skripte aktiv.",
    icon: Megaphone,
    required: false,
  },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={[
        "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        disabled
          ? "cursor-not-allowed border-primary/40 bg-primary/30"
          : checked
          ? "cursor-pointer border-primary bg-primary"
          : "cursor-pointer border-slate-300 bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow ring-0 transition-transform mt-px",
          checked ? "translate-x-3.5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

type SettingsModalProps = {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  onAcceptAll: () => void;
  onSave: () => void;
  onClose: () => void;
};

function SettingsModal({ prefs, setPrefs, onAcceptAll, onSave, onClose }: SettingsModalProps) {
  const toggle = (key: keyof Preferences) => {
    if (key === "necessary") return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90dvh] sm:max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Cookie-Einstellungen</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Wir verwenden Cookies, um unsere Website sicher bereitzustellen und die Nutzung zu verbessern. Passen Sie Ihre Einstellungen an oder akzeptieren Sie alle Cookies.
          </p>
          {CATEGORIES.map(({ key, label, description, icon: Icon, required }) => (
            <div key={key} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
              <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {required && (
                      <span className="text-[10px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">
                        Immer aktiv
                      </span>
                    )}
                    <Toggle checked={prefs[key] || required} onChange={() => toggle(key)} disabled={required} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={onSave}
            className="order-2 sm:order-1 w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Auswahl speichern
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="order-1 sm:order-2 w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Alle akzeptieren
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = readStorage();
    if (!stored?.decided) {
      setVisible(true);
    }
    const handleOpen = () => {
      const stored = readStorage();
      if (stored?.preferences) {
        setPrefs({ ...stored.preferences, necessary: true });
      }
      setSettingsOpen(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  const acceptAll = useCallback(() => {
    writeStorage({ necessary: true, functional: true, analytics: true, marketing: true });
    setVisible(false);
    setSettingsOpen(false);
  }, []);

  const acceptNecessary = useCallback(() => {
    writeStorage({ necessary: true, functional: false, analytics: false, marketing: false });
    setVisible(false);
    setSettingsOpen(false);
  }, []);

  const saveSettings = useCallback(() => {
    writeStorage(prefs);
    setVisible(false);
    setSettingsOpen(false);
  }, [prefs]);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  if (!visible) return null;

  if (settingsOpen) {
    return (
      <SettingsModal
        prefs={prefs}
        setPrefs={setPrefs}
        onAcceptAll={acceptAll}
        onSave={saveSettings}
        onClose={() => {
          setSettingsOpen(false);
          const stored = readStorage();
          if (stored?.decided) setVisible(false);
        }}
      />
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="container mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">Cookie-Hinweis</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Wir verwenden Cookies, um unsere Website sicher bereitzustellen und die Nutzung zu verbessern. Sie können alle Cookies akzeptieren, nur notwendige Cookies zulassen oder Ihre Einstellungen anpassen.
              </p>
            </div>
          </div>

          <div className="flex flex-row sm:flex-row items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={openSettings}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Einstellungen
            </button>
            <button
              type="button"
              onClick={acceptNecessary}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              Nur notwendige Cookies
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                Alle akzeptieren
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

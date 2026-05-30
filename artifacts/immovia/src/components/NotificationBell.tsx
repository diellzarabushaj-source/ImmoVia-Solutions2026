import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedProjectId: number | null;
  relatedCompanyId: number | null;
  isRead: boolean;
  createdAt: string;
}

const L = {
  sq: { empty: "Nuk ka njoftime.", markAll: "Shëno të gjitha si të lexuara", notifications: "Njoftimet" },
  en: { empty: "No notifications.", markAll: "Mark all as read", notifications: "Notifications" },
  de: { empty: "Keine Benachrichtigungen.", markAll: "Alle als gelesen markieren", notifications: "Benachrichtigungen" },
  fr: { empty: "Aucune notification.", markAll: "Tout marquer comme lu", notifications: "Notifications" },
};

export default function NotificationBell() {
  const { language } = useLanguage();
  const lang = (["sq", "en", "de", "fr"].includes(language) ? language : "de") as keyof typeof L;
  const l = L[lang];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = () => {
    fetch("/api/notifications", { credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<Notification[]> : [])
      .then(data => setNotifications(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH", credentials: "include" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === "sq" ? "sq-AL" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={l.notifications}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground">{l.notifications}</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                {l.markAll}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">{l.empty}</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${!n.isRead ? "bg-primary/4" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    <div className={!n.isRead ? "" : "pl-4"}>
                      <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{fmtDate(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

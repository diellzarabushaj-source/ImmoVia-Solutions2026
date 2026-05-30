import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import {
  MessageSquare, X, Send, ChevronLeft, Paperclip,
  Building2, User, Clock, Loader2, FileText, ImageIcon, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

/* ── types ──────────────────────────────────────────────────── */
interface ConvRow {
  id: number;
  companyId: number;
  customerUserId: number;
  subject: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCountCustomer: number;
  unreadCountProvider: number;
  companyName: string | null;
  customerName: string | null;
}

interface MsgRow {
  id: number;
  senderUserId: number;
  senderRole: string;
  body: string;
  messageType: string;
  attachments: string[];
  createdAt: string;
  senderName: string | null;
}

interface Draft {
  companyId: number;
  companyName: string;
}

/* ── i18n ────────────────────────────────────────────────────── */
const ML: Record<string, Record<string, string>> = {
  de: {
    title: "Nachrichten",
    empty: "Noch keine Nachrichten.",
    emptyHint: "Schreiben Sie Anbietern über deren Profil.",
    type: "Nachricht schreiben…",
    send: "Senden",
    back: "Zurück",
    attach: "Anhang",
    fileTooBig: "Datei zu groß (max 10 MB)",
    invalidFile: "Dateiformat nicht erlaubt",
    errorSend: "Senden fehlgeschlagen.",
    newConvTo: "Neue Nachricht an",
    firstMsg: "Ihre erste Nachricht…",
    sending: "Wird gesendet…",
  },
  en: {
    title: "Messages",
    empty: "No messages yet.",
    emptyHint: "Write to providers from their profile page.",
    type: "Write a message…",
    send: "Send",
    back: "Back",
    attach: "Attach",
    fileTooBig: "File too large (max 10 MB)",
    invalidFile: "File type not allowed",
    errorSend: "Failed to send.",
    newConvTo: "New message to",
    firstMsg: "Your first message…",
    sending: "Sending…",
  },
  sq: {
    title: "Mesazhet",
    empty: "Ende asnjë mesazh.",
    emptyHint: "Shkruani anëtarëve nga faqja e profilit.",
    type: "Shkruaj mesazh…",
    send: "Dërgo",
    back: "Mbrapa",
    attach: "Bashkëngjit",
    fileTooBig: "Skedari shumë i madh (max 10 MB)",
    invalidFile: "Formati nuk lejohet",
    errorSend: "Dërgimi dështoi.",
    newConvTo: "Mesazh i ri për",
    firstMsg: "Mesazhi juaj i parë…",
    sending: "Duke dërguar…",
  },
  fr: {
    title: "Messages",
    empty: "Aucun message pour l'instant.",
    emptyHint: "Écrivez aux prestataires depuis leur profil.",
    type: "Écrire un message…",
    send: "Envoyer",
    back: "Retour",
    attach: "Joindre",
    fileTooBig: "Fichier trop grand (max 10 Mo)",
    invalidFile: "Type de fichier non autorisé",
    errorSend: "Échec de l'envoi.",
    newConvTo: "Nouveau message à",
    firstMsg: "Votre premier message…",
    sending: "Envoi en cours…",
  },
};

const ALLOWED = [
  "image/jpeg","image/jpg","image/png","image/webp",
  "application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

async function uploadFile(file: File): Promise<string> {
  const r = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!r.ok) throw new Error("url");
  const { uploadURL, objectPath } = await r.json() as { uploadURL: string; objectPath: string };
  const put = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("upload");
  return objectPath as string;
}

/* ── Attachment preview ─────────────────────────────────────── */
function AttachPreview({ path }: { path: string }) {
  const isImg = /\.(jpe?g|png|webp|gif)$/i.test(path) || path.includes("image");
  if (isImg) {
    return (
      <a href={`/api/storage${path}`} target="_blank" rel="noopener noreferrer">
        <img src={`/api/storage${path}`} alt="attachment" className="max-w-[160px] max-h-[160px] rounded-xl object-cover border border-white/20 mt-1" />
      </a>
    );
  }
  const name = path.split("/").pop() ?? "file";
  return (
    <a href={`/api/storage${path}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mt-1 hover:bg-white/20 text-xs">
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="truncate max-w-[120px]">{name}</span>
    </a>
  );
}

/* ── Draft view (new conversation compose) ───────────────────── */
function DraftView({
  draft, m, onCreated, onBack,
}: {
  draft: Draft;
  m: Record<string, string>;
  onCreated: (convId: number) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setErr(null);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: draft.companyId, message: text.trim() }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json() as { conversationId: number };
      onCreated(d.conversationId);
    } catch {
      setErr(m.errorSend);
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white flex-shrink-0">
          <Building2 className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{m.newConvTo}</p>
          <p className="font-semibold text-sm text-foreground truncate">{draft.companyName}</p>
        </div>
      </div>

      <div className="flex-1 bg-muted/20 p-3 flex items-end">
        <p className="text-xs text-muted-foreground text-center w-full py-8">{m.firstMsg}</p>
      </div>

      <div className="border-t border-border bg-white p-2 flex-shrink-0">
        {err && <p className="text-[10px] text-destructive mb-1">{err}</p>}
        <div className="flex items-end gap-1.5">
          <textarea
            className="flex-1 resize-none rounded-xl border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[34px] max-h-24"
            placeholder={m.type}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            rows={1}
            autoFocus
          />
          <Button size="icon" className="h-8 w-8 rounded-xl flex-shrink-0" onClick={() => void send()}
            disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Thread view ─────────────────────────────────────────────── */
function ThreadView({
  convId, myUserId, myCompanyId, m, onBack,
}: {
  convId: number;
  myUserId: number;
  myCompanyId: number | null;
  m: Record<string, string>;
  onBack: () => void;
}) {
  const [conv, setConv] = useState<ConvRow | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [myRole, setMyRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/conversations/${convId}`);
      if (!r.ok) return;
      const d = await r.json() as { conversation: ConvRow; messages: MsgRow[]; myRole: string };
      setConv(d.conversation);
      setMessages(d.messages);
      setMyRole(d.myRole as "customer" | "provider");
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [convId]);

  useEffect(() => {
    void load();
    pollRef.current = window.setInterval(() => void load(), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* suppress unused warning */ void myUserId;

  const handleFiles = (fl: FileList) => {
    setFileErr(null);
    const next: File[] = [];
    for (const f of Array.from(fl)) {
      if (!ALLOWED.includes(f.type)) { setFileErr(m.invalidFile); continue; }
      if (f.size > 10 * 1024 * 1024) { setFileErr(m.fileTooBig); continue; }
      next.push(f);
    }
    setPendingFiles(p => [...p, ...next].slice(0, 5));
  };

  const send = async () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    setSending(true);
    setSendErr(null);
    try {
      const uploaded: string[] = [];
      for (const f of pendingFiles) uploaded.push(await uploadFile(f));
      const r = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), attachments: uploaded }),
      });
      if (!r.ok) throw new Error();
      setText("");
      setPendingFiles([]);
      await load();
    } catch { setSendErr(m.errorSend); } finally { setSending(false); }
  };

  const partnerName = myRole === "provider"
    ? (conv?.customerName ?? "Kunde")
    : (conv?.companyName ?? "Anbieter");

  if (loading) return (
    <div className="flex-1 p-4 space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-3/4" />)}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white flex-shrink-0">
          {myRole === "provider" ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
        </div>
        <p className="font-semibold text-sm text-foreground truncate flex-1">{partnerName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-muted/20">
        {messages.map(msg => {
          const mine = (myRole === "customer" && msg.senderRole === "customer") ||
            (myRole === "provider" && msg.senderRole === "provider");
          return (
            <div key={msg.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-white rounded-br-sm" : "bg-white text-foreground rounded-bl-sm border border-border"}`}>
                {!mine && <p className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.senderName ?? partnerName}</p>}
                {msg.body !== "[Attachment]" && <p className="whitespace-pre-wrap">{msg.body}</p>}
                {msg.attachments?.map((a, i) => <AttachPreview key={i} path={a} />)}
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5 px-1">
                {format(new Date(msg.createdAt), "dd.MM · HH:mm")}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white p-2 flex-shrink-0">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-xs">
                {f.type.startsWith("image/") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                <span className="max-w-[80px] truncate">{f.name}</span>
                <button onClick={() => setPendingFiles(p => p.filter((_,idx)=>idx!==i))} className="text-muted-foreground hover:text-foreground">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {(fileErr || sendErr) && <p className="text-[10px] text-destructive mb-1">{fileErr ?? sendErr}</p>}
        <div className="flex items-end gap-1.5">
          <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground flex-shrink-0" title={m.attach}>
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <textarea
            className="flex-1 resize-none rounded-xl border border-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[34px] max-h-24"
            placeholder={m.type}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            rows={1}
          />
          <Button size="icon" className="h-8 w-8 rounded-xl flex-shrink-0" onClick={() => void send()}
            disabled={sending || (!text.trim() && pendingFiles.length === 0)}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <input ref={fileRef} type="file" multiple accept={ALLOWED.join(",")} className="hidden"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
}

/* ── Main ChatWidget ─────────────────────────────────────────── */
export function ChatWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const m = ML[language] ?? ML.en;

  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [myCompanyId, setMyCompanyId] = useState<number | null>(null);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const r = await fetch("/api/conversations/unread-count");
      if (r.ok) {
        const d = await r.json() as { total: number };
        setTotalUnread(d.total);
      }
    } catch { /* ignore */ }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch("/api/conversations");
      if (r.ok) {
        const d = await r.json() as { conversations: ConvRow[]; myCompanyId: number | null };
        setConversations(d.conversations);
        setMyCompanyId(d.myCompanyId);
        let total = 0;
        for (const c of d.conversations) {
          total += (d.myCompanyId && c.companyId === d.myCompanyId)
            ? c.unreadCountProvider
            : c.unreadCountCustomer;
        }
        setTotalUnread(total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  /* Listen for open-chat events dispatched by company profile "Contact" button */
  useEffect(() => {
    if (!user) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ companyId: number; companyName: string }>).detail;
      if (!detail?.companyId) return;

      setOpen(true);
      setMinimised(false);

      /* Try to find existing conversation with that company */
      void fetch("/api/conversations").then(async r => {
        if (!r.ok) {
          setDraft({ companyId: detail.companyId, companyName: detail.companyName });
          return;
        }
        const d = await r.json() as { conversations: ConvRow[]; myCompanyId: number | null };
        setConversations(d.conversations);
        setMyCompanyId(d.myCompanyId);

        const existing = d.conversations.find(c => c.companyId === detail.companyId);
        if (existing) {
          setDraft(null);
          setActiveConvId(existing.id);
        } else {
          setDraft({ companyId: detail.companyId, companyName: detail.companyName });
          setActiveConvId(null);
        }
      });
    };

    window.addEventListener("immovia:open-chat", handler);
    return () => window.removeEventListener("immovia:open-chat", handler);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchUnread();
    pollRef.current = window.setInterval(() => void fetchUnread(), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, fetchUnread]);

  useEffect(() => {
    if (open && !minimised) void fetchConversations();
  }, [open, minimised, fetchConversations]);

  if (!user) return null;

  const handleOpen = () => {
    setOpen(true);
    setMinimised(false);
  };

  const handleClose = () => {
    setOpen(false);
    setActiveConvId(null);
    setDraft(null);
  };

  const handleBack = () => {
    setActiveConvId(null);
    setDraft(null);
    void fetchConversations();
  };

  return (
    <div className="fixed bottom-[88px] right-5 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            style={{ width: 340, height: minimised ? "auto" : 500 }}
          >
            {/* Widget header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-primary text-white flex-shrink-0">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold text-sm flex-1">{m.title}</span>
              {totalUnread > 0 && !minimised && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
              <button onClick={() => setMinimised(p => !p)} className="p-1 rounded hover:bg-white/20 transition-colors">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleClose} className="p-1 rounded hover:bg-white/20 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {!minimised && (
              <>
                {activeConvId ? (
                  <ThreadView
                    convId={activeConvId}
                    myUserId={user.id}
                    myCompanyId={myCompanyId}
                    m={m}
                    onBack={handleBack}
                  />
                ) : draft ? (
                  <DraftView
                    draft={draft}
                    m={m}
                    onBack={handleBack}
                    onCreated={(convId) => { setDraft(null); setActiveConvId(convId); void fetchConversations(); }}
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {loading && (
                      <div className="p-4 space-y-3">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                      </div>
                    )}
                    {!loading && conversations.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">{m.empty}</p>
                        <p className="text-xs mt-1">{m.emptyHint}</p>
                      </div>
                    )}
                    {conversations.map(conv => {
                      const isProvider = myCompanyId !== null && conv.companyId === myCompanyId;
                      const partner = isProvider ? (conv.customerName ?? "Kunde") : (conv.companyName ?? "Anbieter");
                      const unread = isProvider ? conv.unreadCountProvider : conv.unreadCountCustomer;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => { setDraft(null); setActiveConvId(conv.id); }}
                          className="w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors flex gap-3 items-start"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white flex-shrink-0">
                            {isProvider ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className={`text-sm truncate ${unread > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{partner}</p>
                              {unread > 0 && (
                                <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {unread > 9 ? "9+" : unread}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate ${unread > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"}`}>
                              {conv.lastMessageText ?? "…"}
                            </p>
                            {conv.lastMessageAt && (
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(conv.lastMessageAt), "dd.MM · HH:mm")}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        onClick={open ? handleClose : handleOpen}
        className="relative w-14 h-14 rounded-full bg-primary shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-shadow"
        aria-label="Messages"
      >
        {open
          ? <X className="h-5 w-5" />
          : <MessageSquare className="h-5 w-5" />
        }
        <AnimatePresence>
          {!open && totalUnread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-md"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default ChatWidget;

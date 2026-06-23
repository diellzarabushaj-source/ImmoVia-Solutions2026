import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import {
  MessageSquare, X, Send, ChevronLeft, Paperclip,
  Building2, User, Clock, Loader2, FileText, ImageIcon,
  ChevronDown, Pencil,
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
  // Encode original filename so AttachPreview can show thumbnails + correct name
  return `${objectPath}|${encodeURIComponent(file.name)}`;
}

/* ── Attachment preview ─────────────────────────────────────── */
function AttachPreview({ path }: { path: string }) {
  // Format stored: "/objects/uuid|encoded-filename.ext"  (legacy: just "/objects/uuid")
  const pipeIdx = path.indexOf("|");
  const storagePath = pipeIdx >= 0 ? path.slice(0, pipeIdx) : path;
  const fileName = pipeIdx >= 0 ? decodeURIComponent(path.slice(pipeIdx + 1)) : (path.split("/").pop() ?? "file");
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isImg = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  const isPdf = ext === "pdf";
  const href = `/api/storage${storagePath}`;

  if (isImg) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        <img src={href} alt={fileName} className="max-w-[160px] max-h-[160px] rounded-xl object-cover border border-white/20 mt-1" />
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mt-1 hover:bg-white/20 text-xs">
      {isPdf ? <FileText className="h-4 w-4 flex-shrink-0 text-red-300" /> : <FileText className="h-4 w-4 flex-shrink-0" />}
      <span className="truncate max-w-[120px]">{fileName}</span>
    </a>
  );
}

/* ── Shared avatar ──────────────────────────────────────────── */
function Avatar({ isProvider, size = "md" }: { isProvider: boolean; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const ic = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#1a3a6e] to-[#1e4b8a] flex items-center justify-center text-white flex-shrink-0`}>
      {isProvider ? <User className={ic} /> : <Building2 className={ic} />}
    </div>
  );
}

/* ── Draft view ─────────────────────────────────────────────── */
function DraftView({ draft, m, onCreated, onBack }: {
  draft: Draft; m: Record<string, string>;
  onCreated: (convId: number) => void; onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true); setErr(null);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: draft.companyId, message: text.trim() }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json() as { conversationId: number };
      onCreated(d.conversationId);
    } catch { setErr(m.errorSend); setSending(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/60 bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Avatar isProvider={false} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground leading-none">{m.newConvTo}</p>
          <p className="font-semibold text-sm text-foreground truncate">{draft.companyName}</p>
        </div>
      </div>
      <div className="flex-1 bg-slate-50 p-3 flex items-end">
        <p className="text-xs text-muted-foreground text-center w-full py-8">{m.firstMsg}</p>
      </div>
      <div className="border-t border-border/60 bg-white px-3 py-2.5 flex-shrink-0">
        {err && <p className="text-[10px] text-destructive mb-1">{err}</p>}
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 resize-none rounded-2xl border border-border bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 min-h-[38px] max-h-24 transition-colors"
            placeholder={m.type} value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            rows={1} autoFocus
          />
          <button
            onClick={() => void send()}
            disabled={sending || !text.trim()}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Thread view ─────────────────────────────────────────────── */
function ThreadView({ convId, myUserId, myCompanyId, m, onBack }: {
  convId: number; myUserId: number; myCompanyId: number | null;
  m: Record<string, string>; onBack: () => void;
}) {
  void myUserId; void myCompanyId;

  const [conv, setConv] = useState<ConvRow | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [myRole, setMyRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);
  const optimisticIdRef = useRef(-1);
  const initialLoadRef = useRef(true);

  /* ── Smart scroll helpers ── */
  const isAtBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  const scrollToBottom = (instant = false) => {
    bottomRef.current?.scrollIntoView({ behavior: instant ? "instant" : "smooth" });
  };

  /* ── Load / poll ── */
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/conversations/${convId}`);
      if (!r.ok) return;
      const d = await r.json() as { conversation: ConvRow; messages: MsgRow[]; myRole: string };
      const wasAtBottom = isAtBottom();
      setConv(d.conversation);
      setMessages(prev => {
        // Drop any optimistic messages (negative IDs) and replace with server data
        const real = d.messages;
        return real;
      });
      setMyRole(d.myRole as "customer" | "provider");
      if (initialLoadRef.current || wasAtBottom) {
        requestAnimationFrame(() => scrollToBottom(initialLoadRef.current));
        initialLoadRef.current = false;
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [convId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
    pollRef.current = window.setInterval(() => void load(), 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  /* ── Auto-grow textarea ── */
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  /* ── File handling ── */
  const handleFilesArray = useCallback((files: File[]) => {
    setFileErr(null);
    const next: File[] = [];
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) { setFileErr(m.invalidFile); continue; }
      if (f.size > 10 * 1024 * 1024) { setFileErr(m.fileTooBig); continue; }
      next.push(f);
    }
    setPendingFiles(p => [...p, ...next].slice(0, 5));
  }, [m]);

  const handleFiles = (fl: FileList) => handleFilesArray(Array.from(fl));

  /* ── Paste images from clipboard ── */
  const handlePaste = (e: React.ClipboardEvent) => {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter(i => i.kind === "file" && i.type.startsWith("image/"))
      .map(i => i.getAsFile())
      .filter(Boolean) as File[];
    if (imageFiles.length === 0) return;
    const named = imageFiles.map((f, idx) =>
      new File([f], `clipboard-${Date.now()}-${idx}.png`, { type: f.type })
    );
    handleFilesArray(named);
  };

  /* ── Optimistic send ── */
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;

    setSendErr(null);
    const myFiles = [...pendingFiles];
    const savedText = trimmed;

    // Add optimistic message immediately
    const optId = --optimisticIdRef.current;
    const optMsg: MsgRow = {
      id: optId,
      senderUserId: myUserId,
      senderRole: myRole,
      body: savedText || "[Attachment]",
      messageType: myFiles.length > 0 ? "file" : "text",
      attachments: [],
      createdAt: new Date().toISOString(),
      senderName: null,
    };
    setMessages(p => [...p.filter(x => x.id > 0), optMsg]);
    setText("");
    setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    requestAnimationFrame(() => scrollToBottom());

    setSending(true);
    try {
      const uploaded: string[] = [];
      for (const f of myFiles) uploaded.push(await uploadFile(f));
      const r = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: savedText, attachments: uploaded }),
      });
      if (!r.ok) throw new Error();
      await load();
    } catch {
      setSendErr(m.errorSend);
      setMessages(p => p.filter(x => x.id !== optId));
      setText(savedText);
    } finally {
      setSending(false);
    }
  };

  const isProvider = myRole === "provider";
  const partnerName = isProvider ? (conv?.customerName ?? "Kunde") : (conv?.companyName ?? "Anbieter");

  if (loading) return (
    <div className="flex-1 p-4 space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className={`h-10 ${i % 2 === 0 ? "w-2/3" : "w-3/4 ml-auto"}`} />)}
    </div>
  );

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
      onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none">
          <div className="text-center text-primary">
            <Paperclip className="h-7 w-7 mx-auto mb-1.5" />
            <p className="text-sm font-semibold">{m.attach}</p>
          </div>
        </div>
      )}

      {/* Thread header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/60 bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Avatar isProvider={isProvider} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{partnerName}</p>
          {conv?.subject && <p className="text-[10px] text-muted-foreground truncate">{conv.subject}</p>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5 bg-slate-50">
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const mine = (myRole === "customer" && msg.senderRole === "customer") ||
              (myRole === "provider" && msg.senderRole === "provider");
            const isOptimistic = msg.id < 0;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: isOptimistic ? 0.75 : 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                {!mine && <Avatar isProvider={isProvider} size="sm" />}
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[78%]`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${mine
                    ? "bg-primary text-white rounded-br-sm shadow-sm"
                    : "bg-white text-foreground rounded-bl-sm border border-border/60 shadow-sm"
                  }`}>
                    {!mine && <p className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.senderName ?? partnerName}</p>}
                    {msg.body !== "[Attachment]" && <p className="whitespace-pre-wrap">{msg.body}</p>}
                    {msg.attachments?.map((a, i) => <AttachPreview key={i} path={a} />)}
                  </div>
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5 px-1">
                    {isOptimistic ? "…" : format(new Date(msg.createdAt), "dd.MM · HH:mm")}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/60 bg-white px-3 py-2.5 flex-shrink-0">
        {/* Pending file chips */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {pendingFiles.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1 bg-primary/8 border border-primary/20 rounded-lg px-2 py-0.5 text-xs text-foreground"
              >
                {f.type.startsWith("image/") ? <ImageIcon className="h-3 w-3 text-primary" /> : <FileText className="h-3 w-3 text-primary" />}
                <span className="max-w-[90px] truncate">{f.name}</span>
                <button
                  onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-destructive ml-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {(fileErr || sendErr) && (
          <p className="text-[10px] text-destructive mb-1.5">{fileErr ?? sendErr}</p>
        )}

        <div className="flex items-end gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-1.5 rounded-full hover:bg-muted/70 text-muted-foreground transition-colors flex-shrink-0"
            title={m.attach}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-2xl border border-border bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors overflow-hidden"
            style={{ minHeight: "38px", maxHeight: "120px" }}
            placeholder={m.type}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            onPaste={handlePaste}
            rows={1}
          />
          <motion.button
            onClick={() => void send()}
            disabled={sending || (!text.trim() && pendingFiles.length === 0)}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-35 transition-colors shadow-sm"
          >
            {sending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-[15px] w-[15px]" />
            }
          </motion.button>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}

/* ── Conversation list ───────────────────────────────────────── */
function ConvList({
  conversations, myCompanyId, loading, m,
  onSelect,
}: {
  conversations: ConvRow[];
  myCompanyId: number | null;
  loading: boolean;
  m: Record<string, string>;
  onSelect: (id: number) => void;
}) {
  if (loading) return (
    <div className="p-3 space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  if (conversations.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center text-muted-foreground">
      <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
      <p className="text-sm font-medium">{m.empty}</p>
      <p className="text-xs mt-1 leading-relaxed">{m.emptyHint}</p>
    </div>
  );

  return (
    <div className="overflow-y-auto flex-1">
      {conversations.map(conv => {
        const isProvider = myCompanyId !== null && conv.companyId === myCompanyId;
        const partner = isProvider ? (conv.customerName ?? "Kunde") : (conv.companyName ?? "Anbieter");
        const unread = isProvider ? conv.unreadCountProvider : conv.unreadCountCustomer;
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className="w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors flex gap-3 items-center group border-b border-border/30 last:border-0"
          >
            <div className="relative flex-shrink-0">
              <Avatar isProvider={isProvider} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1 mb-0.5">
                <p className={`text-sm truncate ${unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground/90"}`}>{partner}</p>
                {conv.lastMessageAt && (
                  <p className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                    {format(new Date(conv.lastMessageAt), "dd.MM")}
                  </p>
                )}
              </div>
              <p className={`text-xs truncate leading-relaxed ${unread > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"}`}>
                {conv.lastMessageText ?? "…"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main ChatWidget ─────────────────────────────────────────── */
function ChatWidgetInner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const m = ML[language] ?? ML.en;

  const [expanded, setExpanded] = useState(false);
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
            ? c.unreadCountProvider : c.unreadCountCustomer;
        }
        setTotalUnread(total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  /* Listen for open-chat events from company profile */
  useEffect(() => {
    if (!user) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ companyId: number; companyName: string }>).detail;
      if (!detail?.companyId) return;
      setExpanded(true);
      void fetch("/api/conversations").then(async r => {
        if (!r.ok) { setDraft({ companyId: detail.companyId, companyName: detail.companyName }); return; }
        const d = await r.json() as { conversations: ConvRow[]; myCompanyId: number | null };
        setConversations(d.conversations); setMyCompanyId(d.myCompanyId);
        const existing = d.conversations.find(c => c.companyId === detail.companyId);
        if (existing) { setDraft(null); setActiveConvId(existing.id); }
        else { setDraft({ companyId: detail.companyId, companyName: detail.companyName }); setActiveConvId(null); }
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
    if (expanded) void fetchConversations();
  }, [expanded, fetchConversations]);

  if (!user) return null;

  const handleBack = () => {
    setActiveConvId(null); setDraft(null);
    void fetchConversations();
  };

  const handleHeaderClick = () => {
    setExpanded(p => !p);
    if (!expanded) { setActiveConvId(null); setDraft(null); }
  };

  const showThread = activeConvId !== null;
  const showDraft = draft !== null && !showThread;

  return (
    <div className="fixed bottom-0 right-4 md:right-6 z-[9998] flex flex-col w-[320px] md:w-[360px]">
      {/* Panel body — expands upward */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 480, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white border border-border/70 border-b-0 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {showThread ? (
              <ThreadView
                convId={activeConvId!}
                myUserId={user.id}
                myCompanyId={myCompanyId}
                m={m}
                onBack={handleBack}
              />
            ) : showDraft ? (
              <DraftView
                draft={draft!}
                m={m}
                onBack={handleBack}
                onCreated={(convId) => { setDraft(null); setActiveConvId(convId); void fetchConversations(); }}
              />
            ) : (
              <ConvList
                conversations={conversations}
                myCompanyId={myCompanyId}
                loading={loading}
                m={m}
                onSelect={id => { setDraft(null); setActiveConvId(id); }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar — always visible, click to expand/collapse */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleHeaderClick}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleHeaderClick(); }}
        className="flex items-center gap-3 px-4 py-3 rounded-t-2xl text-white shadow-lg transition-all hover:brightness-110 active:brightness-90 w-full cursor-pointer select-none"
        style={{ background: "linear-gradient(135deg,#0d2151 0%,#1a3a6e 60%,#1e4b8a 100%)" }}
      >
        {/* Avatar / icon */}
        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-4 w-4" />
        </div>

        {/* Title */}
        <span className="font-semibold text-sm flex-1 text-left">{m.title}</span>

        {/* Unread badge */}
        {totalUnread > 0 && !expanded && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-tight">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}

        {/* Actions */}
        {expanded && (
          <button
            onClick={e => { e.stopPropagation(); setActiveConvId(null); setDraft(null); }}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            title="New message"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
        </span>
      </div>
    </div>
  );
}

/* ── Public export ────────────────────────────────────────────── */
export function ChatWidget() {
  return <ChatWidgetInner />;
}

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, MessageSquare, ChevronLeft, Paperclip, X,
  FileText, ImageIcon, Building2, User, Clock, Loader2,
  CheckCircle2, XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface ConversationRow {
  id: number;
  type: string;
  companyId: number;
  customerUserId: number;
  status: string;
  subject: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCountCustomer: number;
  unreadCountProvider: number;
  companyName: string | null;
  companyCity: string | null;
  customerName: string | null;
}

interface MessageRow {
  id: number;
  conversationId: number;
  senderUserId: number;
  senderRole: string;
  body: string;
  messageType: string;
  attachments: string[];
  createdAt: string;
  senderName: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

const ML: Record<string, Record<string, string>> = {
  de: {
    title: "Nachrichten",
    noConversations: "Noch keine Nachrichten.",
    noConversationsHint: "Wenn Kunden Ihnen schreiben, erscheinen die Gespräche hier.",
    typeMessage: "Nachricht schreiben…",
    send: "Senden",
    attach: "Anhang",
    back: "Zurück",
    you: "Sie",
    statusNew: "Neue Anfrage",
    statusActive: "In Besprechung",
    statusClosed: "Abgeschlossen",
    loading: "Laden…",
    errorLoad: "Fehler beim Laden der Nachrichten.",
    errorSend: "Fehler beim Senden.",
    attachHint: "Max 10 MB · JPG, PNG, PDF, DOCX",
    fileTooBig: "Datei zu groß (max 10 MB)",
    invalidFile: "Dateiformat nicht erlaubt",
    acceptOffer: "Angebot annehmen",
    declineOffer: "Ablehnen",
    offerAccepted: "Angebot angenommen",
    offerDeclined: "Angebot abgelehnt",
    offerLabel: "Angebot",
    priceEstimate: "Preisschätzung",
    acceptConfirm: "Möchten Sie dieses Angebot wirklich annehmen?",
  },
  en: {
    title: "Messages",
    noConversations: "No messages yet.",
    noConversationsHint: "When customers write to you, conversations will appear here.",
    typeMessage: "Write a message…",
    send: "Send",
    attach: "Attach",
    back: "Back",
    you: "You",
    statusNew: "New Inquiry",
    statusActive: "In Discussion",
    statusClosed: "Closed",
    loading: "Loading…",
    errorLoad: "Error loading messages.",
    errorSend: "Failed to send.",
    attachHint: "Max 10 MB · JPG, PNG, PDF, DOCX",
    fileTooBig: "File too large (max 10 MB)",
    invalidFile: "File type not allowed",
    acceptOffer: "Accept offer",
    declineOffer: "Decline",
    offerAccepted: "Offer accepted",
    offerDeclined: "Offer declined",
    offerLabel: "Offer",
    priceEstimate: "Price estimate",
    acceptConfirm: "Are you sure you want to accept this offer?",
  },
  sq: {
    title: "Mesazhet",
    noConversations: "Ende asnjë mesazh.",
    noConversationsHint: "Kur klientët ju shkruajnë, bisedat do shfaqen këtu.",
    typeMessage: "Shkruaj mesazh…",
    send: "Dërgo",
    attach: "Bashkëngjit",
    back: "Mbrapa",
    you: "Ju",
    statusNew: "Kërkesë e re",
    statusActive: "Në diskutim",
    statusClosed: "Mbyllur",
    loading: "Duke ngarkuar…",
    errorLoad: "Gabim gjatë ngarkimit.",
    errorSend: "Dërgimi dështoi.",
    attachHint: "Max 10 MB · JPG, PNG, PDF, DOCX",
    fileTooBig: "Skedari shumë i madh (max 10 MB)",
    invalidFile: "Formati i skedarit nuk lejohet",
    acceptOffer: "Prano ofertën",
    declineOffer: "Refuzo",
    offerAccepted: "Oferta u pranua",
    offerDeclined: "Oferta u refuzua",
    offerLabel: "Ofertë",
    priceEstimate: "Vlerësimi i çmimit",
    acceptConfirm: "A jeni i sigurt që doni ta pranoni këtë ofertë?",
  },
  fr: {
    title: "Messages",
    noConversations: "Aucun message pour l'instant.",
    noConversationsHint: "Quand des clients vous écrivent, les conversations apparaîtront ici.",
    typeMessage: "Écrire un message…",
    send: "Envoyer",
    attach: "Joindre",
    back: "Retour",
    you: "Vous",
    statusNew: "Nouvelle demande",
    statusActive: "En discussion",
    statusClosed: "Terminé",
    loading: "Chargement…",
    errorLoad: "Erreur de chargement.",
    errorSend: "Échec de l'envoi.",
    attachHint: "Max 10 Mo · JPG, PNG, PDF, DOCX",
    fileTooBig: "Fichier trop grand (max 10 Mo)",
    invalidFile: "Type de fichier non autorisé",
    acceptOffer: "Accepter l'offre",
    declineOffer: "Refuser",
    offerAccepted: "Offre acceptée",
    offerDeclined: "Offre refusée",
    offerLabel: "Offre",
    priceEstimate: "Estimation de prix",
    acceptConfirm: "Voulez-vous vraiment accepter cette offre ?",
  },
};

const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

async function uploadAttachment(file: File): Promise<string> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!res.ok) throw new Error("Upload URL failed");
  const { uploadURL, objectPath } = await res.json() as { uploadURL: string; objectPath: string };
  const put = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("Upload failed");
  return objectPath;
}

function StatusBadge({ status, m }: { status: string; m: Record<string, string> }) {
  const label = status === "new" ? m.statusNew : status === "closed" ? m.statusClosed : m.statusActive;
  const cls = STATUS_COLORS[status] ?? STATUS_COLORS.active;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function AttachmentPreview({ path }: { path: string }) {
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(path) || path.includes("image");
  if (isImage) {
    return (
      <a href={`/api/storage${path}`} target="_blank" rel="noopener noreferrer" className="block">
        <img src={`/api/storage${path}`} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-white/20 mt-1" />
      </a>
    );
  }
  const name = path.split("/").pop() ?? "file";
  return (
    <a href={`/api/storage${path}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mt-1 hover:bg-white/20 transition-colors text-xs">
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="truncate max-w-[140px]">{name}</span>
    </a>
  );
}

function ConversationView({
  convId, myUserId, myCompanyId, m, onBack,
}: {
  convId: number;
  myUserId: number;
  myCompanyId: number | null;
  m: Record<string, string>;
  onBack: () => void;
}) {
  const [conv, setConv] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [myRole, setMyRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [offerAction, setOfferAction] = useState<Record<number, "accepted" | "declined">>({});
  const [offerBusy, setOfferBusy] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/conversations/${convId}`);
      if (!r.ok) return;
      const d = await r.json() as { conversation: ConversationRow; messages: MessageRow[]; myRole: string };
      setConv(d.conversation);
      setMessages(d.messages);
      setMyRole(d.myRole as "customer" | "provider");
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [convId]);

  useEffect(() => {
    void load();
    pollRef.current = window.setInterval(() => void load(), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleFiles = (files: FileList) => {
    setUploadErr(null);
    const newFiles: File[] = [];
    for (const f of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(f.type)) { setUploadErr(m.invalidFile); continue; }
      if (f.size > 10 * 1024 * 1024) { setUploadErr(m.fileTooBig); continue; }
      newFiles.push(f);
    }
    setPendingFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removePending = (i: number) => setPendingFiles(prev => prev.filter((_, idx) => idx !== i));

  const send = async () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    setSending(true);
    setSendErr(null);
    try {
      const uploaded: string[] = [...attachments];
      for (const file of pendingFiles) {
        const path = await uploadAttachment(file);
        uploaded.push(path);
      }
      const r = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), attachments: uploaded }),
      });
      if (!r.ok) throw new Error("Send failed");
      setText("");
      setPendingFiles([]);
      setAttachments([]);
      await load();
    } catch {
      setSendErr(m.errorSend);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col gap-3 p-6">
      {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-3/4" />)}
    </div>
  );

  const partnerName = myRole === "provider" ? (conv?.customerName ?? "Kunde") : (conv?.companyName ?? "Anbieter");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
        <button onClick={onBack} className="md:hidden p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{partnerName}</p>
          {conv?.companyCity && myRole === "customer" && (
            <p className="text-xs text-muted-foreground">{conv.companyCity}</p>
          )}
          {conv?.subject && <p className="text-xs text-muted-foreground truncate">{conv.subject}</p>}
        </div>
        {conv && <StatusBadge status={conv.status} m={m} />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-muted/20">
        {messages.map(msg => {
          const isMine = (myRole === "customer" && msg.senderRole === "customer") ||
            (myRole === "provider" && msg.senderRole === "provider");

          // Offer card — only shown to the customer receiving the offer
          if (msg.messageType === "offer" && myRole === "customer" && !isMine) {
            const action = offerAction[msg.id];
            // Try to extract price from body: "CHF 1200" or similar
            const priceMatch = msg.body.match(/CHF\s?[\d'., ]+/i);
            return (
              <div key={msg.id} className="flex flex-col items-start">
                <div className="max-w-[80%] w-full rounded-2xl rounded-bl-sm border border-primary/30 bg-white shadow-sm overflow-hidden">
                  {/* Offer header */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">{m.offerLabel}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{msg.senderName ?? partnerName}</span>
                  </div>
                  {/* Offer body */}
                  <div className="px-4 py-3">
                    {priceMatch && (
                      <p className="text-xs text-muted-foreground mb-0.5">{m.priceEstimate}</p>
                    )}
                    {priceMatch && (
                      <p className="text-lg font-bold text-primary mb-2">{priceMatch[0]}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap text-foreground">{msg.body}</p>
                  </div>
                  {/* Action area */}
                  {!action && (
                    <div className="flex gap-2 px-4 pb-4 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        disabled={offerBusy === msg.id}
                        onClick={async () => {
                          if (!window.confirm(m.acceptConfirm)) return;
                          setOfferBusy(msg.id);
                          try {
                            // Extract offerId from message metadata or fall back to convId
                            const offerIdMatch = msg.body.match(/offer[_\s]?id[:\s]?(\d+)/i);
                            const offerIdToUse = offerIdMatch ? Number(offerIdMatch[1]) : msg.id;
                            await fetch(`/api/offers/${offerIdToUse}/accept`, { method: "POST" });
                            setOfferAction(prev => ({ ...prev, [msg.id]: "accepted" }));
                          } catch { /* ignore */ } finally {
                            setOfferBusy(null);
                          }
                        }}
                      >
                        {offerBusy === msg.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {m.acceptOffer}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/5"
                        disabled={offerBusy === msg.id}
                        onClick={() => {
                          setOfferAction(prev => ({ ...prev, [msg.id]: "declined" }));
                        }}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {m.declineOffer}
                      </Button>
                    </div>
                  )}
                  {action && (
                    <div className={`flex items-center gap-2 px-4 pb-4 pt-1 text-sm font-medium ${action === "accepted" ? "text-green-700" : "text-muted-foreground"}`}>
                      {action === "accepted"
                        ? <><CheckCircle2 className="h-4 w-4" />{m.offerAccepted}</>
                        : <><XCircle className="h-4 w-4" />{m.offerDeclined}</>
                      }
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                  {format(new Date(msg.createdAt), "dd.MM · HH:mm")}
                </p>
              </div>
            );
          }

          // Normal message bubble
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-primary text-white rounded-br-sm" : "bg-white text-foreground rounded-bl-sm border border-border"}`}>
                {!isMine && (
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName ?? partnerName}</p>
                )}
                {msg.messageType === "offer" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold mb-1 text-primary/80">
                    <FileText className="h-3 w-3" />{m.offerLabel}
                  </span>
                )}
                {msg.body !== "[Attachment]" && <p className="whitespace-pre-wrap">{msg.body}</p>}
                {msg.attachments?.map((a, i) => <AttachmentPreview key={i} path={a} />)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                {format(new Date(msg.createdAt), "dd.MM · HH:mm")}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white p-3">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 text-xs">
                {f.type.startsWith("image/") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => removePending(i)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadErr && <p className="text-xs text-destructive mb-1">{uploadErr}</p>}
        {sendErr && <p className="text-xs text-destructive mb-1">{sendErr}</p>}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
            title={m.attach}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px] max-h-32"
            placeholder={m.typeMessage}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
            }}
            rows={1}
          />
          <Button size="icon" onClick={() => void send()} disabled={sending || (!text.trim() && pendingFiles.length === 0)} className="flex-shrink-0 rounded-xl">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <input ref={fileRef} type="file" multiple accept={ALLOWED_TYPES.join(",")} className="hidden"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
}

export function MessagingSystem({ myUserId }: { myUserId: number }) {
  const { language } = useLanguage();
  const m = ML[language] ?? ML.de;

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [myCompanyId, setMyCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/conversations");
      if (!r.ok) throw new Error();
      const d = await r.json() as { conversations: ConversationRow[]; myCompanyId: number | null };
      setConversations(d.conversations);
      setMyCompanyId(d.myCompanyId);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Sidebar: conversation list */}
      <div className={`w-full md:w-72 xl:w-80 border-r border-border flex flex-col flex-shrink-0 ${activeConvId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            {m.title}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          )}
          {!loading && error && (
            <p className="p-4 text-sm text-destructive">{m.errorLoad}</p>
          )}
          {!loading && !error && conversations.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{m.noConversations}</p>
              <p className="text-xs mt-1">{m.noConversationsHint}</p>
            </div>
          )}
          {conversations.map(conv => {
            const isProvider = myCompanyId !== null && conv.companyId === myCompanyId;
            const partner = isProvider ? (conv.customerName ?? "Kunde") : (conv.companyName ?? "Anbieter");
            const unread = isProvider ? conv.unreadCountProvider : conv.unreadCountCustomer;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors flex gap-3 items-start ${activeConvId === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white flex-shrink-0">
                  {isProvider ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{partner}</p>
                    {unread > 0 && (
                      <span className="flex-shrink-0 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessageText ?? "…"}</p>
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
      </div>

      {/* Conversation view */}
      <div className={`flex-1 flex flex-col ${activeConvId ? "flex" : "hidden md:flex"}`}>
        {activeConvId ? (
          <ConversationView
            convId={activeConvId}
            myUserId={myUserId}
            myCompanyId={myCompanyId}
            m={m}
            onBack={() => setActiveConvId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-sm">{m.noConversations}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagingSystem;

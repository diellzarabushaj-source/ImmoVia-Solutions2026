import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

interface ChatMessage {
  id: number;
  offerId: number;
  senderUserId: number;
  content: string;
  createdAt: string;
  senderName: string | null;
}

interface MessageThreadProps {
  offerId: number;
  otherPartyName?: string;
}

export default function MessageThread({ offerId, otherPartyName }: MessageThreadProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${offerId}`);
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages(data.messages);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [offerId]);

  useEffect(() => {
    void fetchMessages();
    intervalRef.current = setInterval(() => { void fetchMessages(); }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${offerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        setContent("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col border rounded-lg bg-background overflow-hidden" style={{ height: 320 }}>
      {/* Header */}
      {otherPartyName && (
        <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
          {t.messaging.title} · {otherPartyName}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loadError ? (
          <p className="text-xs text-destructive text-center py-4">{t.messaging.loadError}</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t.messaging.noMessages}</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUserId === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? "opacity-60" : "opacity-50"} text-right`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-2 flex gap-2 items-end bg-background">
        <textarea
          className="flex-1 text-sm resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background min-h-[36px] max-h-[80px]"
          rows={1}
          placeholder={t.messaging.placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          data-testid={`message-input-${offerId}`}
        />
        <Button
          size="sm"
          onClick={() => void send()}
          disabled={!content.trim() || sending}
          data-testid={`message-send-${offerId}`}
          className="shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

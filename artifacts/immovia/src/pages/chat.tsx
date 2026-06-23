import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Chat() {
  const { t, language } = useLanguage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: language === 'sq'
        ? "Përshëndetje! Unë jam asistenti i ImmoVia365. Si mund t'ju ndihmoj me projektin tuaj sot?"
        : language === 'de'
        ? "Hallo! Ich bin der ImmoVia365-Assistent. Wie kann ich Ihnen heute bei Ihrem Projekt helfen?"
        : language === 'fr'
        ? "Bonjour ! Je suis l'assistant ImmoVia365. Comment puis-je vous aider avec votre projet aujourd'hui ?"
        : "Hello! I'm the ImmoVia365 assistant. How can I help you with your project today?"
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useSendChatMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage
    };

    setMessages(prev => [...prev, newUserMsg]);

    chatMutation.mutate(
      { data: { message: userMessage, language } },
      {
        onSuccess: (data) => {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.reply
            }
          ]);
        },
        onError: () => {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: t.common.error
            }
          ]);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 top-20 md:top-24 flex flex-col bg-background z-10">
      {/* Compact header */}
      <div className="px-4 pt-4 pb-2 md:px-6 md:pt-5 md:pb-3 flex-shrink-0 border-b border-border/40 bg-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-2xl font-serif font-bold leading-tight">{t.chat.title}</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {language === "de" ? "KI-Beratung für Ihr Renovierungsprojekt"
              : language === "fr" ? "Conseils IA pour votre projet de rénovation"
              : language === "sq" ? "Këshillim AI për projektin tuaj të rinovimit"
              : "AI guidance for your renovation project"}
          </p>
        </div>
      </div>

      {/* Chat area — fills remaining space, footer hidden behind scroll */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-2 md:px-4 pb-2 md:pb-4 pt-2">
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4"
            ref={scrollRef}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 md:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className={`w-7 h-7 md:w-8 md:h-8 flex-shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-secondary"}`}>
                  <AvatarFallback className={msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`px-3 py-2.5 md:px-4 md:py-3 rounded-2xl max-w-[82%] md:max-w-[78%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm border border-border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-2.5 md:gap-4 flex-row">
                <Avatar className="w-7 h-7 md:w-8 md:h-8 bg-secondary flex-shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <Bot size={14} />
                  </AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 rounded-2xl bg-muted text-foreground rounded-tl-sm border border-border flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 md:p-4 bg-background border-t border-border flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chat.placeholder}
                className="flex-1 pr-12 h-11 rounded-full border-border focus-visible:ring-primary text-sm"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-9 w-9 rounded-full"
                disabled={!input.trim() || chatMutation.isPending}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">{t.chat.send}</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

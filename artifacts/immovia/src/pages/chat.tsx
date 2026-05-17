import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        ? "Përshëndetje! Unë jam asistenti i ImmoVia. Si mund t'ju ndihmoj me projektin tuaj sot?"
        : language === 'de'
        ? "Hallo! Ich bin der ImmoVia-Assistent. Wie kann ich Ihnen heute bei Ihrem Projekt helfen?"
        : "Hello! I'm the ImmoVia assistant. How can I help you with your project today?"
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
    
    // Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage
    };
    
    setMessages(prev => [...prev, newUserMsg]);

    // Call API
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
    <div className="container mx-auto px-4 py-8 flex-1 flex flex-col max-w-4xl h-[calc(100vh-140px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold">{t.chat.title}</h1>
        <p className="text-muted-foreground">Expert guidance for your next project</p>
      </div>

      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-6"
          ref={scrollRef}
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar className={`w-8 h-8 ${msg.role === "user" ? "bg-primary" : "bg-secondary"}`}>
                <AvatarFallback className={msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </AvatarFallback>
              </Avatar>
              <div 
                className={`px-4 py-3 rounded-2xl max-w-[80%] ${
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
            <div className="flex gap-4 flex-row">
              <Avatar className="w-8 h-8 bg-secondary">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <Bot size={16} />
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

        <div className="p-4 bg-background border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chat.placeholder}
              className="flex-1 pr-12 rounded-full border-border focus-visible:ring-primary"
              disabled={chatMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1 h-8 w-8 rounded-full"
              disabled={!input.trim() || chatMutation.isPending}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">{t.chat.send}</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

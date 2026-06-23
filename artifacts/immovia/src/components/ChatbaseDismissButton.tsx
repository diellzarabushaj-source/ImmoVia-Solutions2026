import { useState, useEffect, useRef } from "react";
import { X, MessageSquare } from "lucide-react";

const STORAGE_KEY = "immovia_chatbase_dismissed";

function isChatbaseEl(el: HTMLElement): boolean {
  const src = (el as HTMLIFrameElement).src || "";
  const id = el.id || "";
  return (
    src.includes("chatbase") ||
    id.includes("chatbase") ||
    id.includes("sCAJBcXM9vHhwBn_Wxh19")
  );
}

function hideAllChatbase() {
  document.querySelectorAll<HTMLElement>("iframe").forEach((f) => {
    if (!isChatbaseEl(f)) return;
    let el: HTMLElement | null = f;
    let hops = 0;
    while (el && el !== document.body && hops < 8) {
      el.style.setProperty("display", "none", "important");
      el = el.parentElement;
      hops++;
    }
  });
}

function findBubbleRect(): DOMRect | null {
  for (const f of Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))) {
    if (!isChatbaseEl(f)) continue;
    const h = parseInt(f.style.height || "0");
    if (h > 0 && h <= 100) {
      return f.getBoundingClientRect();
    }
  }
  return null;
}

export function ChatbaseDismissButton() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (dismissed) {
      hideAllChatbase();
      return;
    }

    function track() {
      const rect = findBubbleRect();
      setBubbleRect(rect);
      rafRef.current = requestAnimationFrame(track);
    }

    const obs = new MutationObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(track);
    });
    obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
    track();

    return () => {
      obs.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
    setBubbleRect(null);
    hideAllChatbase();
    window.dispatchEvent(new CustomEvent("immovia:chatbase-dismissed"));
  };

  if (dismissed || !bubbleRect) return null;

  const btnSize = 22;
  const left = bubbleRect.left + bubbleRect.width - btnSize / 2;
  const top = bubbleRect.top - btnSize / 2;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 2147483647,
        pointerEvents: "auto",
      }}
    >
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            right: 0,
            background: "rgba(15,15,15,0.92)",
            color: "#fff",
            fontSize: 12,
            whiteSpace: "nowrap",
            padding: "4px 8px",
            borderRadius: 6,
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          Chatbot ausblenden
        </div>
      )}
      <button
        onClick={dismiss}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Chatbot ausblenden"
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: "50%",
          background: "#1e2a3a",
          color: "#fff",
          border: "2px solid rgba(255,255,255,0.85)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          transition: "background 0.15s",
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#0f1e30";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#1e2a3a";
        }}
      >
        <X style={{ width: 11, height: 11, strokeWidth: 3 }} />
      </button>
    </div>
  );
}

export function ChatbaseRestoreButton() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );

  useEffect(() => {
    const handler = () => setDismissed(true);
    window.addEventListener("immovia:chatbase-dismissed", handler);
    return () => window.removeEventListener("immovia:chatbase-dismissed", handler);
  }, []);

  if (!dismissed) return null;

  const restore = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={restore}
      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors cursor-pointer bg-transparent border-0 p-0"
      aria-label="Chatbot wieder einblenden"
    >
      <MessageSquare className="h-3 w-3" />
      Chatbot anzeigen
    </button>
  );
}

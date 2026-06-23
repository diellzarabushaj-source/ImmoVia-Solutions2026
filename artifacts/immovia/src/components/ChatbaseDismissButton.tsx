import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "immovia_chatbase_dismissed";

function hideChatbase() {
  document.querySelectorAll("iframe").forEach((f) => {
    const src = f.src || "";
    const id = f.id || "";
    if (!src.includes("chatbase") && !id.includes("chatbase") && !id.includes("sCAJBcXM9vHhwBn_Wxh19")) return;
    // Walk up and hide all fixed/absolute ancestors
    let el: HTMLElement | null = f;
    let hops = 0;
    while (el && el !== document.body && hops < 8) {
      el.style.setProperty("display", "none", "important");
      el = el.parentElement;
      hops++;
    }
  });
}

export function ChatbaseDismissButton() {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [visible, setVisible] = useState(false);

  // Wait until chatbase bubble appears in DOM
  useEffect(() => {
    if (dismissed) { hideChatbase(); return; }

    const check = () => {
      const found = Array.from(document.querySelectorAll("iframe")).some(f => {
        const src = f.src || "";
        const id = f.id || "";
        return src.includes("chatbase") || id.includes("chatbase") || id.includes("sCAJBcXM9vHhwBn_Wxh19");
      });
      if (found) setVisible(true);
    };

    const obs = new MutationObserver(check);
    obs.observe(document.body, { subtree: true, childList: true });
    check();
    return () => obs.disconnect();
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
    setVisible(false);
    hideChatbase();
  };

  if (dismissed || !visible) return null;

  return (
    <button
      onClick={dismiss}
      title="Chatbot ausblenden"
      className="fixed z-[9999] flex items-center justify-center"
      style={{
        bottom: 56,
        left: 8,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "rgba(30,30,30,0.82)",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }}
      aria-label="Chatbot schließen"
    >
      <X style={{ width: 11, height: 11, strokeWidth: 2.5 }} />
    </button>
  );
}

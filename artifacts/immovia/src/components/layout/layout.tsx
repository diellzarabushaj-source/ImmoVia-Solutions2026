import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { ChatWidget } from "@/components/ChatWidget";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { ChatbaseDismissButton } from "@/components/ChatbaseDismissButton";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <ChatWidget />
      <ChatbaseDismissButton />
      <CookieConsentBanner />
    </div>
  );
}

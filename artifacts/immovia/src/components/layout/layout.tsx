import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { ChatWidget } from "@/components/ChatWidget";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

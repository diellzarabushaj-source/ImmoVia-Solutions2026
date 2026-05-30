import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0f2044] to-[#1a3a6e] text-white px-4">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-bold leading-none text-white/10 mb-2 select-none">404</div>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <Home className="w-8 h-8 text-white/70" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Seite nicht gefunden</h1>
        <p className="text-white/60 mb-2 text-sm leading-relaxed">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
        <p className="text-white/40 text-xs mb-8">
          Page not found &mdash; Faqja nuk u gjet
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/">
            <Button className="bg-white text-[#0f2044] hover:bg-white/90 font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Startseite
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Search className="w-4 h-4 mr-2" />
              Projekte ansehen
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

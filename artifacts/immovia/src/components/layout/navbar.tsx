import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/submit-project", label: t.nav.submitProject },
    { href: "/register-company", label: t.nav.registerCompany },
    { href: "/companies", label: t.nav.companies },
    { href: "/chat", label: t.nav.chat },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-serif font-bold text-xl leading-none">I</span>
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-foreground">
            ImmoVia
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`nav-${link.href.replace("/", "") || "home"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 px-0" data-testid="button-language">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Toggle language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-muted' : ''}>
                English (EN)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('de')} className={language === 'de' ? 'bg-muted' : ''}>
                Deutsch (DE)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('sq')} className={language === 'sq' ? 'bg-muted' : ''}>
                Shqip (SQ)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="md:hidden">
            {/* Mobile menu toggle could go here */}
          </div>
        </div>
      </div>
    </nav>
  );
}

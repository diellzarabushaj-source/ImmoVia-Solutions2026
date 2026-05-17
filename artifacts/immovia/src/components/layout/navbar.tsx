import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X } from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/submit-project", label: t.nav.submitProject },
    { href: "/register-company", label: t.nav.registerCompany },
    { href: "/companies", label: t.nav.companies },
    { href: "/chat", label: t.nav.chat },
  ];

  const langOptions = [
    { code: 'en' as const, label: 'English', flag: 'EN' },
    { code: 'de' as const, label: 'Deutsch', flag: 'DE' },
    { code: 'sq' as const, label: 'Shqip', flag: 'SQ' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center" data-testid="link-home-logo">
          <img
            src="/logo-color.png"
            alt="ImmoVia"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-primary hover:bg-secondary/50 ${
                location === link.href
                  ? "text-primary bg-secondary/50"
                  : "text-foreground/70"
              }`}
              data-testid={`nav-${link.href.replace("/", "") || "home"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-foreground/70 hover:text-primary"
                data-testid="button-language"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {language}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {langOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`cursor-pointer gap-2 ${language === opt.code ? "bg-secondary text-primary font-semibold" : ""}`}
                  data-testid={`lang-${opt.code}`}
                >
                  <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">
                    {opt.flag}
                  </span>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CTA button */}
          <Link href="/submit-project" className="hidden md:block">
            <Button size="sm" className="text-sm" data-testid="nav-cta">
              {t.hero.ctaProject}
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium px-3 py-2.5 rounded-md transition-colors ${
                  location === link.href
                    ? "text-primary bg-secondary/50"
                    : "text-foreground/70 hover:text-primary hover:bg-secondary/30"
                }`}
                data-testid={`mobile-nav-${link.href.replace("/", "") || "home"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

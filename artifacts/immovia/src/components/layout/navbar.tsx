import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/contexts/AuthContext";
import { useClerk } from "@clerk/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, User, LayoutDashboard, LogOut } from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { signOut } = useClerk();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/projects", label: t.nav.browseProjects },
    { href: "/companies", label: t.nav.browseServiceProviders },
    { href: "/#how-it-works", label: t.nav.howItWorks },
    { href: "/blog", label: t.nav.blog },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/contact", label: t.nav.contact },
  ];

  const langOptions = [
    { code: 'en' as const, label: 'English', flag: 'EN' },
    { code: 'fr' as const, label: 'Français', flag: 'FR' },
    { code: 'de' as const, label: 'Deutsch', flag: 'DE' },
    { code: 'sq' as const, label: 'Shqip', flag: 'SQ' },
  ];

  const onLogout = async () => {
    await signOut({ redirectUrl: basePath || "/" });
    setLocation("/");
  };

  const initials = user
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0" data-testid="link-home-logo">
          <img
            src="/logo-color.png"
            alt="ImmoVia"
            className="h-16 md:h-20 w-auto object-contain"
            decoding="async"
            loading="eager"
          />
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-primary hover:bg-secondary/50 ${
                location === link.href ? "text-primary bg-secondary/50" : "text-foreground/70"
              }`}
              data-testid={`nav-${link.href.replace("/", "") || "home"}`}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-px h-5 bg-border mx-2 shrink-0" />

          <Link href="/signup?account_type=project_poster" data-testid="nav-submit-project">
            <Button
              size="sm"
              className={`text-sm ${location === "/submit-project" ? "opacity-90" : ""}`}
            >
              {t.nav.submitProject}
            </Button>
          </Link>

          <Link href="/signup?account_type=service_provider" data-testid="nav-register-company">
            <Button
              variant="outline"
              size="sm"
              className={`text-sm border-primary/40 text-primary hover:bg-primary/8 hover:border-primary ${
                location === "/register-company" ? "bg-primary/8 border-primary" : ""
              }`}
            >
              {t.nav.registerCompany}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-foreground/70 hover:text-primary" data-testid="button-language">
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">{language}</span>
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
                  <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{opt.flag}</span>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex" data-testid="button-user-menu">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {initials}
                  </span>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.fullName.split(" ")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer gap-2" data-testid="menu-dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    {t.nav.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer gap-2" data-testid="menu-profile">
                    <User className="w-4 h-4" />
                    {t.nav.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void onLogout()} className="cursor-pointer gap-2 text-destructive" data-testid="menu-logout">
                  <LogOut className="w-4 h-4" />
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <Button variant="ghost" size="sm" data-testid="nav-login">{t.nav.login}</Button>
              </Link>
              <Link href="/signup" className="hidden md:block">
                <Button size="sm" data-testid="nav-signup">{t.nav.signup}</Button>
              </Link>
            </>
          )}

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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden border-t border-border bg-white overflow-hidden"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-base font-medium px-3 py-3 rounded-md transition-colors ${
                    location === link.href ? "text-primary bg-secondary/50" : "text-foreground/70 hover:text-primary hover:bg-secondary/30"
                  }`}
                  data-testid={`mobile-nav-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/signup?account_type=project_poster" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30">
                {t.nav.submitProject}
              </Link>
              <Link href="/signup?account_type=service_provider" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30">
                {t.nav.registerCompany}
              </Link>
              <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30">
                      {t.nav.dashboard}
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30">
                      {t.nav.profile}
                    </Link>
                    <button onClick={() => { setMobileOpen(false); void onLogout(); }} className="text-left text-base font-medium px-3 py-3 rounded-md text-destructive hover:bg-destructive/10">
                      {t.nav.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30">
                      {t.nav.login}
                    </Link>
                    <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-primary bg-secondary/50">
                      {t.nav.signup}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

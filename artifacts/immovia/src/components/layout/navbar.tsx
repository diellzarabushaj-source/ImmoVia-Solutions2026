import { Link, useLocation, useSearch } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { useAuth, isServiceProvider, isProjectPoster } from "@/contexts/AuthContext";
import { useClerk, useUser } from "@clerk/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, User, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const avatarUrl = clerkUser?.imageUrl ?? null;
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  // Exactly one role drives the post-sign-in nav, enforcing strict separation.
  // accountType is authoritative; legacy `role` is only a fallback when it's missing.
  const accountRole: "provider" | "poster" | null = !user
    ? null
    : user.accountType === "service_provider"
      ? "provider"
      : user.accountType === "project_poster"
        ? "poster"
        : isServiceProvider(user)
          ? "provider"
          : isProjectPoster(user)
            ? "poster"
            : null;
  const isProvider = accountRole === "provider";
  const isPoster = accountRole === "poster";

  const search = useSearch();
  const providerTab = new URLSearchParams(search).get("tab") ?? "";

  const providerNavLinks = [
    { href: "/provider",                    label: t.nav.dashboard,       tab: "" },
    { href: "/provider?tab=projekte",       label: t.nav.findProjects,    tab: "projekte" },
    { href: "/provider?tab=bewerbungen",    label: t.nav.myApplications,  tab: "bewerbungen" },
    { href: "/provider?tab=nachrichten",    label: t.nav.messages,        tab: "nachrichten" },
    { href: "/provider?tab=profil",         label: t.nav.companyProfile,  tab: "profil" },
    { href: "/provider?tab=plan",           label: t.nav.plan,            tab: "plan" },
    { href: "/provider?tab=einstellungen",  label: t.nav.settings,        tab: "einstellungen" },
  ];

  const isProviderLinkActive = (tab: string) =>
    location === "/provider" && (tab === "" ? (!providerTab || providerTab === "uebersicht") : providerTab === tab);

  const providerLinkClass = (tab: string) =>
    `text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-primary hover:bg-secondary/50 whitespace-nowrap ${
      isProviderLinkActive(tab) ? "text-primary bg-secondary/50" : "text-foreground/70"
    }`;

  const posterTab = new URLSearchParams(search).get("tab") ?? "";

  const posterNavLinks = [
    { href: "/dashboard",                   label: t.nav.dashboard,      tab: "" },
    { href: "/dashboard?tab=erstellen",     label: t.nav.postProject,    tab: "erstellen" },
    { href: "/dashboard?tab=projekte",      label: t.nav.myProjects,     tab: "projekte" },
    { href: "/dashboard?tab=angebote",      label: t.nav.offers,         tab: "angebote" },
    { href: "/dashboard?tab=nachrichten",   label: t.nav.messages,       tab: "nachrichten" },
    { href: "/dashboard?tab=favoriten",     label: t.nav.savedProviders, tab: "favoriten" },
    { href: "/dashboard?tab=einstellungen", label: t.nav.settings,       tab: "einstellungen" },
  ];

  const isPosterLinkActive = (tab: string) =>
    location === "/dashboard" && (tab === "" ? (!posterTab || posterTab === "uebersicht") : posterTab === tab);

  const posterLinkClass = (tab: string) =>
    `text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-primary hover:bg-secondary/50 whitespace-nowrap ${
      isPosterLinkActive(tab) ? "text-primary bg-secondary/50" : "text-foreground/70"
    }`;

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const r = await fetch("/api/conversations/unread-count");
      if (r.ok) {
        const d = await r.json() as { total: number };
        setUnreadCount(d.total);
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    void fetchUnread();
    const id = window.setInterval(() => void fetchUnread(), 30_000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/projects", label: t.nav.browseProjects },
    { href: "/companies", label: t.nav.browseServiceProviders },
    { href: "/#how-it-works", label: t.nav.howItWorks },
    { href: "/blog", label: t.nav.blog },
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

  const openChatWidget = () => {
    const fab = document.querySelector<HTMLButtonElement>("[aria-label='Messages']");
    fab?.click();
  };

  const scrollToHash = (hash: string) => {
    const el = document.getElementById(hash);
    if (el) {
      const navHeight = window.innerWidth >= 768 ? 96 : 80;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (!href.includes("#")) return;
    e.preventDefault();
    const [path, hash] = href.split("#");
    const targetPath = path || "/";
    if (location === targetPath || (targetPath === "/" && location === "/")) {
      scrollToHash(hash);
    } else {
      setLocation(targetPath);
      setTimeout(() => scrollToHash(hash), 120);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0" data-testid="link-home-logo">
          <img
            src="/logo-color.png"
            alt="ImmoVia365"
            className="h-14 md:h-16 w-auto object-contain"
            decoding="async"
            loading="eager"
          />
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {isProvider ? (
            providerNavLinks.map((link) => (
              <div key={link.tab || "dashboard"} className="relative">
                <Link
                  href={link.href}
                  className={providerLinkClass(link.tab)}
                  data-testid={`nav-provider-${link.tab || "dashboard"}`}
                >
                  {link.label}
                </Link>
                {link.tab === "nachrichten" && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 pointer-events-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            ))
          ) : isPoster ? (
            posterNavLinks.map((link) => (
              <div key={link.tab || "dashboard"} className="relative">
                <Link
                  href={link.href}
                  className={posterLinkClass(link.tab)}
                  data-testid={`nav-poster-${link.tab || "dashboard"}`}
                >
                  {link.label}
                </Link>
                {link.tab === "nachrichten" && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 pointer-events-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            ))
          ) : (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-sm font-medium px-3 py-2 rounded-md transition-colors hover:text-primary hover:bg-secondary/50 whitespace-nowrap ${
                    location === link.href ? "text-primary bg-secondary/50" : "text-foreground/70"
                  }`}
                  data-testid={`nav-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <div className="w-px h-4 bg-border mx-1.5 shrink-0" />
                  <Link href="/sign-in">
                    <Button variant="ghost" size="sm" className="text-sm" data-testid="nav-login">{t.nav.login}</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="text-sm" data-testid="nav-signup">{t.nav.signup}</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 px-3 border-border/60 bg-background/80 hover:bg-primary/5 hover:border-primary/40 hover:text-primary text-foreground/75 rounded-lg shadow-sm transition-all duration-200"
                data-testid="button-language"
              >
                <Globe className="h-[15px] w-[15px] opacity-80" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{language}</span>
                <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-border/60 p-1">
              {langOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm ${language === opt.code ? "bg-primary/8 text-primary font-semibold" : "text-foreground/80"}`}
                  data-testid={`lang-${opt.code}`}
                >
                  <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{opt.flag}</span>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              {/* Messages icon — hidden for providers and posters (messages is in their nav) */}
              {!isProvider && !isPoster && <div className="relative hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-foreground/70 hover:text-primary"
                  aria-label="Open messages"
                  data-testid="nav-messages"
                  onClick={openChatWidget}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 pointer-events-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>}

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex" data-testid="button-user-menu">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={initials} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                        {initials}
                      </span>
                    )}
                    <span className="text-sm font-medium max-w-[120px] truncate">{user.fullName.split(" ")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!isProvider && !isPoster && (
                    <>
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
                    </>
                  )}
                  {isPoster && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="cursor-pointer gap-2" data-testid="menu-profile-poster">
                          <User className="w-4 h-4" />
                          {t.nav.profile}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => void onLogout()} className="cursor-pointer gap-2 text-destructive" data-testid="menu-logout">
                    <LogOut className="w-4 h-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}

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
              {isProvider ? (
                <>
                  {providerNavLinks.map((link) => (
                    <Link
                      key={link.tab || "dashboard"}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between text-base font-medium px-3 py-3 rounded-md transition-colors ${
                        isProviderLinkActive(link.tab) ? "text-primary bg-secondary/50" : "text-foreground/70 hover:text-primary hover:bg-secondary/30"
                      }`}
                      data-testid={`mobile-nav-provider-${link.tab || "dashboard"}`}
                    >
                      {link.label}
                      {link.tab === "nachrichten" && unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  ))}
                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      onClick={() => { setMobileOpen(false); void onLogout(); }}
                      className="text-left w-full text-base font-medium px-3 py-3 rounded-md text-destructive hover:bg-destructive/10"
                    >
                      {t.nav.logout}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {isPoster ? (
                    <>
                      {posterNavLinks.map((link) => (
                        <Link
                          key={link.tab || "dashboard"}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between text-base font-medium px-3 py-3 rounded-md transition-colors ${
                            isPosterLinkActive(link.tab) ? "text-primary bg-secondary/50" : "text-foreground/70 hover:text-primary hover:bg-secondary/30"
                          }`}
                          data-testid={`mobile-nav-poster-${link.tab || "dashboard"}`}
                        >
                          {link.label}
                          {link.tab === "nachrichten" && unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30"
                          data-testid="mobile-nav-poster-profile"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.profile}
                        </Link>
                        <button
                          onClick={() => { setMobileOpen(false); void onLogout(); }}
                          className="text-left w-full text-base font-medium px-3 py-3 rounded-md text-destructive hover:bg-destructive/10"
                        >
                          {t.nav.logout}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={(e) => { handleNavClick(e, link.href); setMobileOpen(false); }}
                          className={`text-base font-medium px-3 py-3 rounded-md transition-colors ${
                            location === link.href ? "text-primary bg-secondary/50" : "text-foreground/70 hover:text-primary hover:bg-secondary/30"
                          }`}
                          data-testid={`mobile-nav-${link.href.replace("/", "") || "home"}`}
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
                        {user ? (
                          <button onClick={() => { setMobileOpen(false); void onLogout(); }} className="text-left text-base font-medium px-3 py-3 rounded-md text-destructive hover:bg-destructive/10">
                            {t.nav.logout}
                          </button>
                        ) : (
                          <>
                            <div className="border-t border-border mt-1 pt-1">
                              <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-foreground/70 hover:text-primary hover:bg-secondary/30 block">
                                {t.nav.login}
                              </Link>
                              <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-base font-medium px-3 py-3 rounded-md text-primary bg-secondary/50 block">
                                {t.nav.signup}
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

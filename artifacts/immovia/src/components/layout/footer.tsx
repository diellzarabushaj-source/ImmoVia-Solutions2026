import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { MapPin, Mail, Shield, Lock, HelpCircle } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/submit-project", label: t.nav.submitProject },
    { href: "/register-company", label: t.nav.registerCompany },
    { href: "/companies", label: t.nav.companies },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/blog", label: t.nav.blog },
  ];

  const legalLinks = [
    { href: "/terms", label: t.footer.terms, icon: Shield },
    { href: "/privacy", label: t.footer.privacy, icon: Lock },
    { href: "/faq", label: t.footer.faq, icon: HelpCircle },
  ];

  return (
    <footer className="bg-foreground text-white/80">
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/">
              <img
                src="/icon-mark.png"
                alt="ImmoVia365"
                className="h-20 md:h-24 w-auto object-contain object-left"
              />
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t.footer.links}
            </h4>
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t.footer.legal}
            </h4>
            <ul className="flex flex-col gap-3">
              {legalLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Security badges */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Shield className="h-3 w-3 text-primary/60" />
                <span>HTTPS / TLS Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Lock className="h-3 w-3 text-primary/60" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t.footer.contact}
            </h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{t.footer.email}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{t.footer.address}</span>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/immo.via365?igsh=MTBpNDF3ZzQ1Y2t4Yw=="
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                  @immo.via365
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} ImmoVia365. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              {t.footer.terms}
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              {t.footer.privacy}
            </Link>
            <span className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("immovia:open-cookie-settings"))}
              className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Cookie-Einstellungen
            </button>
            <span className="text-white/20">·</span>
            <Link href="/admin" className="text-xs text-white/20 hover:text-white/40 transition-colors">
              {t.footer.admin}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

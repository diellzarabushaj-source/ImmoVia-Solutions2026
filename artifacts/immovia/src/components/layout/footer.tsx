import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/submit-project", label: t.nav.submitProject },
    { href: "/register-company", label: t.nav.registerCompany },
    { href: "/companies", label: t.nav.companies },
    { href: "/chat", label: t.nav.chat },
  ];

  return (
    <footer className="bg-foreground text-white/80">
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/">
              <img
                src="/logo-white.png"
                alt="ImmoVia"
                className="h-16 w-auto object-contain object-left"
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
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{t.footer.phone}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{t.footer.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} ImmoVia. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}

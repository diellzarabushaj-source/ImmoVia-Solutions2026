import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-serif font-bold text-sm leading-none">I</span>
          </div>
          <span className="font-serif font-semibold text-lg tracking-tight text-foreground">
            ImmoVia
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} ImmoVia. {t.footer.rights}
        </p>

        <div className="flex items-center">
          <Link 
            href="/admin" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors opacity-50 hover:opacity-100"
            data-testid="link-admin"
          >
            {t.footer.admin}
          </Link>
        </div>
      </div>
    </footer>
  );
}

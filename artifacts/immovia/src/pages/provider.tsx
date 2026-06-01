import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import NotificationBell from "@/components/NotificationBell";
import { CATEGORIES, getCategoryLabel, resolveTagLabel, resolveCategoryLabel, type Lang } from "@/lib/categories";
import { ProjectCard } from "@/components/project/ProjectCard";
import {
  billingApi,
  offerCostFor,
  type CreditBalance,
  type ImmoTransaction,
  type ProviderOffer,
  type ProviderProject,
  type AppStats,
  type PaymentRow,
  type InvoiceRow,
} from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowUpRight,
  Sparkles,
  Flame,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MapPin,
  CalendarDays,
  Wallet,
  Clock,
  Images,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  X,
  LayoutDashboard,
  User,
  Search,
  FileText,
  CreditCard,
  Eye,
  Receipt,
  Settings,
  Check,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  ShieldOff,
  Award,
  Camera,
  Tag,
  CircleDollarSign,
  Send,
  LogOut,
} from "lucide-react";
import MessageThread from "@/components/MessageThread";
import { MessagingSystem } from "@/components/MessagingSystem";
import { PhotoUploader } from "@/components/photo-uploader";
import ProfilbildSection from "@/components/provider/ProfilbildSection";
import GalerieSection from "@/components/provider/GalerieSection";
import LeistungenSection from "@/components/provider/LeistungenSection";
import PreiseSection from "@/components/provider/PreiseSection";
import { format } from "date-fns";

function formatCHF(cents: number): string {
  if (cents === 0) return "CHF 0";
  return `CHF ${(cents / 100).toFixed(0)}`;
}

const L: Record<string, Record<string, string>> = {
  sq: {
    navOverview: "Gjithëpamje",
    navProfile: "Profili im",
    navProfilbild: "Foto & Logo",
    navGalerie: "Galeria",
    navLeistungen: "Shërbime",
    navPreise: "Çmimet",
    navProjects: "Gjej Projekte",
    navApplications: "Aplikimet e mia",
    navAngebote: "Ofertat",
    navPlan: "Plani im",
    navVisibility: "Dukshmëria",
    navReviews: "Vlerësimet",
    navInvoices: "Faturat",
    navSettings: "Cilësimet",
    appsThisMonth: "Aplikime këtë muaj",
    appsLimit: "Kufiri",
    contactVisible: "Kontaktet të dukshme",
    contactHidden: "Kontaktet të fshehura",
    planBadge: "Distinktivi juaj",
    upgradeNow: "Ndrysho planin",
    limitReached: "Kufiri mujor arritur",
    visibility: "Dukshmëria e profilit",
    includedFeatures: "Çfarë përfshin plani",
    reviewsComingSoon: "Vlerësimet vijnë së shpejti",
    settingsComingSoon: "Cilësimet vijnë së shpejti",
    profileComingSoon: "Redaktimi i profilit vjen së shpejti",
    profileViewPublic: "Shiko profilin publik",
    overviewWelcome: "Paneli juaj i ofruesit",
    applications: "Aplikime",
    currentPlan: "Plani aktual",
    upgradeBtn: "Ndrysho planin",
    visRowContacts: "Kontaktet (telefon, email, website)",
    visRowBadge: "Distinktivi i ofruesit",
    visRowRanking: "Renditja në listë",
    visRowPortfolio: "Fotot e portfolio",
    visValueFree: "Nuk shfaqet",
    visValueVisible: "Shfaqet",
    visValueBasic: "Bazike (3 foto)",
    visValueFull: "E plotë (10 foto)",
    visValueUnlimited: "E pakufizuar",
    visValuePriority: "Prioritare",
    visValueStandard: "Standarde",
    settingsSoon: "Cilësimet e llogarisë vijnë së shpejti.",
    settingsAccount: "Llogaria",
    settingsName: "Emri",
    settingsEmail: "Email",
    settingsRole: "Lloji i llogarisë",
    settingsRoleProvider: "Ofrues Shërbimi",
    settingsSubIndividual: "Individ",
    settingsSubCompany: "Kompani",
    settingsLanguage: "Gjuha",
    settingsLanguageHint: "Zgjidhni gjuhën e panelit tuaj",
    settingsSession: "Sesioni",
    settingsLogout: "Dil nga llogaria",
    settingsLogoutHint: "Dilni nga llogaria juaj në mënyrë të sigurt",
    profileSoon: "Redaktimi i detajuar i profilit vjen së shpejti.",
    planAppsPerMonth: "aplikime / muaj",
    navMessages: "Mesazhet",
    profilePhoto: "Foto e profilit",
    profileBio: "Përshkrim",
    profilePhone: "Telefon",
    profileCity: "Qyteti",
    profileWebsite: "Faqja web",
    profileHourlyRate: "Tarifa orare (€)",
    profileSave: "Ruaj ndryshimet",
    profileSaved: "Profili u ruajt me sukses.",
    profileError: "Gabim gjatë ruajtjes.",
    portfolioTitle: "Galeria e portofolit",
    portfolioAdd: "Shto foto",
    portfolioHint: "Shto fotografi nga projektet tuaja (max 10 MB · JPG, PNG)",
    portfolioEmpty: "Ende asnjë foto në portofolio.",
    invoicesTitle: "Rechnungen",
    noPayments: "Asnjë pagesë ende.",
    noInvoices: "Asnjë faturë ende.",
    downloadPdf: "Shkarko",
    paymentHistory: "Historiku i pagesave",
    nextBilling: "Faturimi tjetër",
    periodEnd: "Fundi i periudhës",
  },
  en: {
    navOverview: "Overview",
    navProfile: "My Profile",
    navProfilbild: "Photos & Logo",
    navGalerie: "Gallery",
    navLeistungen: "Services",
    navPreise: "Pricing",
    navProjects: "Find Projects",
    navApplications: "My Applications",
    navAngebote: "Offers",
    navPlan: "My Plan",
    navVisibility: "Visibility",
    navReviews: "Reviews",
    navInvoices: "Invoices",
    navSettings: "Settings",
    appsThisMonth: "Applications this month",
    appsLimit: "Limit",
    contactVisible: "Contact details visible",
    contactHidden: "Contact details hidden",
    planBadge: "Your badge",
    upgradeNow: "Upgrade now",
    limitReached: "Monthly limit reached",
    visibility: "Your profile visibility",
    includedFeatures: "What your plan includes",
    reviewsComingSoon: "Reviews coming soon",
    settingsComingSoon: "Settings coming soon",
    profileComingSoon: "Profile editing coming soon",
    profileViewPublic: "View public profile",
    overviewWelcome: "Your Service Provider dashboard",
    applications: "Applications",
    currentPlan: "Current plan",
    upgradeBtn: "Upgrade plan",
    visRowContacts: "Contacts (phone, email, website)",
    visRowBadge: "Provider badge",
    visRowRanking: "Ranking in listings",
    visRowPortfolio: "Portfolio photos",
    visValueFree: "Hidden",
    visValueVisible: "Visible",
    visValueBasic: "Basic (3 photos)",
    visValueFull: "Full (10 photos)",
    visValueUnlimited: "Unlimited",
    visValuePriority: "Priority",
    visValueStandard: "Standard",
    settingsSoon: "Account settings coming soon.",
    settingsAccount: "Account",
    settingsName: "Name",
    settingsEmail: "Email",
    settingsRole: "Account type",
    settingsRoleProvider: "Service Provider",
    settingsSubIndividual: "Individual",
    settingsSubCompany: "Company",
    settingsLanguage: "Language",
    settingsLanguageHint: "Choose your dashboard language",
    settingsSession: "Session",
    settingsLogout: "Log out",
    settingsLogoutHint: "Sign out of your account securely",
    profileSoon: "Detailed profile editing coming soon.",
    planAppsPerMonth: "applications / month",
    navMessages: "Messages",
    profilePhoto: "Profile photo",
    profileBio: "Description",
    profilePhone: "Phone",
    profileCity: "City",
    profileWebsite: "Website",
    profileHourlyRate: "Hourly rate (€)",
    profileSave: "Save changes",
    profileSaved: "Profile saved successfully.",
    profileError: "Error saving profile.",
    portfolioTitle: "Portfolio gallery",
    portfolioAdd: "Add photo",
    portfolioHint: "Add photos from your projects (max 10 MB · JPG, PNG)",
    portfolioEmpty: "No portfolio photos yet.",
    invoicesTitle: "Invoices",
    noPayments: "No payments yet.",
    noInvoices: "No invoices yet.",
    downloadPdf: "Download",
    paymentHistory: "Payment history",
    nextBilling: "Next billing",
    periodEnd: "Period end",
  },
  de: {
    navOverview: "Übersicht",
    navProfile: "Mein Dienstleisterprofil",
    navProfilbild: "Profilbild & Logo",
    navGalerie: "Galerie & Portfolio",
    navLeistungen: "Leistungen & Kategorien",
    navPreise: "Preise & Richtwerte",
    navProjects: "Projekte finden",
    navApplications: "Meine Bewerbungen",
    navAngebote: "Angebote",
    navPlan: "Mein Plan",
    navVisibility: "Sichtbarkeit",
    navReviews: "Bewertungen",
    navInvoices: "Rechnungen",
    navSettings: "Einstellungen",
    appsThisMonth: "Bewerbungen diesen Monat",
    appsLimit: "Limit",
    contactVisible: "Kontaktdaten sichtbar",
    contactHidden: "Kontaktdaten verborgen",
    planBadge: "Ihr Abzeichen",
    upgradeNow: "Jetzt upgraden",
    limitReached: "Monatliches Limit erreicht",
    visibility: "Ihre Profilsichtbarkeit",
    includedFeatures: "Was Ihr Plan enthält",
    reviewsComingSoon: "Bewertungen folgen bald",
    settingsComingSoon: "Einstellungen folgen bald",
    profileComingSoon: "Profilbearbeitung folgt bald",
    profileViewPublic: "Öffentliches Profil ansehen",
    overviewWelcome: "Ihr Dienstleister-Dashboard",
    applications: "Bewerbungen",
    currentPlan: "Aktueller Plan",
    upgradeBtn: "Plan wechseln",
    visRowContacts: "Kontaktdaten (Telefon, E-Mail, Website)",
    visRowBadge: "Dienstleisterabzeichen",
    visRowRanking: "Platzierung in der Liste",
    visRowPortfolio: "Portfolio-Fotos",
    visValueFree: "Verborgen",
    visValueVisible: "Sichtbar",
    visValueBasic: "Basis (3 Fotos)",
    visValueFull: "Vollständig (10 Fotos)",
    visValueUnlimited: "Unbegrenzt",
    visValuePriority: "Priorität",
    visValueStandard: "Standard",
    settingsSoon: "Kontoeinstellungen folgen bald.",
    settingsAccount: "Konto",
    settingsName: "Name",
    settingsEmail: "E-Mail",
    settingsRole: "Kontotyp",
    settingsRoleProvider: "Dienstleister",
    settingsSubIndividual: "Einzelperson",
    settingsSubCompany: "Unternehmen",
    settingsLanguage: "Sprache",
    settingsLanguageHint: "Wählen Sie die Sprache Ihres Dashboards",
    settingsSession: "Sitzung",
    settingsLogout: "Abmelden",
    settingsLogoutHint: "Melden Sie sich sicher von Ihrem Konto ab",
    profileSoon: "Detaillierte Profilbearbeitung folgt bald.",
    planAppsPerMonth: "Bewerbungen / Monat",
    navMessages: "Nachrichten",
    profilePhoto: "Profilfoto",
    profileBio: "Beschreibung",
    profilePhone: "Telefon",
    profileCity: "Stadt",
    profileWebsite: "Website",
    profileHourlyRate: "Stundensatz (€)",
    profileSave: "Änderungen speichern",
    profileSaved: "Profil erfolgreich gespeichert.",
    profileError: "Fehler beim Speichern.",
    portfolioTitle: "Portfolio-Galerie",
    portfolioAdd: "Foto hinzufügen",
    portfolioHint: "Fügen Sie Fotos Ihrer Projekte hinzu (max. 10 MB · JPG, PNG)",
    portfolioEmpty: "Noch keine Portfolio-Fotos.",
    invoicesTitle: "Rechnungen",
    noPayments: "Noch keine Zahlungen.",
    noInvoices: "Noch keine Rechnungen.",
    downloadPdf: "Herunterladen",
    paymentHistory: "Zahlungsverlauf",
    nextBilling: "Nächste Abrechnung",
    periodEnd: "Periodenende",
  },
  fr: {
    navOverview: "Vue d'ensemble",
    navProfile: "Mon profil",
    navProfilbild: "Photo & Logo",
    navGalerie: "Galerie & Portfolio",
    navLeistungen: "Services & Catégories",
    navPreise: "Prix & Tarifs",
    navProjects: "Trouver des projets",
    navApplications: "Mes candidatures",
    navAngebote: "Offres",
    navPlan: "Mon plan",
    navVisibility: "Visibilité",
    navReviews: "Avis",
    navInvoices: "Factures",
    navSettings: "Paramètres",
    appsThisMonth: "Candidatures ce mois",
    appsLimit: "Limite",
    contactVisible: "Coordonnées visibles",
    contactHidden: "Coordonnées masquées",
    planBadge: "Votre badge",
    upgradeNow: "Mettre à niveau",
    limitReached: "Limite mensuelle atteinte",
    visibility: "Visibilité de votre profil",
    includedFeatures: "Ce qu'inclut votre plan",
    reviewsComingSoon: "Avis bientôt disponibles",
    settingsComingSoon: "Paramètres bientôt disponibles",
    profileComingSoon: "Modification du profil bientôt disponible",
    profileViewPublic: "Voir le profil public",
    overviewWelcome: "Votre tableau de bord prestataire",
    applications: "Candidatures",
    currentPlan: "Plan actuel",
    upgradeBtn: "Changer de plan",
    visRowContacts: "Coordonnées (tél., e-mail, site web)",
    visRowBadge: "Badge prestataire",
    visRowRanking: "Classement dans les listes",
    visRowPortfolio: "Photos du portfolio",
    visValueFree: "Masqué",
    visValueVisible: "Visible",
    visValueBasic: "Basique (3 photos)",
    visValueFull: "Complet (10 photos)",
    visValueUnlimited: "Illimité",
    visValuePriority: "Prioritaire",
    visValueStandard: "Standard",
    settingsSoon: "Paramètres du compte bientôt disponibles.",
    settingsAccount: "Compte",
    settingsName: "Nom",
    settingsEmail: "E-mail",
    settingsRole: "Type de compte",
    settingsRoleProvider: "Prestataire",
    settingsSubIndividual: "Particulier",
    settingsSubCompany: "Entreprise",
    settingsLanguage: "Langue",
    settingsLanguageHint: "Choisissez la langue de votre tableau de bord",
    settingsSession: "Session",
    settingsLogout: "Se déconnecter",
    settingsLogoutHint: "Déconnectez-vous de votre compte en toute sécurité",
    profileSoon: "Modification détaillée du profil bientôt disponible.",
    planAppsPerMonth: "candidatures / mois",
    navMessages: "Messages",
    profilePhoto: "Photo de profil",
    profileBio: "Description",
    profilePhone: "Téléphone",
    profileCity: "Ville",
    profileWebsite: "Site web",
    profileHourlyRate: "Taux horaire (€)",
    profileSave: "Enregistrer les modifications",
    profileSaved: "Profil enregistré avec succès.",
    profileError: "Erreur lors de l'enregistrement.",
    portfolioTitle: "Galerie portfolio",
    portfolioAdd: "Ajouter une photo",
    portfolioHint: "Ajoutez des photos de vos projets (max 10 Mo · JPG, PNG)",
    portfolioEmpty: "Pas encore de photos de portfolio.",
    invoicesTitle: "Factures",
    noPayments: "Pas encore de paiements.",
    noInvoices: "Pas encore de factures.",
    downloadPdf: "Télécharger",
    paymentHistory: "Historique des paiements",
    nextBilling: "Prochaine facturation",
    periodEnd: "Fin de période",
  },
};

type Section =
  | "uebersicht"
  | "profil"
  | "profilbild"
  | "galerie"
  | "leistungen"
  | "preise"
  | "projekte"
  | "bewerbungen"
  | "angebote"
  | "nachrichten"
  | "plan"
  | "sichtbarkeit"
  | "bewertungen"
  | "rechnungen"
  | "einstellungen";

export default function ProviderDashboard() {
  const { user, loading, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const l = L[language] ?? L.de;

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [transactions, setTransactions] = useState<ImmoTransaction[]>([]);
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [offers, setOffers] = useState<ProviderOffer[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [detailProject, setDetailProject] = useState<ProviderProject | null>(null);
  const [offerProject, setOfferProject] = useState<ProviderProject | null>(null);
  const [offerType, setOfferType] = useState<"normal" | "highlighted" | "top">("normal");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openThreads, setOpenThreads] = useState<Set<number>>(new Set());
  const [browseTypeFilter, setBrowseTypeFilter] = useState("");
  const [browseCityFilter, setBrowseCityFilter] = useState("");
  const [browseSizeFilter, setBrowseSizeFilter] = useState("");
  const [browseBudgetFilter, setBrowseBudgetFilter] = useState("");
  const [browseView, setBrowseView] = useState<"grid" | "list">("grid");
  const [galleryProject, setGalleryProject] = useState<ProviderProject | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const VALID_SECTIONS: Section[] = ["uebersicht","profil","profilbild","galerie","leistungen","preise","projekte","bewerbungen","angebote","nachrichten","plan","sichtbarkeit","bewertungen","rechnungen","einstellungen"];
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const tab = new URLSearchParams(search).get("tab") as Section | null;
    return (tab && VALID_SECTIONS.includes(tab)) ? tab : "uebersicht";
  });

  // Sync active section when navbar links change the URL
  useEffect(() => {
    const tab = new URLSearchParams(search).get("tab") as Section | null;
    if (tab && VALID_SECTIONS.includes(tab)) {
      setActiveSection(tab);
    } else if (!tab) {
      setActiveSection("uebersicht");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Profile editing state
  const [profileForm, setProfileForm] = useState({ bio: "", phone: "", city: "", website: "", hourlyRate: "", profilePhoto: "" });
  const [portfolioItems, setPortfolioItems] = useState<Array<{ id: number; imageUrl: string }>>([]);
  const [portfolioObjectPaths, setPortfolioObjectPaths] = useState<string[]>([]);
  const [profilePhotoPath, setProfilePhotoPath] = useState<string>("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const toggleThread = (offerId: number) => {
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
  };

  useEffect(() => {
    if (!loading && (!user || !isServiceProvider(user))) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  const refreshAll = async () => {
    try {
      const [b, stats, txs, pjs, ofs, ps, invs] = await Promise.all([
        billingApi.balance(),
        billingApi.appStats(),
        billingApi.transactions(),
        billingApi.providerProjects(),
        billingApi.providerOffers(),
        billingApi.payments(),
        billingApi.invoices(),
      ]);
      setBalance(b);
      setAppStats(stats);
      setTransactions(txs);
      setProjects(pjs);
      setOffers(ofs);
      setPayments(ps);
      setInvoices(invs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user && isServiceProvider(user)) void refreshAll();
  }, [user]);

  const loadProfile = async () => {
    if (profileLoaded) return;
    try {
      const r = await fetch("/api/provider/profile");
      if (!r.ok) return;
      const d = await r.json() as {
        user: { bio?: string | null; phone?: string | null; city?: string | null; website?: string | null; avatarUrl?: string | null };
        company?: { hourlyRate?: number | null; profilePhoto?: string | null; galleryPhotos?: string[] | null } | null;
        portfolio: Array<{ id: number; imageUrl: string }>;
      };
      setProfileForm({
        bio: d.user.bio ?? "",
        phone: d.user.phone ?? "",
        city: d.user.city ?? "",
        website: d.user.website ?? "",
        hourlyRate: d.company?.hourlyRate != null ? String(d.company.hourlyRate) : "",
        profilePhoto: d.company?.profilePhoto ?? "",
      });
      const gallery = d.company?.galleryPhotos ?? [];
      setPortfolioItems(gallery.map((url, i) => ({ id: i + 1, imageUrl: url })));
      setProfileLoaded(true);
    } catch { /* ignore */ }
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profileForm.bio,
          phone: profileForm.phone,
          city: profileForm.city,
          website: profileForm.website,
          hourlyRate: profileForm.hourlyRate ? Number(profileForm.hourlyRate) : undefined,
          profilePhoto: profileForm.profilePhoto || undefined,
          description: profileForm.bio,
        }),
      });
      if (!r.ok) throw new Error();
      setProfileMsg({ type: "ok", text: l.profileSaved });
      setProfileLoaded(false);
    } catch {
      setProfileMsg({ type: "err", text: l.profileError });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePortfolioChange = async (paths: string[]) => {
    const newPaths = paths.filter(p => !portfolioObjectPaths.includes(p));
    setPortfolioObjectPaths(paths);
    if (newPaths.length === 0) return;
    const newItems = newPaths.map((p, i) => ({ id: Date.now() + i, imageUrl: `/api/storage${p}` }));
    const next = [...portfolioItems, ...newItems];
    setPortfolioItems(next);
    try {
      await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryPhotos: next.map(p => p.imageUrl) }),
      });
    } catch { /* ignore */ }
  };

  const removePortfolioPhoto = async (id: number) => {
    const next = portfolioItems.filter(p => p.id !== id);
    setPortfolioItems(next);
    try {
      await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryPhotos: next.map(p => p.imageUrl) }),
      });
    } catch { /* ignore */ }
  };

  if (loading || !user || !isServiceProvider(user)) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const cost = offerProject ? offerCostFor(offerProject.size, offerType) : 0;
  const afterBalance = balance ? balance.total - cost : 0;
  const canSend = balance ? balance.total >= cost && offerMessage.trim().length >= 5 : false;
  const atLimit = appStats ? appStats.usedThisMonth >= appStats.appLimit : false;

  const openOfferModal = (project: ProviderProject) => {
    setOfferProject(project);
    setOfferType("normal");
    setOfferMessage("");
    setOfferPrice("");
    setError(null);
  };

  const submitOffer = async () => {
    if (!offerProject) return;
    setSubmitting(true);
    setError(null);
    try {
      await billingApi.sendOffer(offerProject.id, {
        type: offerType,
        message: offerMessage,
        priceEstimate: offerPrice || undefined,
      });
      setSuccess(t.provider.offerSent);
      setOfferProject(null);
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const typeBadge = (type: string) => {
    if (type === "top") {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
          <Flame className="w-3 h-3" /> {t.provider.offerTypeTop}
        </Badge>
      );
    }
    if (type === "highlighted") {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
          <Star className="w-3 h-3" /> {t.provider.offerTypeHighlighted}
        </Badge>
      );
    }
    return <Badge variant="outline">{t.provider.offerTypeNormal}</Badge>;
  };

  const navItems: Array<{ id: Section; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "uebersicht", label: l.navOverview, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "profil", label: l.navProfile, icon: <User className="w-4 h-4" /> },
    { id: "profilbild", label: l.navProfilbild, icon: <Camera className="w-4 h-4" /> },
    { id: "galerie", label: l.navGalerie, icon: <Images className="w-4 h-4" /> },
    { id: "leistungen", label: l.navLeistungen, icon: <Tag className="w-4 h-4" /> },
    { id: "preise", label: l.navPreise, icon: <CircleDollarSign className="w-4 h-4" /> },
    { id: "projekte", label: l.navProjects, icon: <Search className="w-4 h-4" />, badge: projects.length || undefined },
    { id: "bewerbungen", label: l.navApplications, icon: <FileText className="w-4 h-4" />, badge: offers.length || undefined },
    { id: "nachrichten", label: l.navMessages, icon: <MessageSquare className="w-4 h-4" /> },
    { id: "angebote", label: l.navAngebote, icon: <Send className="w-4 h-4" /> },
    { id: "plan", label: l.navPlan, icon: <CreditCard className="w-4 h-4" /> },
    { id: "sichtbarkeit", label: l.navVisibility, icon: <Eye className="w-4 h-4" /> },
    { id: "bewertungen", label: l.navReviews, icon: <Star className="w-4 h-4" /> },
    { id: "rechnungen", label: l.navInvoices, icon: <Receipt className="w-4 h-4" /> },
    { id: "einstellungen", label: l.navSettings, icon: <Settings className="w-4 h-4" /> },
  ];

  const planSlug = appStats?.planSlug ?? "free";

  const VISIBILITY_TABLE: Array<{
    row: string;
    free: string;
    starter: string;
    professional: string;
    premium: string;
    founding: string;
  }> = [
    {
      row: l.visRowContacts,
      free: l.visValueFree,
      starter: l.visValueVisible,
      professional: l.visValueVisible,
      premium: l.visValueVisible,
      founding: l.visValueVisible,
    },
    {
      row: l.visRowBadge,
      free: "Basic Dienstleister",
      starter: "Aktiver Dienstleister",
      professional: "Verifizierter Dienstleister",
      premium: "Top Dienstleister",
      founding: "Founding Dienstleister",
    },
    {
      row: l.visRowRanking,
      free: l.visValueStandard,
      starter: l.visValueStandard,
      professional: l.visValuePriority,
      premium: l.visValuePriority,
      founding: l.visValueStandard,
    },
    {
      row: l.visRowPortfolio,
      free: l.visValueBasic,
      starter: l.visValueFull,
      professional: l.visValueFull,
      premium: l.visValueUnlimited,
      founding: l.visValueFull,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {success && (
        <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-sm">
          {success}
        </div>
      )}

      <div className="flex justify-end mb-2">
        <NotificationBell />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="mb-4 hidden lg:block">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">
              {t.provider.title}
            </p>
          </div>

          {/* Mobile: scrollable pills */}
          <div className="flex gap-1 overflow-x-auto pb-2 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                  activeSection === item.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop: vertical nav */}
          <nav className="hidden lg:flex flex-col gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Plan badge on desktop */}
          {appStats && (
            <div className="hidden lg:block mt-6 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">{l.currentPlan}</div>
              <div className="font-semibold text-sm">{appStats.planName}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {appStats.usedThisMonth}/{appStats.appLimit} {l.applications}
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (appStats.usedThisMonth / appStats.appLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* ── ÜBERSICHT ── */}
          {activeSection === "uebersicht" && (
            <div>
              {/* Welcome header */}
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/8 via-sky-50/60 to-transparent border border-primary/10">
                <h1 className="text-2xl font-serif font-bold mb-1" data-testid="provider-heading">
                  {t.provider.welcome}, {user.fullName.split(" ")[0]}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === "de"
                    ? "Willkommen in Ihrem Dienstleister-Dashboard. Verwalten Sie Ihr Profil, präsentieren Sie Ihre Arbeiten und finden Sie passende Projekte in Ihrer Region."
                    : language === "fr"
                    ? "Bienvenue dans votre tableau de bord. Gérez votre profil, présentez vos réalisations et trouvez des projets correspondants."
                    : language === "sq"
                    ? "Mirësevini në panelin tuaj. Menaxhoni profilin, paraqisni punët tuaja dhe gjeni projekte të përshtatshme."
                    : "Welcome to your Service Provider dashboard. Manage your profile, showcase your work and find matching projects in your region."}
                </p>
              </div>

              {/* Profile completion banner — shown when profile < 100% */}
              {profileLoaded && (() => {
                const fields = [
                  { key: "bio",          label: { de: "Beschreibung",  en: "Description", sq: "Përshkrim",  fr: "Description" } },
                  { key: "phone",        label: { de: "Telefon",       en: "Phone",        sq: "Telefon",    fr: "Téléphone"   } },
                  { key: "city",         label: { de: "Stadt",         en: "City",         sq: "Qyteti",     fr: "Ville"       } },
                  { key: "profilePhoto", label: { de: "Profilfoto",    en: "Profile photo",sq: "Foto",       fr: "Photo"       } },
                  { key: "website",      label: { de: "Website",       en: "Website",      sq: "Website",    fr: "Site web"    } },
                  { key: "hourlyRate",   label: { de: "Stundenansatz", en: "Hourly rate",  sq: "Tarifa",     fr: "Tarif"       } },
                ] as const;
                const lang4 = (["de","en","sq","fr"].includes(language) ? language : "de") as "de"|"en"|"sq"|"fr";
                const done = fields.filter(f => Boolean(profileForm[f.key])).length;
                const pct = Math.round((done / fields.length) * 100);
                const missing = fields.filter(f => !profileForm[f.key]).map(f => f.label[lang4]);
                if (pct >= 100) return null;
                return (
                  <div
                    className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/70 cursor-pointer hover:bg-amber-50 transition-colors"
                    onClick={() => setActiveSection("profil")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-amber-900">
                        {language === "de" ? `Profil ${pct}% vollständig`
                          : language === "fr" ? `Profil complété à ${pct}%`
                          : language === "sq" ? `Profili ${pct}% i plotë`
                          : `Profile ${pct}% complete`}
                      </span>
                      <span className="text-xs font-medium text-amber-700 underline underline-offset-2">
                        {language === "de" ? "Profil vervollständigen →"
                          : language === "fr" ? "Compléter →"
                          : language === "sq" ? "Plotëso profilin →"
                          : "Complete profile →"}
                      </span>
                    </div>
                    <div className="h-2 bg-amber-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {missing.length > 0 && (
                      <p className="text-xs text-amber-700">
                        {language === "de" ? "Noch ausstehend: "
                          : language === "fr" ? "Manquant : "
                          : language === "sq" ? "Ende mungojnë: "
                          : "Still missing: "}
                        {missing.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 9 stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("plan")}>
                  <div className="text-xs text-muted-foreground mb-1">{l.currentPlan}</div>
                  <div className="text-lg font-bold">{appStats?.planName ?? "Free"}</div>
                  <div className="text-xs text-primary mt-1 font-medium">{appStats?.badge ?? "Basic Dienstleister"}</div>
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("profil")}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "de" ? "Profilstatus" : language === "fr" ? "Statut du profil" : language === "sq" ? "Statusi profilit" : "Profile status"}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {profileLoaded
                      ? `${Math.min(100, Math.round(([profileForm.bio, profileForm.phone, profileForm.city, profileForm.profilePhoto, profileForm.website, profileForm.hourlyRate].filter(Boolean).length / 6) * 100))}%`
                      : "—"}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    {profileLoaded && (
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, Math.round(([profileForm.bio, profileForm.phone, profileForm.city, profileForm.profilePhoto, profileForm.website, profileForm.hourlyRate].filter(Boolean).length / 6) * 100))}%` }}
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === "de" ? "vollständig" : language === "fr" ? "complet" : language === "sq" ? "i plotë" : "complete"}
                  </div>
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("bewerbungen")}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "de" ? "Verbleibende Bewerbungen" : language === "fr" ? "Candidatures restantes" : language === "sq" ? "Aplikime të mbetura" : "Applications remaining"}
                  </div>
                  <div className="text-lg font-bold">
                    {appStats ? Math.max(0, appStats.appLimit - appStats.usedThisMonth) : "—"}
                    <span className="text-sm font-normal text-muted-foreground"> / {appStats?.appLimit ?? 2}</span>
                  </div>
                  {atLimit && <div className="text-xs text-destructive mt-1">{l.limitReached}</div>}
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("nachrichten")}>
                  <div className="text-xs text-muted-foreground mb-1">{l.navMessages}</div>
                  <div className="text-lg font-bold">—</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === "de" ? "Neue Nachrichten" : language === "fr" ? "Nouveaux messages" : language === "sq" ? "Mesazhe të reja" : "New messages"}
                  </div>
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("bewerbungen")}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "de" ? "Offene Bewerbungen" : language === "fr" ? "Candidatures ouvertes" : language === "sq" ? "Aplikime të hapura" : "Open applications"}
                  </div>
                  <div className="text-lg font-bold">{offers.filter(o => o.status === "pending" || o.status === "accepted").length}</div>
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("angebote")}>
                  <div className="text-xs text-muted-foreground mb-1">{l.navAngebote}</div>
                  <div className="text-lg font-bold">{offers.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === "de" ? "gesendete Angebote" : language === "fr" ? "offres envoyées" : language === "sq" ? "ofertat e dërguara" : "offers sent"}
                  </div>
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("galerie")}>
                  <div className="text-xs text-muted-foreground mb-1">{l.navGalerie}</div>
                  <div className="text-lg font-bold">{portfolioItems.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === "de" ? "Portfolio-Bilder" : language === "fr" ? "photos de portfolio" : language === "sq" ? "foto portofoli" : "portfolio photos"}
                  </div>
                </Card>
                <Card className={`p-4 hover:border-primary/30 cursor-pointer transition-colors ${appStats?.contactVisible ? "bg-green-50/60 border-green-200" : "bg-muted/30"}`} onClick={() => setActiveSection("sichtbarkeit")}>
                  <div className="text-xs text-muted-foreground mb-1">{l.visibility}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {appStats?.contactVisible ? (
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <ShieldOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold">
                      {appStats?.contactVisible ? (language === "de" ? "Sichtbar" : "Visible") : "Standard"}
                    </span>
                  </div>
                </Card>
                <Card className="p-4 hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setActiveSection("bewertungen")}>
                  <div className="text-xs text-muted-foreground mb-1">{l.navReviews}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground">
                      {language === "de" ? "Noch keine Bewertungen" : language === "fr" ? "Pas encore d'avis" : language === "sq" ? "Ende asnjë vlerësim" : "No reviews yet"}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Application usage bar */}
              {appStats && (
                <Card className="p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{l.appsThisMonth}</span>
                    <span className="text-sm text-muted-foreground">
                      {appStats.usedThisMonth} / {appStats.appLimit} {l.planAppsPerMonth}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (appStats.usedThisMonth / appStats.appLimit) * 100)}%` }}
                    />
                  </div>
                </Card>
              )}

              {/* Quick actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveSection("projekte")} data-testid="tab-browse">
                  <Search className="w-4 h-4 mr-2" />
                  {l.navProjects}
                </Button>
                <Button variant="outline" onClick={() => setActiveSection("profil")}>
                  <User className="w-4 h-4 mr-2" />
                  {l.navProfile}
                </Button>
                <Button variant="outline" onClick={() => setActiveSection("galerie")}>
                  <Images className="w-4 h-4 mr-2" />
                  {l.navGalerie}
                </Button>
                {!appStats?.contactVisible && (
                  <Link href="/pricing">
                    <Button variant="outline">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {l.upgradeBtn}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ── MEIN ANBIETERPROFIL ── */}
          {activeSection === "profil" && (() => {
            if (!profileLoaded) { void loadProfile(); }
            return (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6">{l.navProfile}</h2>

              {/* Profile photo */}
              <Card className="p-6 mb-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  {l.profilePhoto}
                </h3>
                <div className="flex items-start gap-5">
                  <div className="w-24 h-24 rounded-2xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {profileForm.profilePhoto ? (
                      <img src={profileForm.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <PhotoUploader
                      label=""
                      hint={l.portfolioHint}
                      value={profilePhotoPath ? [profilePhotoPath] : []}
                      onChange={(paths) => {
                        if (paths[0]) {
                          setProfilePhotoPath(paths[0]);
                          setProfileForm(prev => ({ ...prev, profilePhoto: `/api/storage${paths[0]}` }));
                        }
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Basic info form */}
              <Card className="p-6 mb-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {l.navProfile}
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">{l.profileCity}</Label>
                      <Input
                        value={profileForm.city}
                        onChange={e => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Zürich"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">{l.profilePhone}</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+41 79 000 00 00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">{l.profileWebsite}</Label>
                      <Input
                        value={profileForm.website}
                        onChange={e => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://meine-firma.de"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">{l.profileHourlyRate}</Label>
                      <Input
                        type="number"
                        value={profileForm.hourlyRate}
                        onChange={e => setProfileForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                        placeholder="75"
                        min={0}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">{l.profileBio}</Label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      placeholder={t.provider.offerMessagePlaceholder}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{profileForm.bio.length}/1000</p>
                  </div>
                </div>
                {profileMsg && (
                  <div className={`mt-3 p-2.5 rounded-lg text-sm ${profileMsg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-destructive/10 text-destructive"}`}>
                    {profileMsg.text}
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveProfile} disabled={profileSaving}>
                    {profileSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {l.profileSave}
                  </Button>
                </div>
              </Card>

              {/* Portfolio gallery */}
              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Images className="w-4 h-4 text-primary" />
                  {l.portfolioTitle}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{l.portfolioHint}</p>
                {portfolioItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {portfolioItems.map(item => (
                      <div key={item.id} className="relative group aspect-video rounded-xl overflow-hidden border border-border">
                        <img src={item.imageUrl} alt="Portfolio" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePortfolioPhoto(item.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {portfolioItems.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-xl mb-4">
                    {l.portfolioEmpty}
                  </div>
                )}
                <PhotoUploader
                  label={l.portfolioAdd}
                  hint=""
                  multiple
                  value={portfolioObjectPaths}
                  onChange={handlePortfolioChange}
                />
              </Card>
            </div>
            );
          })()}

          {/* ── PROFILBILD & LOGO ── */}
          {activeSection === "profilbild" && (
            <ProfilbildSection language={language} />
          )}

          {/* ── GALERIE & PORTFOLIO ── */}
          {activeSection === "galerie" && (
            <GalerieSection language={language} />
          )}

          {/* ── LEISTUNGEN & KATEGORIEN ── */}
          {activeSection === "leistungen" && (
            <LeistungenSection language={language} />
          )}

          {/* ── PREISE & RICHTWERTE ── */}
          {activeSection === "preise" && (
            <PreiseSection language={language} />
          )}

          {/* ── PROJEKTE FINDEN ── */}
          {activeSection === "projekte" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-4" data-testid="tab-browse">
                {l.navProjects}
              </h2>

              {atLimit && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between gap-3">
                  <span>{l.limitReached} — {appStats?.usedThisMonth}/{appStats?.appLimit}</span>
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="border-amber-400 text-amber-800 hover:bg-amber-100">
                      {l.upgradeNow}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <select
                  value={browseTypeFilter}
                  onChange={e => setBrowseTypeFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{t.provider.filterAllTypes}</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>{getCategoryLabel(cat, language as Lang)}</option>
                  ))}
                </select>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={browseCityFilter}
                    onChange={e => setBrowseCityFilter(e.target.value)}
                    placeholder={t.provider.filterCity}
                    className="h-9 rounded-lg border border-border bg-white pl-7 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36"
                  />
                  {browseCityFilter && (
                    <button onClick={() => setBrowseCityFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <select
                  value={browseSizeFilter}
                  onChange={e => setBrowseSizeFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{t.provider.filterAllSizes}</option>
                  <option value="small">{t.listings.sizeSm}</option>
                  <option value="medium">{t.listings.sizeMd}</option>
                  <option value="large">{t.listings.sizeLg}</option>
                  <option value="premium">{t.listings.sizePremium}</option>
                </select>
                <select
                  value={browseBudgetFilter}
                  onChange={e => setBrowseBudgetFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{t.provider.filterAllBudgets}</option>
                  <option value="under-10k">{"< 10k"}</option>
                  <option value="10k-50k">{"10k – 50k"}</option>
                  <option value="50k-100k">{"50k – 100k"}</option>
                  <option value="100k-500k">{"100k – 500k"}</option>
                  <option value="over-500k">{"> 500k"}</option>
                </select>
                {(browseTypeFilter || browseCityFilter || browseSizeFilter || browseBudgetFilter) && (
                  <button
                    onClick={() => { setBrowseTypeFilter(""); setBrowseCityFilter(""); setBrowseSizeFilter(""); setBrowseBudgetFilter(""); }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium h-9"
                  >
                    <X className="h-3 w-3" />
                    {t.companies.clearFilters ?? "Clear filters"}
                  </button>
                )}
                <div className="ml-auto flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setBrowseView("grid")}
                    className={`px-2.5 py-1.5 transition-colors ${browseView === "grid" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-primary"}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setBrowseView("list")}
                    className={`px-2.5 py-1.5 transition-colors ${browseView === "list" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-primary"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Projects */}
              {(() => {
                const filtered = projects.filter(p => {
                  const matchType = !browseTypeFilter || p.projectType === browseTypeFilter;
                  const matchCity = !browseCityFilter || p.city.toLowerCase().includes(browseCityFilter.toLowerCase());
                  const matchSize = !browseSizeFilter || p.size === browseSizeFilter;
                  const matchBudget = !browseBudgetFilter || p.budget === browseBudgetFilter;
                  return matchType && matchCity && matchSize && matchBudget;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-xl">
                      {t.provider.noProjects}
                    </div>
                  );
                }

                if (browseView === "list") {
                  return (
                    <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
                      {filtered.map(p => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onClick={() => setDetailProject(p)}
                          footer={
                            <div className="flex gap-2 pt-3 border-t border-border/40">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => { e.stopPropagation(); setDetailProject(p); }}
                                data-testid={`button-view-project-${p.id}`}
                              >
                                {t.provider.viewDetails}
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => { e.stopPropagation(); openOfferModal(p); }}
                                disabled={atLimit}
                                data-testid={`button-send-offer-${p.id}`}
                              >
                                {t.provider.sendOffer}
                              </Button>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(p => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        onClick={() => setDetailProject(p)}
                        footer={
                          <div className="flex gap-2 pt-3 border-t border-border/40">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => { e.stopPropagation(); setDetailProject(p); }}
                              data-testid={`button-view-project-${p.id}`}
                            >
                              {t.provider.viewDetails}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => { e.stopPropagation(); openOfferModal(p); }}
                              disabled={atLimit}
                              data-testid={`button-send-offer-${p.id}`}
                            >
                              {t.provider.sendOffer}
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── MEINE BEWERBUNGEN ── */}
          {activeSection === "bewerbungen" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-4" data-testid="tab-offers">
                {l.navApplications}
              </h2>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.provider.colProject}</TableHead>
                      <TableHead>{t.provider.colType}</TableHead>
                      <TableHead>{t.provider.colStatus}</TableHead>
                      <TableHead>{t.provider.colDate}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((o) => (
                      <>
                        <TableRow key={o.id}>
                          <TableCell>
                            <div className="font-medium">{o.projectFullName}</div>
                            <div className="text-xs text-muted-foreground">{o.projectCity}</div>
                          </TableCell>
                          <TableCell>{typeBadge(o.type)}</TableCell>
                          <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(o.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {o.status === "accepted" && (
                              <Button size="sm" variant="outline" onClick={() => toggleThread(o.id)} data-testid={`button-messages-${o.id}`}>
                                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                {t.messaging.open}
                                {openThreads.has(o.id) ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {o.status === "accepted" && openThreads.has(o.id) && (
                          <TableRow key={`thread-${o.id}`}>
                            <TableCell colSpan={5} className="p-3">
                              <MessageThread offerId={o.id} otherPartyName={o.projectFullName ?? undefined} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                    {offers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground h-24">
                          {t.provider.noOffers}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* ── ANGEBOTE ── */}
          {activeSection === "angebote" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-4">{l.navAngebote}</h2>
              {offers.length === 0 ? (
                <Card className="p-10 text-center">
                  <Send className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t.provider.noOffers}</p>
                  <Button className="mt-4" onClick={() => setActiveSection("projekte")}>
                    <Search className="w-4 h-4 mr-2" />
                    {l.navProjects}
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map(o => (
                    <Card key={o.id} className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-sm line-clamp-1">{o.projectFullName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{o.projectCity}
                          </p>
                        </div>
                        {typeBadge(o.type)}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(o.createdAt), "dd.MM.yyyy")}
                        </span>
                      </div>
                      {o.status === "accepted" && (
                        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => { setActiveSection("nachrichten"); }}>
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          {t.messaging.open}
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MEIN PLAN ── */}
          {activeSection === "plan" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6" data-testid="tab-billing">
                {l.navPlan}
              </h2>
              {appStats ? (
                <div className="space-y-5">
                  {/* Current plan card */}
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{l.currentPlan}</div>
                        <div className="text-2xl font-bold mb-1">{appStats.planName}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{appStats.usedThisMonth}/{appStats.appLimit} {l.planAppsPerMonth}</span>
                          {appStats.priceCents > 0 && (
                            <span className="font-medium text-foreground">{formatCHF(appStats.priceCents)}/Mo.</span>
                          )}
                        </div>
                        {appStats.periodEnd && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {l.periodEnd}: {format(new Date(appStats.periodEnd), "dd.MM.yyyy")}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href="/pricing">
                          <Button data-testid="button-upgrade">
                            {l.upgradeBtn} <ArrowUpRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* App usage bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{l.appsThisMonth}</span>
                        <span>{appStats.usedThisMonth}/{appStats.appLimit}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, (appStats.usedThisMonth / appStats.appLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Plan features */}
                  {appStats.features.length > 0 && (
                    <Card className="p-5">
                      <h3 className="font-semibold mb-3">{l.includedFeatures}</h3>
                      <ul className="space-y-2">
                        {appStats.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Badge & contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-5">
                      <div className="text-xs text-muted-foreground mb-1">{l.planBadge}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Award className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{appStats.badge}</span>
                      </div>
                    </Card>
                    <Card className={`p-5 ${appStats.contactVisible ? "bg-green-50/60 border-green-200" : "bg-muted/30"}`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {appStats.contactVisible ? l.contactVisible : l.contactHidden}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {appStats.contactVisible ? (
                          <>
                            <Phone className="w-4 h-4 text-green-600" />
                            <Mail className="w-4 h-4 text-green-600" />
                            <Globe className="w-4 h-4 text-green-600" />
                          </>
                        ) : (
                          <>
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </>
                        )}
                      </div>
                      {!appStats.contactVisible && (
                        <Link href="/pricing">
                          <Button size="sm" variant="link" className="mt-1 px-0 text-xs h-auto">
                            {l.upgradeNow} →
                          </Button>
                        </Link>
                      )}
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              )}
            </div>
          )}

          {/* ── SICHTBARKEIT ── */}
          {activeSection === "sichtbarkeit" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6">{l.visibility}</h2>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-40"></th>
                        {["free", "starter", "professional", "premium", "founding"].map(slug => (
                          <th key={slug} className={`px-4 py-3 text-center font-semibold ${slug === planSlug ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}>
                            <div>{slug === "free" ? "Free" : slug === "starter" ? "Starter" : slug === "professional" ? "Professional" : slug === "premium" ? "Premium" : "Founding"}</div>
                            {slug === planSlug && (
                              <div className="text-xs font-normal mt-0.5 bg-primary text-white rounded-full px-1.5 py-0.5 inline-block">
                                {l.currentPlan}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {VISIBILITY_TABLE.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-foreground">{row.row}</td>
                          {(["free", "starter", "professional", "premium", "founding"] as const).map(slug => {
                            const val = row[slug];
                            const isCurrent = slug === planSlug;
                            const isHidden = val === l.visValueFree;
                            return (
                              <td key={slug} className={`px-4 py-3 text-center ${isCurrent ? "bg-primary/5" : ""}`}>
                                {isHidden ? (
                                  <span className="text-muted-foreground text-xs">{val}</span>
                                ) : (
                                  <span className={`text-xs font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                                    {val}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {planSlug === "free" && (
                <Card className="mt-4 p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-amber-800">
                      <span className="font-semibold">{l.contactHidden}.</span>
                      {" "}
                      {language === "de"
                        ? "Upgraden Sie auf Starter oder höher, um Ihre Kontaktdaten sichtbar zu machen."
                        : language === "fr"
                        ? "Passez à Starter ou supérieur pour rendre vos coordonnées visibles."
                        : language === "sq"
                        ? "Ndrysho planin te Starter ose më lart për të shfaqur kontaktet."
                        : "Upgrade to Starter or higher to make your contact details visible."}
                    </div>
                    <Link href="/pricing">
                      <Button size="sm" className="flex-shrink-0">
                        {l.upgradeNow}
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── BEWERTUNGEN ── */}
          {activeSection === "bewertungen" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6">{l.navReviews}</h2>
              <Card className="p-8 text-center text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p>{l.reviewsComingSoon}</p>
              </Card>
            </div>
          )}

          {/* ── RECHNUNGEN ── */}
          {activeSection === "rechnungen" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6">{l.navInvoices}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="font-bold mb-3">{l.paymentHistory}</h3>
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <div>
                          <div className="font-medium capitalize">{p.kind} · {p.refSlug}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "MMM d, yyyy")}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCHF(p.amountCents)}</div>
                          <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4">{l.noPayments}</p>
                    )}
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-bold mb-3">{l.invoicesTitle}</h3>
                  <div className="space-y-2">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <div>
                          <div className="font-medium">{inv.number}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(inv.issuedAt), "MMM d, yyyy")}</div>
                        </div>
                        <Button size="sm" variant="ghost" disabled>{l.downloadPdf}</Button>
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4">{l.noInvoices}</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Transaction history */}
              <Card className="mt-6">
                <div className="p-4 border-b">
                  <h3 className="font-bold">{t.provider.history}</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.provider.colDate}</TableHead>
                      <TableHead>{t.provider.colType}</TableHead>
                      <TableHead>{t.provider.colAmount}</TableHead>
                      <TableHead>{t.provider.colNote}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</TableCell>
                        <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                        <TableCell className={tx.amount < 0 ? "text-red-600" : "text-green-700"}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{tx.note}</TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground h-24">
                          {t.provider.noTransactions}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* ── NACHRICHTEN ── */}
          {activeSection === "nachrichten" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6">{l.navMessages}</h2>
              <MessagingSystem myUserId={user.id} />
            </div>
          )}

          {/* ── EINSTELLUNGEN ── */}
          {activeSection === "einstellungen" && (
            <div>
              <h2 className="text-xl font-serif font-bold mb-6">{l.navSettings}</h2>
              <div className="space-y-5 max-w-2xl">
                {/* Account */}
                <Card className="p-6">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {l.settingsAccount}
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="settings-name" className="text-xs mb-1 block">{l.settingsName}</Label>
                        <Input id="settings-name" value={user.fullName} readOnly className="bg-muted/40" />
                      </div>
                      <div>
                        <Label htmlFor="settings-email" className="text-xs mb-1 block">{l.settingsEmail}</Label>
                        <Input id="settings-email" value={user.email} readOnly className="bg-muted/40" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{l.settingsRole}</Label>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 hover:bg-primary/10">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {l.settingsRoleProvider}
                        </Badge>
                        {user.accountSubtype && (
                          <Badge variant="outline">
                            {user.accountSubtype === "company" ? l.settingsSubCompany : l.settingsSubIndividual}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Language */}
                <Card className="p-6">
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    {l.settingsLanguage}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{l.settingsLanguageHint}</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { code: "de", label: "Deutsch" },
                      { code: "en", label: "English" },
                      { code: "fr", label: "Français" },
                      { code: "sq", label: "Shqip" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => setLanguage(opt.code)}
                        aria-pressed={language === opt.code}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          language === opt.code
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`settings-language-${opt.code}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Session / Logout */}
                <Card className="p-6">
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    {l.settingsSession}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{l.settingsLogoutHint}</p>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void logout()}
                    data-testid="settings-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {l.settingsLogout}
                  </Button>
                </Card>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Project Detail Modal */}
      <Dialog open={!!detailProject} onOpenChange={(o) => !o && setDetailProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.provider.detailTitle}</DialogTitle>
            <DialogDescription>{detailProject?.fullName} · {detailProject?.city}</DialogDescription>
          </DialogHeader>
          {detailProject?.photos && detailProject.photos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.provider.detailPhotos}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {detailProject.photos.map((path, i) => (
                  <button
                    key={i}
                    onClick={() => { setGalleryProject(detailProject); setGalleryIdx(i); }}
                    className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors group"
                  >
                    <img src={`/api/storage${path}`} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{t.provider.colType}</p>
                <p className="font-medium">{detailProject?.projectType ? getCategoryLabel(CATEGORIES.find(c => c.key === detailProject.projectType) ?? CATEGORIES[CATEGORIES.length - 1], language as Lang) : ""}</p>
                {(detailProject as {subcategory?: string | null} | null)?.subcategory && (
                  <p className="text-xs text-primary/70 mt-0.5">{resolveTagLabel((detailProject as {subcategory?: string | null}).subcategory!, language as Lang)}</p>
                )}
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{t.provider.colSize}</p>
                <p className="font-medium capitalize">{detailProject?.size}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{t.provider.detailBudget}</p>
                <p className="font-medium">{detailProject?.budget ?? t.provider.detailNotSpecified}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{t.provider.detailTimeline}</p>
                <p className="font-medium">{detailProject?.timeline ?? t.provider.detailNotSpecified}</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{t.provider.detailDescription}</p>
              <p className="leading-relaxed whitespace-pre-line">{detailProject?.description}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.provider.detailPosted}: {detailProject?.createdAt ? format(new Date(detailProject.createdAt), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailProject(null)}>Cancel</Button>
            <Button onClick={() => { openOfferModal(detailProject!); setDetailProject(null); }} disabled={atLimit}>
              {t.provider.sendOffer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo lightbox */}
      <Dialog open={!!galleryProject} onOpenChange={(o) => !o && setGalleryProject(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-0">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {galleryProject?.photos && galleryProject.photos.length > 0 && (
              <img src={`/api/storage${galleryProject.photos[galleryIdx]}`} alt={`Photo ${galleryIdx + 1}`} className="max-w-full max-h-[80vh] object-contain" />
            )}
            <button onClick={() => setGalleryProject(null)} className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
              <X className="w-5 h-5" />
            </button>
            {galleryProject && galleryProject.photos.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIdx(i => (i - 1 + galleryProject.photos.length) % galleryProject.photos.length)}
                  className="absolute left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setGalleryIdx(i => (i + 1) % galleryProject.photos.length)}
                  className="absolute right-12 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                  {galleryIdx + 1} / {galleryProject.photos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer modal */}
      <Dialog open={!!offerProject} onOpenChange={(o) => !o && setOfferProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.provider.offerModalTitle}</DialogTitle>
            <DialogDescription>{offerProject?.fullName} · {offerProject?.city}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">{t.provider.offerTypeLabel}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["normal", "highlighted", "top"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOfferType(type)}
                    className={`p-3 rounded-lg border-2 text-left transition ${offerType === type ? "border-primary bg-primary/5" : "border-border"}`}
                    data-testid={`offer-type-${type}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {type === "top" && <Flame className="w-4 h-4 text-amber-600" />}
                      {type === "highlighted" && <Star className="w-4 h-4 text-blue-600" />}
                      {type === "normal" && <Sparkles className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-semibold text-xs capitalize">
                        {t.provider[`offerType${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof t.provider]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="offer-message">{t.provider.offerMessage}</Label>
              <Textarea
                id="offer-message"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={4}
                placeholder={t.provider.offerMessagePlaceholder}
                data-testid="input-offer-message"
              />
            </div>

            <div>
              <Label htmlFor="offer-price">{t.provider.offerPrice}</Label>
              <Input
                id="offer-price"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="CHF"
                data-testid="input-offer-price"
              />
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg bg-destructive/10 text-destructive">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferProject(null)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            {canSend ? (
              <Button onClick={submitOffer} disabled={submitting} data-testid="button-confirm-send-offer">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t.provider.sendOfferConfirm}
              </Button>
            ) : (
              <Link href="/pricing">
                <Button data-testid="button-go-pricing">{t.provider.goToPricing}</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

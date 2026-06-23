import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth, isProjectPoster, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import NotificationBell from "@/components/NotificationBell";
import {
  billingApi,
  type ProviderProject,
  type OfferWithProvider,
} from "@/lib/billing-api";
import { MessagingSystem } from "@/components/MessagingSystem";
import { ProjectEditDialog } from "@/components/project-edit-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Star, X, MessageSquare, ChevronDown, ChevronUp,
  LayoutDashboard, PlusCircle, FolderOpen, Users, Send,
  Search, Heart, File, Award, Settings, Briefcase,
  MapPin, Calendar, ArrowRight, Flame, ShieldCheck,
  Archive, CheckCircle2, Eye, Trash2, Building2,
  BarChart3, Scale, Pencil,
  Hammer, Paintbrush, Zap, Wrench, ChefHat, SquareStack, Sofa, Leaf, HelpCircle, Check,
} from "lucide-react";
import { format } from "date-fns";
import { useCategories } from "@/hooks/useCategories";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { ProjectCard } from "@/components/project/ProjectCard";

// ── Category icon map ─────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  renovation:      Hammer,
  painting:        Paintbrush,
  electrical:      Zap,
  plumbing:        Wrench,
  kitchen:         ChefHat,
  flooring:        SquareStack,
  interior_design: Sofa,
  cleaning:        Leaf,
  other:           HelpCircle,
};

const CATEGORY_COLORS: Record<string, { icon: string; ring: string }> = {
  renovation:      { icon: "bg-amber-100 text-amber-600",   ring: "ring-amber-400/50 bg-amber-50" },
  painting:        { icon: "bg-violet-100 text-violet-600", ring: "ring-violet-400/50 bg-violet-50" },
  electrical:      { icon: "bg-yellow-100 text-yellow-700", ring: "ring-yellow-400/50 bg-yellow-50" },
  plumbing:        { icon: "bg-blue-100 text-blue-600",     ring: "ring-blue-400/50 bg-blue-50" },
  kitchen:         { icon: "bg-red-100 text-red-600",       ring: "ring-red-400/50 bg-red-50" },
  flooring:        { icon: "bg-teal-100 text-teal-600",     ring: "ring-teal-400/50 bg-teal-50" },
  interior_design: { icon: "bg-pink-100 text-pink-600",     ring: "ring-pink-400/50 bg-pink-50" },
  cleaning:        { icon: "bg-green-100 text-green-600",   ring: "ring-green-400/50 bg-green-50" },
  construction:    { icon: "bg-slate-100 text-slate-600",   ring: "ring-slate-400/50 bg-slate-50" },
  heating:         { icon: "bg-orange-100 text-orange-600", ring: "ring-orange-400/50 bg-orange-50" },
  facade:          { icon: "bg-stone-100 text-stone-600",   ring: "ring-stone-400/50 bg-stone-50" },
  hvac:            { icon: "bg-sky-100 text-sky-600",       ring: "ring-sky-400/50 bg-sky-50" },
  landscaping:     { icon: "bg-lime-100 text-lime-700",     ring: "ring-lime-400/50 bg-lime-50" },
};
const DEFAULT_CATEGORY_COLORS = { icon: "bg-muted text-muted-foreground", ring: "ring-primary/30 bg-primary/5" };

// ── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "uebersicht"
  | "erstellen"
  | "projekte"
  | "bewerbungen"
  | "nachrichten"
  | "angebote"
  | "finden"
  | "favoriten"
  | "dateien"
  | "bewertungen"
  | "einstellungen";

interface Favorite {
  id: number;
  companyId: number;
  name: string | null;
  city: string | null;
  serviceTypes: string[] | null;
  logoUrl: string | null;
  shortDescription: string | null;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(n)} className="focus:outline-none">
          <Star className={`w-7 h-7 transition-colors ${n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ offerId, projectId, providerName, onClose, onDone }: { offerId: number; projectId: number; providerName: string; onClose: () => void; onDone: (id: number) => void }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const submit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ offerId, rating, comment: comment.trim() || null }) });
      if (res.status === 409) { setError(t.reviews.alreadyReviewed); setSubmitting(false); return; }
      if (!res.ok) { const b = await res.json() as { error?: string }; setError(b.error ?? "Error"); setSubmitting(false); return; }
      setDone(true);
      setTimeout(() => { onDone(offerId); onClose(); }, 1200);
    } catch { setError("Network error"); setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div><h3 className="text-lg font-bold">{t.reviews.leaveReview}</h3><p className="text-sm text-muted-foreground">{providerName}</p></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {done ? <div className="py-6 text-center text-primary font-semibold">{t.reviews.success}</div> : (
          <>
            <div className="mb-4"><p className="text-sm font-medium mb-2">{t.reviews.rating}</p><StarPicker value={rating} onChange={setRating} /></div>
            <div className="mb-4"><label className="text-sm font-medium block mb-2">{t.reviews.comment}</label><textarea className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] bg-background" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} /></div>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>{t.common?.cancel ?? "Cancel"}</Button>
              <Button size="sm" onClick={submit} disabled={rating < 1 || submitting} data-testid="button-submit-review">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.reviews.submit}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const { categories: serviceCategories } = useCategories("service");
  const [, setLocation] = useLocation();
  const search = useSearch();

  const l = t.customer;

  // ── State ─────────────────────────────────────────────────────────────────

  const VALID_POSTER_SECTIONS: Section[] = ["uebersicht","erstellen","projekte","bewerbungen","nachrichten","angebote","finden","favoriten","dateien","bewertungen","einstellungen"];
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const tab = new URLSearchParams(search).get("tab") as Section | null;
    return (tab && VALID_POSTER_SECTIONS.includes(tab)) ? tab : "uebersicht";
  });

  useEffect(() => {
    const tab = new URLSearchParams(search).get("tab") as Section | null;
    if (tab && VALID_POSTER_SECTIONS.includes(tab)) {
      setActiveSection(tab);
    } else if (!tab) {
      setActiveSection("uebersicht");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [offersByProject, setOffersByProject] = useState<Record<number, OfferWithProvider[]>>({});
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reviewedOfferIds, setReviewedOfferIds] = useState<Set<number>>(new Set());
  const [openThreads, setOpenThreads] = useState<Set<number>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ offerId: number; projectId: number; providerName: string } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<ProviderProject | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const pjs = await billingApi.myProjects();
      setProjects(pjs);
      const map: Record<number, OfferWithProvider[]> = {};
      await Promise.all(pjs.map(async (p) => {
        try { map[p.id] = await billingApi.projectOffers(p.id); }
        catch { map[p.id] = []; }
      }));
      setOffersByProject(map);
    } catch { /* ignore */ }

    try {
      const res = await fetch("/api/reviews/my-reviewed-offers", { credentials: "include" });
      if (res.ok) { const d = await res.json() as { reviewedOfferIds: number[] }; setReviewedOfferIds(new Set(d.reviewedOfferIds)); }
    } catch { /* ignore */ }

    try {
      const res = await fetch("/api/customer/favorites", { credentials: "include" });
      if (res.ok) setFavorites(await res.json() as Favorite[]);
    } catch { /* ignore */ }

    setDataLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (user && isProjectPoster(user)) void loadData();
  }, [user, loadData]);

  if (loading || !user) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isProjectPoster(user)) {
    setLocation(isServiceProvider(user) ? "/provider" : "/admin");
    return null;
  }

  // ── Computed values ───────────────────────────────────────────────────────

  const activeProjects = projects.filter(p => !["archived", "completed"].includes(p.status));
  const completedProjects = projects.filter(p => p.status === "completed");
  const allOffers = Object.values(offersByProject).flat();
  const pendingOffers = allOffers.filter(o => o.status === "pending");
  const acceptedOffers = allOffers.filter(o => o.status === "accepted");

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: l.statusPending, reviewing: l.statusPending, open: l.statusOpen,
      in_discussion: l.statusInDiscussion, offer_received: l.statusOfferReceived,
      matched: l.statusProviderSelected, completed: l.statusCompleted, archived: l.statusArchived,
    };
    return map[s] ?? s;
  };

  const statusColor = (s: string) => {
    if (s === "archived") return "bg-muted text-muted-foreground";
    if (s === "completed" || s === "matched") return "bg-green-100 text-green-800";
    if (s === "offer_received" || s === "in_discussion") return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };

  const typeBadge = (type: string) => {
    if (type === "top") return <Badge className="bg-amber-100 text-amber-800 gap-1"><Flame className="w-3 h-3" /> Top</Badge>;
    if (type === "highlighted") return <Badge className="bg-blue-100 text-blue-800 gap-1"><Star className="w-3 h-3" /> Featured</Badge>;
    return <Badge variant="outline">Standard</Badge>;
  };

  const onAccept = async (offerId: number) => {
    try { await billingApi.acceptOffer(offerId); await loadData(); } catch { /* ignore */ }
  };

  const onArchive = async (projectId: number) => {
    setArchiving(projectId);
    try {
      await fetch(`/api/customer/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "archived" }) });
      await loadData();
    } catch { /* ignore */ }
    setArchiving(null);
  };

  const removeFavorite = async (companyId: number) => {
    try {
      await fetch(`/api/customer/favorites/${companyId}`, { method: "DELETE", credentials: "include" });
      setFavorites(prev => prev.filter(f => f.companyId !== companyId));
    } catch { /* ignore */ }
  };

  const toggleCompare = (offerId: number) => {
    setSelectedForCompare(prev =>
      prev.includes(offerId) ? prev.filter(id => id !== offerId) : prev.length < 4 ? [...prev, offerId] : prev
    );
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const navItems: Array<{ id: Section; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "uebersicht", label: l.navOverview, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "erstellen", label: l.navCreate, icon: <PlusCircle className="w-4 h-4" /> },
    { id: "projekte", label: l.navProjects, icon: <FolderOpen className="w-4 h-4" />, badge: activeProjects.length || undefined },
    { id: "bewerbungen", label: l.navApplications, icon: <Users className="w-4 h-4" />, badge: pendingOffers.length || undefined },
    { id: "nachrichten", label: l.navMessages, icon: <MessageSquare className="w-4 h-4" /> },
    { id: "angebote", label: l.navOffers, icon: <Send className="w-4 h-4" />, badge: allOffers.length || undefined },
    { id: "finden", label: l.navFind, icon: <Search className="w-4 h-4" /> },
    { id: "favoriten", label: l.navFavorites, icon: <Heart className="w-4 h-4" />, badge: favorites.length || undefined },
    { id: "dateien", label: l.navFiles, icon: <File className="w-4 h-4" /> },
    { id: "bewertungen", label: l.navReviews, icon: <Award className="w-4 h-4" /> },
    { id: "einstellungen", label: l.navSettings, icon: <Settings className="w-4 h-4" /> },
  ];

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-end mb-2">
          <NotificationBell />
        </div>
        {/* Mobile nav strip — OUTSIDE flex row so it stacks above content */}
        <div className="md:hidden w-full mb-4 -mx-1">
          <div className="flex gap-2 overflow-x-auto pb-2 px-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${activeSection === item.id ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-foreground/70"}`}>
                {item.icon}{item.label}
                {item.badge !== undefined && <span className="ml-1 text-[10px] font-bold">{item.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">

          {/* Sidebar — desktop only */}
          <aside className="w-56 shrink-0 hidden md:block">
            <Card className="p-2 sticky top-24">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Dashboard</p>
              </div>
              <nav className="space-y-0.5">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}
                  >
                    <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeSection === item.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>{item.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">

            {/* ── ÜBERSICHT ── */}
            {activeSection === "uebersicht" && (
              <div>
                {/* Welcome banner */}
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/8 via-sky-50/60 to-transparent border border-primary/10">
                  <h1 className="text-2xl font-serif font-bold mb-1" data-testid="customer-heading">
                    {t.dashboard.welcome}, {(user.fullName === "User" ? user.email?.split("@")[0] : user.fullName?.split(" ")[0]) ?? ""}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-4">{l.welcomeDesc}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setActiveSection("erstellen")} data-testid="button-new-project">
                      <PlusCircle className="w-4 h-4 mr-2" />{l.createProject}
                    </Button>
                    <Button variant="outline" onClick={() => setActiveSection("finden")}>
                      <Search className="w-4 h-4 mr-2" />{l.findProviders}
                    </Button>
                  </div>
                </div>

                {/* 6 stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <Card className="p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("projekte")}>
                    <div className="text-xs text-muted-foreground mb-1">{l.statActive}</div>
                    <div className="text-2xl font-bold">{activeProjects.length}</div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("bewerbungen")}>
                    <div className="text-xs text-muted-foreground mb-1">{l.statApplications}</div>
                    <div className="text-2xl font-bold text-primary">{pendingOffers.length}</div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("nachrichten")}>
                    <div className="text-xs text-muted-foreground mb-1">{l.statMessages}</div>
                    <div className="text-2xl font-bold">—</div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("angebote")}>
                    <div className="text-xs text-muted-foreground mb-1">{l.statOffers}</div>
                    <div className="text-2xl font-bold">{allOffers.length}</div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("projekte")}>
                    <div className="text-xs text-muted-foreground mb-1">{l.statCompleted}</div>
                    <div className="text-2xl font-bold">{completedProjects.length}</div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveSection("favoriten")}>
                    <div className="text-xs text-muted-foreground mb-1">{l.statFavorites}</div>
                    <div className="text-2xl font-bold">{favorites.length}</div>
                    <Heart className="w-4 h-4 text-muted-foreground/40 mt-1" />
                  </Card>
                </div>

                {/* Next step card */}
                <Card className="p-5 border-primary/20 bg-primary/3">
                  {projects.length === 0 ? (
                    <>
                      <p className="text-sm mb-3 text-foreground/80">{l.noProjectHint}</p>
                      <Button onClick={() => setActiveSection("erstellen")} data-testid="button-start-project">
                        <PlusCircle className="w-4 h-4 mr-2" />{l.noProjectCta}
                      </Button>
                    </>
                  ) : pendingOffers.length > 0 ? (
                    <>
                      <p className="text-sm mb-3 text-foreground/80">{l.hasAppsHint}</p>
                      <Button onClick={() => setActiveSection("bewerbungen")}><Users className="w-4 h-4 mr-2" />{l.hasAppsCta}</Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm mb-3 text-foreground/80">{l.hasMessagesHint}</p>
                      <Button onClick={() => setActiveSection("nachrichten")}><MessageSquare className="w-4 h-4 mr-2" />{l.hasMessagesCta}</Button>
                    </>
                  )}
                </Card>
              </div>
            )}

            {/* ── PROJEKT ERSTELLEN ── */}
            {activeSection === "erstellen" && (
              <div>
                <div className="mb-7">
                  <h2 className="text-xl font-serif font-bold">{l.navCreate}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{l.selectCategoryHint}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {serviceCategories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.key] ?? HelpCircle;
                    const colors = CATEGORY_COLORS[cat.key] ?? DEFAULT_CATEGORY_COLORS;
                    const isSelected = selectedCategories.has(cat.key);
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategories(prev => {
                            const next = new Set(prev);
                            if (next.has(cat.key)) next.delete(cat.key);
                            else next.add(cat.key);
                            return next;
                          });
                        }}
                        className={`relative group rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          isSelected
                            ? `border-primary ring-4 ${colors.ring}`
                            : "border-border bg-white hover:border-primary/40 hover:shadow-md"
                        }`}
                        data-testid={`button-category-${cat.key}`}
                      >
                        {/* Checkmark badge */}
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isSelected ? "bg-primary scale-100 opacity-100" : "bg-muted/60 scale-75 opacity-0 group-hover:opacity-40 group-hover:scale-90"
                        }`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 ${
                          isSelected ? `${colors.icon} scale-110` : colors.icon
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        {/* Label */}
                        <span className={`font-semibold text-sm block leading-snug transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {cat.label}
                        </span>

                        {/* Sub-count */}
                        {cat.subcategories.length > 0 && (
                          <span className="text-xs text-muted-foreground mt-1.5 block">
                            {cat.subcategories.length}{" "}
                            {language === "de" ? "Unterkategorien" : language === "fr" ? "sous-catégories" : language === "sq" ? "nënkategori" : "subcategories"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Continue bar */}
                <div className={`mt-6 overflow-hidden transition-all duration-300 ${selectedCategories.size > 0 ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-5 py-4 shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-2.5">
                      <div className="flex gap-1">
                        {[...selectedCategories].slice(0, 3).map(key => {
                          const Icon = CATEGORY_ICONS[key] ?? HelpCircle;
                          return <div key={key} className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><Icon className="w-4 h-4" /></div>;
                        })}
                      </div>
                      <span className="text-sm font-semibold">
                        {selectedCategories.size} {l.nSelected}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white text-primary hover:bg-white/90 font-semibold"
                      onClick={() => {
                        const [firstKey] = selectedCategories;
                        setLocation(`/submit-project?type=${firstKey}`);
                      }}
                    >
                      {l.continueBtn}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MEINE PROJEKTE ── */}
            {activeSection === "projekte" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold">{l.navProjects}</h2>
                  <Button onClick={() => setActiveSection("erstellen")} size="sm">
                    <PlusCircle className="w-4 h-4 mr-1.5" />{l.navCreate}
                  </Button>
                </div>

                {projects.length === 0 ? (
                  <Card className="p-10 text-center">
                    <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-4">{t.clientDashboard.noProjects}</p>
                    <Button onClick={() => setActiveSection("erstellen")}><PlusCircle className="w-4 h-4 mr-2" />{l.noProjectCta}</Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map(p => {
                      const offers = offersByProject[p.id] ?? [];
                      const isArchiving = archiving === p.id;
                      const applicationsLabel = language === "de" ? "Bewerbungen" : language === "fr" ? "candidatures" : language === "sq" ? "aplikime" : "applications";
                      return (
                        <ProjectCard
                          key={p.id}
                          project={{ ...p, offersCount: offers.length }}
                          showStatus
                          offersLabel={applicationsLabel}
                          onClick={() => setLocation(`/projects/${p.id}`)}
                          footer={
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveSection("bewerbungen"); }}>
                                <Users className="w-3.5 h-3.5 mr-1.5" />{l.viewApplications}
                              </Button>
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveSection("nachrichten"); }}>
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />{l.openMessages}
                              </Button>
                              {p.status !== "archived" && p.status !== "completed" && (
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditingProject(p); }}>
                                  <Pencil className="w-3.5 h-3.5 mr-1.5" />{l.editProject}
                                </Button>
                              )}
                              {p.status !== "archived" && p.status !== "completed" && (
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onArchive(p.id); }} disabled={isArchiving}>
                                  {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5 mr-1.5" />}
                                  {l.archiveProject}
                                </Button>
                              )}
                            </div>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── BEWERBUNGEN ── */}
            {activeSection === "bewerbungen" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold">{l.navApplications}</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant={compareMode ? "default" : "outline"} onClick={() => { setCompareMode(m => !m); setSelectedForCompare([]); }}>
                      <Scale className="w-3.5 h-3.5 mr-1.5" />{l.compare}
                    </Button>
                  </div>
                </div>

                {/* Compare table */}
                {compareMode && selectedForCompare.length >= 2 && (
                  <Card className="p-4 mb-4 overflow-x-auto">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary" />{l.compare}</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b">
                          <th className="text-left py-1.5 pr-4">{language === "de" ? "Anbieter" : "Provider"}</th>
                          <th className="text-left py-1.5 pr-4">Badge</th>
                          <th className="text-left py-1.5 pr-4">{language === "de" ? "Stadt" : "City"}</th>
                          <th className="text-left py-1.5 pr-4">{language === "de" ? "Preis" : "Price"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedForCompare.map(oid => {
                          const o = allOffers.find(x => x.id === oid);
                          if (!o) return null;
                          return (
                            <tr key={oid} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{o.providerCompany ?? o.providerName}</td>
                              <td className="py-2 pr-4">{typeBadge(o.type)}</td>
                              <td className="py-2 pr-4 text-muted-foreground">{o.providerCity ?? "—"}</td>
                              <td className="py-2 pr-4">{o.priceEstimate ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>
                )}

                {allOffers.length === 0 ? (
                  <Card className="p-10 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{l.noApplications}</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {projects.map(p => {
                      const offers = offersByProject[p.id] ?? [];
                      if (offers.length === 0) return null;
                      return (
                        <div key={p.id}>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                            {p.title ?? p.projectType} · {p.city}
                          </h3>
                          <div className="space-y-3">
                            {offers.map(o => (
                              <div key={o.id}>
                                <Card className={`p-4 ${compareMode && selectedForCompare.includes(o.id) ? "border-primary ring-1 ring-primary/20" : ""}`}>
                                  <div className="flex items-start gap-3">
                                    {compareMode && (
                                      <input type="checkbox" checked={selectedForCompare.includes(o.id)} onChange={() => toggleCompare(o.id)} className="mt-1 w-4 h-4 accent-primary" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-semibold text-sm">{o.providerCompany ?? o.providerName}</span>
                                        {typeBadge(o.type)}
                                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                                      </div>
                                      {o.providerCity && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{o.providerCity}</p>}
                                      <p className="text-sm text-foreground/80">{o.message}</p>
                                      {o.priceEstimate && <p className="text-sm font-semibold mt-1 text-primary">{o.priceEstimate}</p>}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end shrink-0">
                                      {o.status === "accepted" ? (
                                        <>
                                          <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />{t.clientDashboard.accepted}</Badge>
                                          <Button size="sm" variant="outline" onClick={() => { setOpenThreads(prev => { const n = new Set(prev); n.has(o.id) ? n.delete(o.id) : n.add(o.id); return n; })} }>
                                            <MessageSquare className="w-3.5 h-3.5 mr-1" />{t.messaging.open}
                                            {openThreads.has(o.id) ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                          </Button>
                                          {!reviewedOfferIds.has(o.id) && (
                                            <Button size="sm" variant="outline" onClick={() => setReviewModal({ offerId: o.id, projectId: p.id, providerName: o.providerCompany ?? o.providerName ?? "—" })} data-testid={`button-review-${o.id}`}>
                                              <Star className="w-3.5 h-3.5 mr-1" />{t.reviews.leaveReview}
                                            </Button>
                                          )}
                                        </>
                                      ) : (
                                        <Button size="sm" onClick={() => onAccept(o.id)} data-testid={`button-accept-${o.id}`}>{l.acceptOffer}</Button>
                                      )}
                                    </div>
                                  </div>
                                  {o.status === "accepted" && openThreads.has(o.id) && (
                                    <div className="mt-3 pt-3 border-t">
                                      <MessagingSystem myUserId={user.id} />
                                    </div>
                                  )}
                                </Card>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── NACHRICHTEN ── */}
            {activeSection === "nachrichten" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navMessages}</h2>
                <MessagingSystem myUserId={user.id} />
              </div>
            )}

            {/* ── ANGEBOTE ── */}
            {activeSection === "angebote" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navOffers}</h2>
                {allOffers.length === 0 ? (
                  <Card className="p-10 text-center">
                    <Send className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-4">{l.noOffers}</p>
                    <Button onClick={() => setActiveSection("projekte")}><FolderOpen className="w-4 h-4 mr-2" />{l.navProjects}</Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {projects.map(p => {
                      const offers = (offersByProject[p.id] ?? []).filter(o => o.status !== "pending");
                      if (offers.length === 0) return null;
                      return (
                        <div key={p.id}>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{p.title ?? p.projectType}</h3>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {offers.map(o => (
                              <Card key={o.id} className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="font-semibold text-sm">{o.providerCompany ?? o.providerName}</span>
                                  {typeBadge(o.type)}
                                </div>
                                {o.priceEstimate && <p className="text-lg font-bold text-primary mb-1">{o.priceEstimate}</p>}
                                <p className="text-xs text-muted-foreground line-clamp-2">{o.message}</p>
                                <div className="flex items-center justify-between mt-3">
                                  <Badge variant="outline" className="text-xs">{o.status}</Badge>
                                  <span className="text-xs text-muted-foreground">{format(new Date(o.createdAt), "dd.MM.yy")}</span>
                                </div>
                                {o.status === "accepted" && (
                                  <Button size="sm" className="w-full mt-3" variant="outline" onClick={() => { setOpenThreads(prev => { const n = new Set(prev); n.has(o.id) ? n.delete(o.id) : n.add(o.id); return n; }); setActiveSection("nachrichten"); }}>
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />{t.messaging.open}
                                  </Button>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ANBIETER FINDEN ── */}
            {activeSection === "finden" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navFind}</h2>
                <Card className="p-6 text-center mb-4">
                  <Search className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "de" ? "Durchsuchen Sie unsere geprüften Fachleute und Unternehmen." : language === "fr" ? "Parcourez nos prestataires vérifiés." : language === "sq" ? "Shfletoni profesionistët tanë të verifikuar." : "Browse our verified professionals and companies."}
                  </p>
                  <Link href="/companies">
                    <Button data-testid="button-browse-companies">
                      <Search className="w-4 h-4 mr-2" />
                      {language === "de" ? "Alle Anbieter ansehen" : language === "fr" ? "Voir tous les prestataires" : language === "sq" ? "Shiko të Gjithë Ofruesit" : "Browse All Providers"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </Card>
              </div>
            )}

            {/* ── FAVORITEN ── */}
            {activeSection === "favoriten" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navFavorites}</h2>
                {favorites.length === 0 ? (
                  <Card className="p-10 text-center">
                    <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-4">{l.noFavorites}</p>
                    <Button onClick={() => setActiveSection("finden")}><Search className="w-4 h-4 mr-2" />{l.findProviders}</Button>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {favorites.map(f => (
                      <ProviderCard
                        key={f.id}
                        provider={{
                          id: f.companyId,
                          companyName: f.name,
                          city: f.city,
                          serviceTypes: f.serviceTypes,
                          profilePhoto: f.logoUrl,
                          description: f.shortDescription,
                        }}
                        onClick={() => setLocation(`/companies/${f.companyId}`)}
                        showDescription
                        footer={
                          <div className="flex gap-2 pt-3 border-t border-border/40">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => { e.stopPropagation(); setLocation(`/companies/${f.companyId}`); }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />{l.viewProfile}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); setActiveSection("nachrichten"); }}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeFavorite(f.companyId); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DATEIEN ── */}
            {activeSection === "dateien" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navFiles}</h2>
                {projects.every(p => (p.photos ?? []).length === 0) ? (
                  <Card className="p-10 text-center">
                    <File className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-4">{l.noFiles}</p>
                    <Button onClick={() => setActiveSection("erstellen")}><PlusCircle className="w-4 h-4 mr-2" />{l.navCreate}</Button>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {projects.map(p => {
                      const photos = p.photos ?? [];
                      if (photos.length === 0) return null;
                      return (
                        <div key={p.id}>
                          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{p.title ?? p.projectType} · {p.city}</h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {photos.map((ph, i) => (
                              <a key={i} href={`/api/storage${ph}`} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden bg-muted border hover:opacity-90 transition-opacity">
                                <img src={`/api/storage${ph}`} alt="" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── BEWERTUNGEN ── */}
            {activeSection === "bewertungen" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navReviews}</h2>
                {acceptedOffers.length === 0 ? (
                  <Card className="p-10 text-center">
                    <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {language === "de" ? "Akzeptieren Sie ein Angebot, um eine Bewertung zu hinterlassen." : language === "fr" ? "Acceptez une offre pour laisser un avis." : language === "sq" ? "Pranoni një ofertë për të lënë një vlerësim." : "Accept an offer to leave a review."}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {acceptedOffers.map(o => {
                      const proj = projects.find(p => p.id === o.projectId);
                      const alreadyReviewed = reviewedOfferIds.has(o.id);
                      return (
                        <Card key={o.id} className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-sm">{o.providerCompany ?? o.providerName}</p>
                            <p className="text-xs text-muted-foreground">{proj?.title ?? proj?.projectType} · {proj?.city}</p>
                          </div>
                          {alreadyReviewed ? (
                            <Badge variant="outline" className="text-xs shrink-0">
                              <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />{t.reviews.alreadyReviewed}
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setReviewModal({ offerId: o.id, projectId: o.projectId, providerName: o.providerCompany ?? o.providerName ?? "—" })} data-testid={`button-review-${o.id}`}>
                              <Star className="w-3.5 h-3.5 mr-1.5" />{t.reviews.leaveReview}
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── EINSTELLUNGEN ── */}
            {activeSection === "einstellungen" && (
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">{l.navSettings}</h2>
                <div className="space-y-3">
                  <Card className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{language === "de" ? "Profil & Konto" : language === "fr" ? "Profil & compte" : language === "sq" ? "Profili & Llogaria" : "Profile & Account"}</p>
                      <p className="text-xs text-muted-foreground">{user.fullName === "User" ? user.email : user.fullName} · {user.email}</p>
                    </div>
                    <Link href="/dashboard/profile">
                      <Button size="sm" variant="outline">{language === "de" ? "Bearbeiten" : language === "fr" ? "Modifier" : language === "sq" ? "Ndrysho" : "Edit"}</Button>
                    </Link>
                  </Card>
                  <Card className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{language === "de" ? "Sprache" : language === "fr" ? "Langue" : language === "sq" ? "Gjuha" : "Language"}</p>
                      <p className="text-xs text-muted-foreground uppercase">{language}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => window.scrollTo(0, 0)}>
                      {language === "de" ? "Ändern" : language === "fr" ? "Changer" : language === "sq" ? "Ndrysho" : "Change"}
                    </Button>
                  </Card>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          offerId={reviewModal.offerId}
          projectId={reviewModal.projectId}
          providerName={reviewModal.providerName}
          onClose={() => setReviewModal(null)}
          onDone={(id) => setReviewedOfferIds(prev => new Set([...prev, id]))}
        />
      )}

      {/* Edit Project Dialog */}
      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          open={editingProject !== null}
          onOpenChange={(o) => { if (!o) setEditingProject(null); }}
          onSaved={() => { void loadData(); }}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { urlFor, fetchBlogList } from "@/lib/sanity";
import type { BlogPostSummary } from "@/lib/sanity";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { resolveCategoryLabel, type Lang } from "@/lib/categories";

const CATEGORY_COLORS: Record<string, string> = {
  renovation:      "bg-blue-100 text-blue-700",
  painting:        "bg-sky-100 text-sky-700",
  electrical:      "bg-yellow-100 text-yellow-700",
  plumbing:        "bg-cyan-100 text-cyan-700",
  kitchen:         "bg-orange-100 text-orange-700",
  flooring:        "bg-stone-100 text-stone-700",
  interior_design: "bg-purple-100 text-purple-700",
  cleaning:        "bg-emerald-100 text-emerald-700",
  tips:            "bg-teal-100 text-teal-700",
  news:            "bg-indigo-100 text-indigo-700",
};

const CATEGORY_LABEL_FALLBACK: Record<string, string> = {
  tips: "Tips & Advice",
  news: "Company News",
};

function PostCard({ post, language, t }: {
  post: BlogPostSummary;
  language: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(720).height(400).fit("crop").url()
    : null;

  return (
    <Link href={`/blog/${post.slug.current}`}>
      <article className="group bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 hover:border-primary/25 transition-all duration-300 overflow-hidden h-full flex flex-col cursor-pointer">
        {/* Image */}
        <div className="relative overflow-hidden h-52 flex-shrink-0">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(145deg,#0d2151 0%,#1a3a6e 55%,#1e4b8a 100%)" }}
            >
              <BookOpen className="h-12 w-12 text-white/20" />
            </div>
          )}
          {/* Category badge on image */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm ${CATEGORY_COLORS[post.category] ?? "bg-primary/10 text-primary"}`}>
                {CATEGORY_LABEL_FALLBACK[post.category] ?? resolveCategoryLabel(post.category, language as Lang)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-2.5">
          {post.publishedAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <Calendar className="h-3 w-3" />
              {format(new Date(post.publishedAt), "MMM d, yyyy")}
            </div>
          )}

          <h2 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-1 text-sm font-semibold text-primary mt-auto pt-2 border-t border-border/50">
            <span>{t.blog.readMore}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </article>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden animate-pulse">
      <div className="h-52 bg-slate-100" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-24 bg-slate-100 rounded-full" />
        <div className="h-5 w-full bg-slate-100 rounded-lg" />
        <div className="h-4 w-4/5 bg-slate-100 rounded-lg" />
        <div className="h-4 w-3/5 bg-slate-100 rounded-lg" />
        <div className="h-px w-full bg-slate-100 mt-2" />
        <div className="h-4 w-24 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

export default function Blog() {
  const { t, language } = useLanguage();
  usePageMeta({
    title: "Renovierungstipps & News | ImmoVia365 Blog",
    description: "Entdecken Sie Ratgeber, Renovierungstipps und Neuigkeiten rund um Bau, Renovierung und Handwerksleistungen in der Schweiz.",
  });
  useStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Startseite", item: `${APP_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${APP_URL}/blog` },
    ],
  });

  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const loadPosts = () => {
    setLoading(true);
    setError(null);
    fetchBlogList()
      .then((data: BlogPostSummary[]) => { setPosts(data ?? []); setLoading(false); })
      .catch(() => { setError("fetch"); setLoading(false); });
  };

  useEffect(() => { loadPosts(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const categories = ["all", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]))];
  const filtered = categoryFilter === "all" ? posts : posts.filter((p) => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#f7f8fb]">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden text-white py-24 md:py-36"
        style={{ background: "linear-gradient(145deg,#0b1c3e 0%,#0d2151 40%,#1a3a6e 75%,#1e4b8a 100%)" }}
      >
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(147,197,253,0.14) 0%,transparent 65%)", transform: "translate(25%,-35%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(56,189,248,0.10) 0%,transparent 65%)", transform: "translate(-35%,35%)" }} />

        {/* Decorative accent line — left */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-blue-400/40 to-transparent" />

        <div className="container mx-auto px-6 lg:px-8 relative text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo-white.png"
              alt="ImmoVia365"
              className="h-14 md:h-16 w-auto object-contain"
            />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 leading-[1.05] tracking-tight">
            {t.nav.blog}
          </h1>

          {/* Accent bar */}
          <div className="w-14 h-[3px] rounded-full mx-auto mb-6"
            style={{ background: "linear-gradient(90deg,rgba(147,197,253,0.4),rgba(96,165,250,0.8),rgba(147,197,253,0.4))" }} />

          <p className="text-base md:text-lg text-white/55 max-w-lg mx-auto leading-relaxed font-light">
            {t.blog.subtitle}
          </p>

          {/* Stats row */}
          {!loading && posts.length > 0 && (
            <div className="mt-10 inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-5 py-2 text-sm text-white/60">
              <BookOpen className="w-3.5 h-3.5 text-blue-300" />
              <span>{posts.length} {posts.length === 1 ? "article" : "articles"}</span>
            </div>
          )}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f7f8fb] to-transparent pointer-events-none" />
      </section>

      {/* ── CONTENT ── */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-14 max-w-6xl">

        {/* Fetch error */}
        {error === "fetch" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-10 shadow-sm">
            <p className="text-red-700 font-semibold mb-1">{t.blog.loadError}</p>
            <p className="text-red-600 text-sm mb-5">{t.blog.loadErrorDesc}</p>
            <button
              onClick={loadPosts}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
            >
              {language === "de" ? "Erneut versuchen" : language === "fr" ? "Réessayer" : language === "sq" ? "Provo përsëri" : "Try again"}
            </button>
          </div>
        )}

        {/* Category filter */}
        {!error && !loading && posts.length > 0 && categories.length > 2 && (
          <div className="flex items-center gap-2 flex-wrap mb-10 p-4 bg-white rounded-2xl border border-border/60 shadow-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                  categoryFilter === cat
                    ? "bg-foreground text-white border-foreground shadow-sm"
                    : "bg-transparent text-foreground/60 border-border hover:border-primary/40 hover:text-primary hover:bg-primary/4"
                }`}
              >
                {cat === "all" ? t.blog.allCategories : (CATEGORY_LABEL_FALLBACK[cat] ?? resolveCategoryLabel(cat, language as Lang))}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : !error && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-muted-foreground bg-white rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-2xl bg-primary/6 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t.blog.noPostsTitle}</p>
            <p className="text-sm">{t.blog.noPostsDesc}</p>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => <PostCard key={post._id} post={post} language={language} t={t} />)}
          </div>
        ) : null}
      </div>

      {/* ── CTA BAND ── */}
      {!loading && !error && posts.length > 0 && (
        <div
          className="mt-4 py-16 text-white text-center"
          style={{ background: "linear-gradient(145deg,#0d2151 0%,#1a3a6e 55%,#1e4b8a 100%)" }}
        >
          <div className="flex justify-center mb-7">
            <img src="/logo-white.png" alt="ImmoVia365" className="h-12 w-auto object-contain" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            {language === "de" ? "Bereit, Ihr Projekt zu starten?" :
             language === "sq" ? "Gati të filloni projektin tuaj?" :
             language === "fr" ? "Prêt à démarrer votre projet?" :
             "Ready to start your project?"}
          </h2>
          <p className="text-white/45 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            {language === "de" ? "Verbinden Sie sich mit geprüften Fachleuten in der Schweiz." :
             language === "sq" ? "Lidhuni me profesionistë të verifikuar në Zvicër." :
             language === "fr" ? "Connectez-vous avec des professionnels vérifiés en Suisse." :
             "Connect with vetted professionals across Switzerland."}
          </p>
          <Link href="/submit-project">
            <button className="group inline-flex items-center gap-2 bg-white text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-white/92 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              {language === "de" ? "Projekt ausschreiben" :
               language === "sq" ? "Posto Projekt" :
               language === "fr" ? "Poster un projet" :
               "Post a Project"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

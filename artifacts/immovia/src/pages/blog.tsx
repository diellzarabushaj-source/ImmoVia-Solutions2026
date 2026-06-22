import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, Tag, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { urlFor, fetchBlogList } from "@/lib/sanity";
import type { BlogPostSummary, SanityImageRef } from "@/lib/sanity";
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

function PostCard({ post, language, t }: { post: BlogPostSummary; language: string; t: ReturnType<typeof useLanguage>['t'] }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(640).height(360).fit("crop").url()
    : null;

  return (
    <Link href={`/blog/${post.slug.current}`}>
      <article className="group bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col cursor-pointer">
        {imageUrl ? (
          <div className="relative overflow-hidden h-48 flex-shrink-0">
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-48 flex-shrink-0 bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/30" />
          </div>
        )}

        <div className="p-5 flex flex-col flex-1 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-primary/10 text-primary"}`}>
                {CATEGORY_LABEL_FALLBACK[post.category] ?? resolveCategoryLabel(post.category, language as Lang)}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(post.publishedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>

          <h2 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-1 text-sm font-semibold text-primary mt-auto pt-2">
            {t.blog.readMore} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
          <div className="h-5 w-24 bg-gray-100 rounded-full" />
        </div>
        <div className="h-5 w-full bg-gray-100 rounded" />
        <div className="h-4 w-4/5 bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
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
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${APP_URL}/blog` }
    ]
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

  useEffect(() => {
    loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = ["all", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]))];
  const filtered = categoryFilter === "all" ? posts : posts.filter((p) => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden text-white py-20 md:py-28"
        style={{ background: "linear-gradient(145deg,#0d2151 0%,#1a3a6e 55%,#1e4b8a 100%)" }}>
        {/* Radial glow */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(147,197,253,0.12) 0%,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(99,179,237,0.08) 0%,transparent 70%)", transform: "translate(-30%,30%)" }} />
        <div className="container mx-auto px-4 text-center relative">
          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.22em] mb-4">ImmoVia365</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            {t.nav.blog}
          </h1>
          <div className="w-12 h-[2px] bg-blue-300/40 mx-auto mb-4 rounded-full" />
          <p className="text-base text-white/60 max-w-md mx-auto leading-relaxed">
            {t.blog.subtitle}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Fetch error */}
        {error === "fetch" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8">
            <p className="text-red-700 font-semibold">{t.blog.loadError}</p>
            <p className="text-red-600 text-sm mt-1">{t.blog.loadErrorDesc}</p>
            <button
              onClick={loadPosts}
              className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
            >
              {language === "de" ? "Erneut versuchen" : language === "fr" ? "Réessayer" : language === "sq" ? "Provo përsëri" : "Try again"}
            </button>
          </div>
        )}

        {/* Category filter */}
        {!error && !loading && posts.length > 0 && categories.length > 2 && (
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  categoryFilter === cat
                    ? "bg-[#1a3a6e] text-white border-[#1a3a6e]"
                    : "bg-white text-foreground/70 border-border hover:border-primary/40 hover:text-primary"
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
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <BookOpen className="h-14 w-14 text-primary/20" />
            <p className="text-lg font-semibold text-foreground">{t.blog.noPostsTitle}</p>
            <p className="text-sm">{t.blog.noPostsDesc}</p>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => <PostCard key={post._id} post={post} language={language} t={t} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

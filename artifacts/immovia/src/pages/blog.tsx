import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, Tag, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isSanityConfigured, urlFor, fetchBlogList } from "@/lib/sanity";
import type { BlogPostSummary, SanityImageRef } from "@/lib/sanity";
import { useLanguage } from "@/lib/language-context";

const CATEGORY_COLORS: Record<string, string> = {
  Renovation: "bg-blue-100 text-blue-700",
  Construction: "bg-indigo-100 text-indigo-700",
  "Interior Design": "bg-purple-100 text-purple-700",
  Exterior: "bg-sky-100 text-sky-700",
  "Tips & Advice": "bg-emerald-100 text-emerald-700",
  "Company News": "bg-orange-100 text-orange-700",
};

function PostCard({ post }: { post: BlogPostSummary }) {
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
                {post.category}
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
            Read more <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
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
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setError("config");
      return;
    }
    setLoading(true);
    setError(null);
    fetchBlogList()
      .then((data: BlogPostSummary[]) => { setPosts(data ?? []); setLoading(false); })
      .catch(() => { setError("fetch"); setLoading(false); });
  }, [projectId]);

  const categories = ["all", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]))];
  const filtered = categoryFilter === "all" ? posts : posts.filter((p) => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-[#1a3a6e] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/10 text-xs font-medium uppercase tracking-widest">
            {t.nav.blog}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            ImmoVia Insights
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Renovation tips, construction guides, and industry news from the ImmoVia team.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Config error */}
        {error === "config" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-8">
            <p className="text-amber-800 font-semibold mb-1">Sanity not configured yet</p>
            <p className="text-amber-700 text-sm">
              Set <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SANITY_PROJECT_ID</code> and{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SANITY_DATASET</code> to connect your Sanity project.
            </p>
          </div>
        )}

        {/* Fetch error */}
        {error === "fetch" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8">
            <p className="text-red-700 font-semibold">Could not load posts</p>
            <p className="text-red-600 text-sm mt-1">Please check your Sanity connection and try again.</p>
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
                {cat === "all" ? "All" : cat}
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
            <p className="text-lg font-semibold text-foreground">No posts yet</p>
            <p className="text-sm">Check back soon for articles and guides.</p>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => <PostCard key={post._id} post={post} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

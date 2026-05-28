import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Loader2, BookOpen } from "lucide-react";
import { PortableText } from "@portabletext/react";
import type { PortableTextReactComponents } from "@portabletext/react";
import { Badge } from "@/components/ui/badge";
import { isSanityConfigured, urlFor, fetchBlogPost } from "@/lib/sanity";
import type { BlogPostFull, SanityImageRef } from "@/lib/sanity";

const CATEGORY_COLORS: Record<string, string> = {
  Renovation: "bg-blue-100 text-blue-700",
  Construction: "bg-indigo-100 text-indigo-700",
  "Interior Design": "bg-purple-100 text-purple-700",
  Exterior: "bg-sky-100 text-sky-700",
  "Tips & Advice": "bg-emerald-100 text-emerald-700",
  "Company News": "bg-orange-100 text-orange-700",
};

const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mt-10 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h4>,
    normal: ({ children }) => <p className="text-base text-foreground/80 leading-relaxed mb-4">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-6">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-4 text-foreground/80">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-foreground/80">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const src = urlFor(value).width(900).fit("max").url();
      return (
        <figure className="my-8">
          <img
            src={src}
            alt={value.alt ?? ""}
            className="w-full rounded-xl border border-border shadow-sm"
            loading="lazy"
          />
          {value.caption && (
            <figcaption className="text-center text-xs text-muted-foreground mt-2 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;

  useEffect(() => {
    if (!slug) return;
    if (!projectId) { setLoading(false); setError("config"); return; }
    setLoading(true);
    setError(null);
    fetchBlogPost(slug)
      .then((data: BlogPostFull | null) => {
        if (!data) { setError("not-found"); } else { setPost(data); }
        setLoading(false);
      })
      .catch(() => { setError("fetch"); setLoading(false); });
  }, [slug, projectId]);

  const imageUrl = post?.mainImage
    ? urlFor(post.mainImage).width(1200).height(500).fit("crop").url()
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Back link */}
      <div className="container mx-auto px-4 pt-6 max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Blog
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      )}

      {!loading && error === "not-found" && (
        <div className="container mx-auto px-4 py-24 max-w-3xl text-center">
          <BookOpen className="h-14 w-14 text-primary/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-6">This post may have been removed or is not published.</p>
          <Link href="/blog">
            <span className="text-primary font-semibold hover:underline">Browse all posts →</span>
          </Link>
        </div>
      )}

      {!loading && (error === "config" || error === "fetch") && (
        <div className="container mx-auto px-4 py-24 max-w-3xl text-center">
          <p className="text-muted-foreground">{error === "config" ? "Sanity is not configured." : "Could not load this post."}</p>
        </div>
      )}

      {!loading && post && (
        <article className="container mx-auto px-4 pb-20 max-w-3xl">
          {/* Meta */}
          <header className="mt-6 mb-8">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {post.category && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-primary/10 text-primary"}`}>
                  {post.category}
                </span>
              )}
              {post.publishedAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Hero image */}
          {imageUrl && (
            <div className="mb-10 rounded-2xl overflow-hidden border border-border shadow-sm">
              <img
                src={imageUrl}
                alt={post.title}
                className="w-full object-cover max-h-[420px]"
              />
            </div>
          )}

          {/* Body */}
          {post.body && post.body.length > 0 && (
            <div className="prose-custom">
              <PortableText value={post.body} components={portableComponents} />
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
            <Link href="/blog">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> All articles
              </span>
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}

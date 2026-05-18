import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, normalizeRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import {
  billingApi,
  type ProviderProject,
  type OfferWithProvider,
} from "@/lib/billing-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, Flame, Star, X, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import MessageThread from "@/components/MessageThread";
import { format } from "date-fns";

// Inline star picker
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none"
          aria-label={String(n)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface ReviewModalProps {
  offerId: number;
  projectId: number;
  providerName: string;
  onClose: () => void;
  onDone: (offerId: number) => void;
}

function ReviewModal({ offerId, projectId, providerName, onClose, onDone }: ReviewModalProps) {
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
      const res = await fetch(`/api/projects/${projectId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, rating, comment: comment.trim() || null }),
      });
      if (res.status === 409) {
        setError(t.reviews.alreadyReviewed);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Error");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        onDone(offerId);
        onClose();
      }, 1200);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{t.reviews.leaveReview}</h3>
            <p className="text-sm text-muted-foreground">{providerName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center text-primary font-semibold">{t.reviews.success}</div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">{t.reviews.rating}</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">{t.reviews.comment}</label>
              <textarea
                className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] bg-background"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
            </div>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                {t.common?.cancel ?? "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={rating < 1 || submitting}
                data-testid="button-submit-review"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.reviews.submit}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [offersByProject, setOffersByProject] = useState<Record<number, OfferWithProvider[]>>({});
  const [reviewedOfferIds, setReviewedOfferIds] = useState<Set<number>>(new Set());
  const [reviewModal, setReviewModal] = useState<{
    offerId: number;
    projectId: number;
    providerName: string;
  } | null>(null);
  const [openThreads, setOpenThreads] = useState<Set<number>>(new Set());

  const toggleThread = (offerId: number) => {
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
  };

  const role = user ? normalizeRole(user.role) : null;

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!user) return;
    if (role !== "client") return;
    void (async () => {
      try {
        const pjs = await billingApi.myProjects();
        setProjects(pjs);
        const map: Record<number, OfferWithProvider[]> = {};
        for (const p of pjs) {
          try {
            const offers = await billingApi.projectOffers(p.id);
            map[p.id] = offers;
          } catch {
            map[p.id] = [];
          }
        }
        setOffersByProject(map);
      } catch {
        // ignore
      }

      // Fetch already-reviewed offer IDs
      try {
        const res = await fetch("/api/reviews/my-reviewed-offers");
        if (res.ok) {
          const data = (await res.json()) as { reviewedOfferIds: number[] };
          setReviewedOfferIds(new Set(data.reviewedOfferIds));
        }
      } catch {
        // ignore
      }
    })();
  }, [user, role]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "client") {
    setLocation(role === "service_provider" ? "/provider" : "/admin");
    return null;
  }

  const onAccept = async (offerId: number) => {
    try {
      await billingApi.acceptOffer(offerId);
      const pjs = await billingApi.myProjects();
      setProjects(pjs);
    } catch {
      // ignore
    }
  };

  const typeBadge = (type: string) => {
    if (type === "top") return <Badge className="bg-amber-100 text-amber-800 gap-1"><Flame className="w-3 h-3" /> {t.provider.offerTypeTop}</Badge>;
    if (type === "highlighted") return <Badge className="bg-blue-100 text-blue-800 gap-1"><Star className="w-3 h-3" /> {t.provider.offerTypeHighlighted}</Badge>;
    return <Badge variant="outline">{t.provider.offerTypeNormal}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-1">{t.dashboard.welcome}, {user.fullName.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm">{t.dashboard.homeownerSubtitle}</p>
        </div>
        <Link href="/submit-project">
          <Button data-testid="button-new-project">
            <Briefcase className="w-4 h-4 mr-2" /> {t.clientDashboard.newProject}
          </Button>
        </Link>
      </div>

      {projects.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">{t.clientDashboard.noProjects}</p>
          <Link href="/submit-project">
            <Button>{t.clientDashboard.newProject}</Button>
          </Link>
        </Card>
      )}

      <div className="space-y-6">
        {projects.map((p) => {
          const offers = offersByProject[p.id] ?? [];
          return (
            <Card key={p.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold capitalize" data-testid={`project-${p.id}`}>{p.projectType}</h3>
                  <p className="text-sm text-muted-foreground">{p.city} · {t.clientDashboard.size}: <span className="capitalize">{p.size}</span></p>
                </div>
                <Badge variant="outline">{p.status}</Badge>
              </div>
              <p className="text-sm mb-4 line-clamp-2">{p.description}</p>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">
                  {t.clientDashboard.offersReceived} ({offers.length})
                </h4>
                {offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.clientDashboard.noOffersYet}</p>
                ) : (
                  <div className="space-y-3">
                    {offers.map((o) => (
                      <div key={o.id}>
                      <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{o.providerCompany ?? o.providerName}</span>
                            {typeBadge(o.type)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{o.providerCity}</p>
                          <p className="text-sm">{o.message}</p>
                          {o.priceEstimate && (
                            <p className="text-sm font-semibold mt-1">{t.clientDashboard.price}: {o.priceEstimate}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {o.status === "accepted" ? (
                            <>
                              <Badge>{t.clientDashboard.accepted}</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleThread(o.id)}
                                data-testid={`button-messages-${o.id}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                {t.messaging.open}
                                {openThreads.has(o.id) ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                              </Button>
                              {reviewedOfferIds.has(o.id) ? (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                                  {t.reviews.alreadyReviewed}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setReviewModal({
                                      offerId: o.id,
                                      projectId: p.id,
                                      providerName: o.providerCompany ?? o.providerName ?? "—",
                                    })
                                  }
                                  data-testid={`button-review-${o.id}`}
                                >
                                  <Star className="w-3.5 h-3.5 mr-1" />
                                  {t.reviews.leaveReview}
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button size="sm" onClick={() => onAccept(o.id)} data-testid={`button-accept-${o.id}`}>
                              {t.clientDashboard.accept}
                            </Button>
                          )}
                        </div>
                      </div>
                      {o.status === "accepted" && openThreads.has(o.id) && (
                        <div className="mt-2 px-1">
                          <MessageThread
                            offerId={o.id}
                            otherPartyName={o.providerCompany ?? o.providerName ?? undefined}
                          />
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                {t.clientDashboard.posted} {format(new Date(p.createdAt), "MMM d, yyyy")}
              </p>
            </Card>
          );
        })}
      </div>

      {reviewModal && (
        <ReviewModal
          offerId={reviewModal.offerId}
          projectId={reviewModal.projectId}
          providerName={reviewModal.providerName}
          onClose={() => setReviewModal(null)}
          onDone={(id) => setReviewedOfferIds((prev) => new Set([...prev, id]))}
        />
      )}
    </div>
  );
}

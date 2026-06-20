import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, MessageSquare, Clock } from "lucide-react";

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Bewertungen",
    receivedTitle: "Erhaltene Bewertungen",
    pendingTitle: "Ausstehende Bewertungen",
    pendingHint: "Sie können folgende Kontakte bewerten:",
    noReceived: "Noch keine Bewertungen erhalten.",
    noPending: "Keine ausstehenden Bewertungen.",
    leaveReview: "Bewertung schreiben",
    yourRating: "Ihre Bewertung",
    commentLabel: "Kommentar (optional)",
    commentPlaceholder: "Teilen Sie Ihre Erfahrung…",
    submit: "Senden",
    submitting: "Sendet…",
    success: "Bewertung gesendet.",
    alreadyReviewed: "Bereits bewertet.",
    cancel: "Abbrechen",
    forProject: "Projekt",
  },
  en: {
    title: "Reviews",
    receivedTitle: "Reviews received",
    pendingTitle: "Pending reviews",
    pendingHint: "You can now review these contacts:",
    noReceived: "No reviews received yet.",
    noPending: "No pending reviews.",
    leaveReview: "Write a review",
    yourRating: "Your rating",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "Share your experience…",
    submit: "Submit",
    submitting: "Submitting…",
    success: "Review submitted.",
    alreadyReviewed: "Already reviewed.",
    cancel: "Cancel",
    forProject: "Project",
  },
  sq: {
    title: "Vlerësimet",
    receivedTitle: "Vlerësimet e marra",
    pendingTitle: "Vlerësimet e pritshme",
    pendingHint: "Mund të vlerësoni këta kontakte:",
    noReceived: "Ende asnjë vlerësim i marrë.",
    noPending: "Asnjë vlerësim i pritshëm.",
    leaveReview: "Shkruaj vlerësim",
    yourRating: "Vlerësimi juaj",
    commentLabel: "Koment (opsional)",
    commentPlaceholder: "Ndani përvojën tuaj…",
    submit: "Dërgo",
    submitting: "Duke dërguar…",
    success: "Vlerësimi u dërgua.",
    alreadyReviewed: "Tashmë i vlerësuar.",
    cancel: "Anulo",
    forProject: "Projekti",
  },
  fr: {
    title: "Avis",
    receivedTitle: "Avis reçus",
    pendingTitle: "Avis à donner",
    pendingHint: "Vous pouvez maintenant noter ces contacts :",
    noReceived: "Aucun avis reçu pour l'instant.",
    noPending: "Aucun avis en attente.",
    leaveReview: "Rédiger un avis",
    yourRating: "Votre note",
    commentLabel: "Commentaire (optionnel)",
    commentPlaceholder: "Partagez votre expérience…",
    submit: "Envoyer",
    submitting: "Envoi…",
    success: "Avis envoyé.",
    alreadyReviewed: "Déjà noté.",
    cancel: "Annuler",
    forProject: "Projet",
  },
};

interface ReceivedReview {
  id: number;
  offerId: number;
  projectId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string | null;
  projectTitle: string | null;
}

interface PendingReview {
  offerId: number;
  projectId: number;
  projectTitle: string | null;
  otherUserId: number | null;
  otherName: string | null;
  createdAt: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= value ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20"}`}
        />
      ))}
    </div>
  );
}

interface ReviewFormProps {
  offerId: number;
  projectId: number;
  otherName: string | null;
  l: Record<string, string>;
  onDone: (offerId: number) => void;
  onCancel: () => void;
}

function ReviewForm({ offerId, projectId, otherName, l, onDone, onCancel }: ReviewFormProps) {
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
        credentials: "include",
        body: JSON.stringify({ offerId, rating, comment: comment.trim() || null }),
      });
      if (res.status === 409) { setError(l.alreadyReviewed); setSubmitting(false); return; }
      if (!res.ok) { const b = await res.json() as { error?: string }; setError(b.error ?? "Error"); setSubmitting(false); return; }
      setDone(true);
      setTimeout(() => onDone(offerId), 1000);
    } catch { setError("Network error"); setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="py-4 text-center text-primary font-semibold text-sm">
        {l.success}
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {otherName && <p className="text-xs text-muted-foreground">{otherName}</p>}
      <div>
        <p className="text-xs font-medium mb-2">{l.yourRating}</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">{l.commentLabel}</label>
        <textarea
          className="w-full border border-border rounded-lg p-2.5 text-sm resize-none bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[72px]"
          placeholder={l.commentPlaceholder}
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onCancel}>{l.cancel}</Button>
        <Button size="sm" onClick={() => void submit()} disabled={rating < 1 || submitting}>
          {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
          {submitting ? l.submitting : l.submit}
        </Button>
      </div>
    </div>
  );
}

interface Props {
  language: string;
}

export default function BewertungenSection({ language }: Props) {
  const l = L[language] ?? L.de;

  const [received, setReceived] = useState<ReceivedReview[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState<number | null>(null); // offerId

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/reviews/received", { credentials: "include" }),
        fetch("/api/reviews/pending", { credentials: "include" }),
      ]);
      if (r1.ok) {
        const d = await r1.json() as { reviews: ReceivedReview[]; average: number | null };
        setReceived(d.reviews ?? []);
        setAverage(d.average);
      }
      if (r2.ok) {
        const d = await r2.json() as { pending: PendingReview[] };
        setPending(d.pending ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onReviewDone = (offerId: number) => {
    setPending(prev => prev.filter(p => p.offerId !== offerId));
    setOpenForm(null);
    void load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-serif font-bold">{l.title}</h2>
        {average !== null && received.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <StarDisplay value={Math.round(average)} />
            <span className="font-semibold text-sm">{average}</span>
            <span className="text-sm text-muted-foreground">({received.length})</span>
          </div>
        )}
      </div>

      {/* ── Pending reviews to write ── */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            {l.pendingTitle}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">{l.pendingHint}</p>
          <div className="space-y-3">
            {pending.map(p => (
              <Card key={p.offerId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{p.otherName ?? "—"}</p>
                    {p.projectTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l.forProject}: {p.projectTitle}
                      </p>
                    )}
                  </div>
                  {openForm !== p.offerId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenForm(p.offerId)}
                    >
                      <Star className="w-3.5 h-3.5 mr-1.5" />
                      {l.leaveReview}
                    </Button>
                  )}
                </div>
                {openForm === p.offerId && (
                  <ReviewForm
                    offerId={p.offerId}
                    projectId={p.projectId}
                    otherName={p.otherName}
                    l={l}
                    onDone={onReviewDone}
                    onCancel={() => setOpenForm(null)}
                  />
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Received reviews ── */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          {l.receivedTitle}
        </h3>
        {received.length === 0 ? (
          <Card className="p-8 text-center">
            <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">{l.noReceived}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {received.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold">{r.authorName ?? "—"}</p>
                    {r.projectTitle && (
                      <p className="text-xs text-muted-foreground">{l.forProject}: {r.projectTitle}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StarDisplay value={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

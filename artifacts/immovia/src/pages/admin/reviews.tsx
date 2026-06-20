import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Loader2, Trash2, Star, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/language-context";

interface AdminReview {
  id: number;
  projectId: number;
  offerId: number;
  authorName: string | null;
  targetName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  projectTitle: string | null;
}

function StarBadge({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
        />
      ))}
      <span className="text-xs font-semibold ml-1">{value}</span>
    </div>
  );
}

export function AdminReviews() {
  const { t, language } = useLanguage();
  const l = t.admin;

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/reviews", { credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<AdminReview[]> : Promise.reject())
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteReview = async () => {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      await fetch(`/api/reviews/${deleteTarget}`, { method: "DELETE", credentials: "include" });
      setReviews(prev => prev.filter(r => r.id !== deleteTarget));
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = reviews.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.authorName?.toLowerCase().includes(q) ||
      r.targetName?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.projectTitle?.toLowerCase().includes(q)
    );
  });

  const title = language === "de" ? "Bewertungen" : language === "fr" ? "Avis" : language === "sq" ? "Vlerësimet" : "Reviews";
  const subtitle = language === "de" ? "Alle Bewertungen verwalten und löschen" : language === "fr" ? "Gérer et supprimer tous les avis" : language === "sq" ? "Menaxhoni dhe fshini vlerësimet" : "Manage and remove all reviews";
  const colAuthor = language === "de" ? "Verfasser" : language === "fr" ? "Auteur" : language === "sq" ? "Autori" : "Author";
  const colTarget = language === "de" ? "Bewertet" : language === "fr" ? "Noté" : language === "sq" ? "I vlerësuar" : "Reviewed";
  const colProject = language === "de" ? "Projekt" : language === "fr" ? "Projet" : language === "sq" ? "Projekti" : "Project";
  const colComment = language === "de" ? "Kommentar" : language === "fr" ? "Commentaire" : language === "sq" ? "Komenti" : "Comment";
  const colDate = language === "de" ? "Datum" : language === "fr" ? "Date" : language === "sq" ? "Data" : "Date";
  const searchPh = language === "de" ? "Suchen…" : language === "fr" ? "Rechercher…" : language === "sq" ? "Kërko…" : "Search…";
  const confirmTitle = language === "de" ? "Bewertung löschen?" : language === "fr" ? "Supprimer l'avis ?" : language === "sq" ? "Fshi vlerësimin?" : "Delete review?";
  const confirmDesc = language === "de" ? "Diese Aktion kann nicht rückgängig gemacht werden." : language === "fr" ? "Cette action est irréversible." : language === "sq" ? "Kjo veprim nuk mund të kthehet." : "This action cannot be undone.";
  const noReviews = language === "de" ? "Keine Bewertungen gefunden." : language === "fr" ? "Aucun avis trouvé." : language === "sq" ? "Asnjë vlerësim." : "No reviews found.";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          {language === "de" ? "Aktualisieren" : language === "fr" ? "Actualiser" : language === "sq" ? "Rifreskoni" : "Refresh"}
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={searchPh}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} / {reviews.length}</span>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">{noReviews}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{colAuthor}</TableHead>
                <TableHead>{colTarget}</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>{colProject}</TableHead>
                <TableHead>{colComment}</TableHead>
                <TableHead>{colDate}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.authorName ?? "—"}</TableCell>
                  <TableCell>{r.targetName ?? "—"}</TableCell>
                  <TableCell><StarBadge value={r.rating} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                    {r.projectTitle ?? `#${r.projectId}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                    {r.comment ? (
                      <span className="line-clamp-2">{r.comment}</span>
                    ) : (
                      <span className="italic opacity-50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(r.createdAt), "dd.MM.yy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      onClick={() => setDeleteTarget(r.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={confirmTitle}
        description={confirmDesc}
        confirmLabel={l.delete ?? "Delete"}
        onConfirm={() => void deleteReview()}
        onCancel={() => setDeleteTarget(null)}
        variant="destructive"
      />
    </div>
  );
}

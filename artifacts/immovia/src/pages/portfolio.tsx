import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Trash2,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface PortfolioItem {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
}

async function uploadFileToObjectStorage(file: File): Promise<string> {
  const presignRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!presignRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = (await presignRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Upload failed");
  return `/api/storage${objectPath}`;
}

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
    else if (!loading && user && user.role !== "contractor") setLocation("/dashboard");
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/portfolio/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { items: PortfolioItem[] }) => setItems(d.items))
      .finally(() => setFetchLoading(false));
  }, [user]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.portfolio.errorImageOnly);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(t.portfolio.errorTooLarge);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFileToObjectStorage(file);
      setPendingImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!pendingImageUrl) return;
    setError(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: pendingImageUrl,
          title: title.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const { item } = (await res.json()) as { item: PortfolioItem };
      setItems((prev) => [...prev, item]);
      setPendingImageUrl(null);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleDelete = async (id: number) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) setItems(prev);
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.dashboard.welcome}
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold mb-1">{t.portfolio.title}</h1>
          <p className="text-sm text-muted-foreground">{t.portfolio.subtitle}</p>
        </div>
        {user.slug && (
          <Link href={`/company/${user.slug}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t.portfolio.viewPublic}
            </Button>
          </Link>
        )}
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">{t.portfolio.addNew}</h2>

        {!pendingImageUrl ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{t.portfolio.dropHint}</p>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
                disabled={uploading}
                data-testid="input-portfolio-file"
              />
              <Button asChild disabled={uploading}>
                <span>
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? t.portfolio.uploading : t.portfolio.chooseImage}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-3">{t.portfolio.maxSize}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={pendingImageUrl}
              alt=""
              className="w-full max-w-md mx-auto rounded-lg border border-border"
            />
            <div>
              <Label htmlFor="portfolio-title">{t.portfolio.itemTitle}</Label>
              <Input
                id="portfolio-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.portfolio.titlePlaceholder}
                data-testid="input-portfolio-title"
              />
            </div>
            <div>
              <Label htmlFor="portfolio-desc">{t.portfolio.itemDescription}</Label>
              <Textarea
                id="portfolio-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.portfolio.descriptionPlaceholder}
                rows={3}
                data-testid="input-portfolio-description"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} data-testid="button-portfolio-save">
                {t.portfolio.savePhoto}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPendingImageUrl(null);
                  setTitle("");
                  setDescription("");
                }}
              >
                {t.portfolio.cancel}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}
      </Card>

      <h2 className="text-lg font-bold mb-4">
        {t.portfolio.yourPhotos} ({items.length})
      </h2>

      {fetchLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">{t.portfolio.empty}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group relative">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={item.imageUrl} alt={item.title || ""} className="w-full h-full object-cover" />
              </div>
              {(item.title || item.description) && (
                <div className="p-4">
                  {item.title && <h3 className="font-semibold text-sm mb-1">{item.title}</h3>}
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-delete-${item.id}`}
                aria-label={t.portfolio.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

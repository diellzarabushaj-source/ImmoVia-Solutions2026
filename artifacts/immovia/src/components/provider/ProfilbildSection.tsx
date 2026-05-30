import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Building2, ImageIcon } from "lucide-react";
import { PhotoUploader } from "@/components/photo-uploader";

const L: Record<string, Record<string, string>> = {
  de: {
    title: "Profilbild & Logo",
    profilePic: "Profilbild",
    profilePicHint: "Für Einzelanbieter. Empfohlen: quadratisches Format (JPG, PNG, max. 5 MB)",
    logo: "Firmenlogo",
    logoHint: "Für Unternehmen. Empfohlen: quadratisches Format (JPG, PNG, max. 5 MB)",
    cover: "Titelbild",
    coverHint: "Grosses Bannerbild für Ihr öffentliches Profil. Empfohlen: breites Format (JPG, PNG, max. 5 MB)",
    save: "Bilder speichern",
    saved: "Bilder erfolgreich gespeichert.",
    error: "Fehler beim Speichern.",
    upload: "Bild hochladen",
    change: "Bild ändern",
    remove: "Entfernen",
  },
  en: {
    title: "Profile Photo & Logo",
    profilePic: "Profile photo",
    profilePicHint: "For individual providers. Recommended: square format (JPG, PNG, max 5 MB)",
    logo: "Company logo",
    logoHint: "For companies. Recommended: square format (JPG, PNG, max 5 MB)",
    cover: "Cover image",
    coverHint: "Large banner for your public profile. Recommended: wide format (JPG, PNG, max 5 MB)",
    save: "Save images",
    saved: "Images saved successfully.",
    error: "Error saving.",
    upload: "Upload image",
    change: "Change image",
    remove: "Remove",
  },
  sq: {
    title: "Foto & Logo",
    profilePic: "Foto profili",
    profilePicHint: "Për ofrues individual. Format katrori rekomandohet (JPG, PNG, max 5 MB)",
    logo: "Logo e kompanisë",
    logoHint: "Për kompanitë. Format katrori rekomandohet (JPG, PNG, max 5 MB)",
    cover: "Foto kryesore",
    coverHint: "Foto e madhe për profilin publik. Format i gjerë rekomandohet (JPG, PNG, max 5 MB)",
    save: "Ruaj fotografitë",
    saved: "Fotografitë u ruajtën me sukses.",
    error: "Gabim gjatë ruajtjes.",
    upload: "Ngarko foto",
    change: "Ndrysho foton",
    remove: "Hiq",
  },
  fr: {
    title: "Photo & Logo",
    profilePic: "Photo de profil",
    profilePicHint: "Pour les prestataires individuels. Format carré recommandé (JPG, PNG, max 5 Mo)",
    logo: "Logo de l'entreprise",
    logoHint: "Pour les entreprises. Format carré recommandé (JPG, PNG, max 5 Mo)",
    cover: "Image de couverture",
    coverHint: "Grande bannière pour votre profil public. Format large recommandé (JPG, PNG, max 5 Mo)",
    save: "Enregistrer les images",
    saved: "Images enregistrées avec succès.",
    error: "Erreur lors de l'enregistrement.",
    upload: "Télécharger une image",
    change: "Changer l'image",
    remove: "Supprimer",
  },
};

interface Props {
  language: string;
}

export default function ProfilbildSection({ language }: Props) {
  const l = L[language] ?? L.de;

  const [profilePhotoPath, setProfilePhotoPath] = useState<string>("");
  const [logoPath, setLogoPath] = useState<string>("");
  const [coverPath, setCoverPath] = useState<string>("");

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/provider/profile")
      .then(r => r.json())
      .then((d: { company?: { profilePhoto?: string | null; logoUrl?: string | null; coverImageUrl?: string | null } | null }) => {
        if (d.company?.profilePhoto) setProfilePhotoUrl(d.company.profilePhoto);
        if (d.company?.logoUrl) setLogoUrl(d.company.logoUrl);
        if (d.company?.coverImageUrl) setCoverUrl(d.company.coverImageUrl);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, string> = {};
      if (profilePhotoUrl) body.profilePhoto = profilePhotoUrl;
      if (logoUrl) body.logoUrl = logoUrl;
      if (coverUrl) body.coverImageUrl = coverUrl;
      const r = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      setMsg({ type: "ok", text: l.saved });
    } catch {
      setMsg({ type: "err", text: l.error });
    } finally {
      setSaving(false);
    }
  };

  const ImageCard = ({
    label,
    hint,
    icon,
    currentUrl,
    onUploaded,
    onRemove,
    tall,
  }: {
    label: string;
    hint: string;
    icon: React.ReactNode;
    currentUrl: string;
    onUploaded: (url: string) => void;
    onRemove: () => void;
    tall?: boolean;
  }) => (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">{icon}{label}</h3>
      <p className="text-xs text-muted-foreground mb-4">{hint}</p>
      {currentUrl ? (
        <div className="space-y-3">
          <div className={`relative rounded-xl overflow-hidden border border-border bg-muted/20 ${tall ? "h-36 w-full" : "w-28 h-28"}`}>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <PhotoUploader
              label={l.change}
              hint=""
              value={[]}
              onChange={(paths) => {
                if (paths[0]) onUploaded(`/api/storage${paths[0]}`);
              }}
            />
            <Button size="sm" variant="outline" onClick={onRemove} className="text-destructive border-destructive/30 hover:bg-destructive/5">
              {l.remove}
            </Button>
          </div>
        </div>
      ) : (
        <PhotoUploader
          label={l.upload}
          hint=""
          value={[]}
          onChange={(paths) => {
            if (paths[0]) onUploaded(`/api/storage${paths[0]}`);
          }}
        />
      )}
    </Card>
  );

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-serif font-bold">{l.title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageCard
          label={l.profilePic}
          hint={l.profilePicHint}
          icon={<User className="w-4 h-4 text-primary" />}
          currentUrl={profilePhotoUrl}
          onUploaded={(url) => setProfilePhotoUrl(url)}
          onRemove={() => setProfilePhotoUrl("")}
        />
        <ImageCard
          label={l.logo}
          hint={l.logoHint}
          icon={<Building2 className="w-4 h-4 text-primary" />}
          currentUrl={logoUrl}
          onUploaded={(url) => setLogoUrl(url)}
          onRemove={() => setLogoUrl("")}
        />
      </div>

      <ImageCard
        label={l.cover}
        hint={l.coverHint}
        icon={<ImageIcon className="w-4 h-4 text-primary" />}
        currentUrl={coverUrl}
        onUploaded={(url) => setCoverUrl(url)}
        onRemove={() => setCoverUrl("")}
        tall
      />

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-destructive/10 text-destructive"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {l.save}
        </Button>
      </div>
    </div>
  );
}

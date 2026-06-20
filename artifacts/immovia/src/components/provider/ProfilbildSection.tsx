import { useState, useEffect, useRef } from "react";
import { Loader2, User, Building2, ImageIcon, Camera } from "lucide-react";

const L: Record<string, Record<string, string>> = {
  de: {
    titleIndividual: "Profilbild",
    titleCompany: "Firmenlogo",
    titleCombined: "Profilbild & Logo",
    profilePic: "Profilbild",
    profilePicHint: "Klicken zum Ändern — JPG, PNG, max. 5 MB",
    logo: "Firmenlogo",
    logoHint: "Klicken zum Ändern — JPG, PNG, max. 5 MB",
    cover: "Titelbild",
    coverHint: "Klicken zum Ändern — Breites Format, JPG/PNG, max. 5 MB",
    saved: "Gespeichert.",
    error: "Fehler beim Hochladen.",
    typeError: "Nur Bilddateien erlaubt.",
    sizeError: "Maximale Dateigrösse: 5 MB.",
  },
  en: {
    titleIndividual: "Profile Photo",
    titleCompany: "Company Logo",
    titleCombined: "Profile Photo & Logo",
    profilePic: "Profile photo",
    profilePicHint: "Click to change — JPG, PNG, max 5 MB",
    logo: "Company logo",
    logoHint: "Click to change — JPG, PNG, max 5 MB",
    cover: "Cover image",
    coverHint: "Click to change — wide format, JPG/PNG, max 5 MB",
    saved: "Saved.",
    error: "Upload failed.",
    typeError: "Only image files are allowed.",
    sizeError: "Maximum file size: 5 MB.",
  },
  sq: {
    titleIndividual: "Foto Profili",
    titleCompany: "Logo e Kompanisë",
    titleCombined: "Foto & Logo",
    profilePic: "Foto profili",
    profilePicHint: "Klikoni për të ndryshuar — JPG, PNG, max 5 MB",
    logo: "Logo e kompanisë",
    logoHint: "Klikoni për të ndryshuar — JPG, PNG, max 5 MB",
    cover: "Foto kryesore",
    coverHint: "Klikoni për të ndryshuar — format i gjerë, JPG/PNG, max 5 MB",
    saved: "U ruajt.",
    error: "Ngarkimi dështoi.",
    typeError: "Lejohen vetëm skedarë imazhi.",
    sizeError: "Madhësia maksimale: 5 MB.",
  },
  fr: {
    titleIndividual: "Photo de profil",
    titleCompany: "Logo de l'entreprise",
    titleCombined: "Photo & Logo",
    profilePic: "Photo de profil",
    profilePicHint: "Cliquez pour changer — JPG, PNG, max 5 Mo",
    logo: "Logo de l'entreprise",
    logoHint: "Cliquez pour changer — JPG, PNG, max 5 Mo",
    cover: "Image de couverture",
    coverHint: "Cliquez pour changer — format large, JPG/PNG, max 5 Mo",
    saved: "Enregistré.",
    error: "Échec du téléchargement.",
    typeError: "Seules les images sont autorisées.",
    sizeError: "Taille maximale : 5 Mo.",
  },
};

interface ClickableImageProps {
  currentUrl: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  tall?: boolean;
  onUploaded: (url: string) => void;
  errorTypeMsg: string;
  errorSizeMsg: string;
  errorUploadMsg: string;
}

function ClickableImage({
  currentUrl,
  label,
  hint,
  icon,
  tall,
  onUploaded,
  errorTypeMsg,
  errorSizeMsg,
  errorUploadMsg,
}: ClickableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError(errorTypeMsg); return; }
    if (file.size > 5 * 1024 * 1024) { setError(errorSizeMsg); return; }
    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) throw new Error();
      const { uploadURL, objectPath } = await res.json() as { uploadURL: string; objectPath: string };
      const put = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error();
      onUploaded(`/api/storage${objectPath}`);
    } catch {
      setError(errorUploadMsg);
    } finally {
      setUploading(false);
    }
  };

  const containerClass = tall
    ? "relative w-full h-36 rounded-xl overflow-hidden bg-muted border border-border cursor-pointer group"
    : "relative w-28 h-28 rounded-2xl overflow-hidden bg-muted border border-border cursor-pointer group";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>

      <button
        type="button"
        className={`${containerClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {tall
              ? <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              : <User className="w-10 h-10 text-muted-foreground/30" />}
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface Props {
  language: string;
  accountSubtype?: string | null;
}

export default function ProfilbildSection({ language, accountSubtype }: Props) {
  const l = L[language] ?? L.de;

  const isCompany = accountSubtype === "company";
  const isIndividual = accountSubtype === "individual";
  const sectionTitle = isCompany ? l.titleCompany : isIndividual ? l.titleIndividual : l.titleCombined;

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  const autosave = async (patch: Record<string, string>) => {
    setSaveMsg(null);
    try {
      const r = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error();
      setSaveMsg({ type: "ok", text: l.saved });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg({ type: "err", text: l.error });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold">{sectionTitle}</h2>

      {isCompany ? (
        <ClickableImage
          label={l.logo}
          hint={l.logoHint}
          icon={<Building2 className="w-4 h-4 text-primary" />}
          currentUrl={logoUrl}
          errorTypeMsg={l.typeError}
          errorSizeMsg={l.sizeError}
          errorUploadMsg={l.error}
          onUploaded={(url) => { setLogoUrl(url); void autosave({ logoUrl: url }); }}
        />
      ) : isIndividual ? (
        <ClickableImage
          label={l.profilePic}
          hint={l.profilePicHint}
          icon={<User className="w-4 h-4 text-primary" />}
          currentUrl={profilePhotoUrl}
          errorTypeMsg={l.typeError}
          errorSizeMsg={l.sizeError}
          errorUploadMsg={l.error}
          onUploaded={(url) => { setProfilePhotoUrl(url); void autosave({ profilePhoto: url }); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClickableImage
            label={l.profilePic}
            hint={l.profilePicHint}
            icon={<User className="w-4 h-4 text-primary" />}
            currentUrl={profilePhotoUrl}
            errorTypeMsg={l.typeError}
            errorSizeMsg={l.sizeError}
            errorUploadMsg={l.error}
            onUploaded={(url) => { setProfilePhotoUrl(url); void autosave({ profilePhoto: url }); }}
          />
          <ClickableImage
            label={l.logo}
            hint={l.logoHint}
            icon={<Building2 className="w-4 h-4 text-primary" />}
            currentUrl={logoUrl}
            errorTypeMsg={l.typeError}
            errorSizeMsg={l.sizeError}
            errorUploadMsg={l.error}
            onUploaded={(url) => { setLogoUrl(url); void autosave({ logoUrl: url }); }}
          />
        </div>
      )}

      <ClickableImage
        label={l.cover}
        hint={l.coverHint}
        icon={<ImageIcon className="w-4 h-4 text-primary" />}
        currentUrl={coverUrl}
        tall
        errorTypeMsg={l.typeError}
        errorSizeMsg={l.sizeError}
        errorUploadMsg={l.error}
        onUploaded={(url) => { setCoverUrl(url); void autosave({ coverImageUrl: url }); }}
      />

      {saveMsg && (
        <div className={`p-3 rounded-lg text-sm ${saveMsg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-destructive/10 text-destructive"}`}>
          {saveMsg.text}
        </div>
      )}
    </div>
  );
}

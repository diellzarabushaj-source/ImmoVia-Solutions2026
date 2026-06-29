import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";

const GRADIENT = "linear-gradient(135deg,#0d2151 0%,#1a3a6e 60%,#1e4b8a 100%)";

export default function Profile() {
  const { user, loading, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    bio: "",
    avatarUrl: "",
    companyName: "",
    website: "",
    licenseNumber: "",
    yearsExperience: "",
    serviceTypes: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (user) {
      const parts = user.fullName.trim().split(/\s+/);
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ");
      setForm({
        firstName,
        lastName,
        phone: user.phone ?? "",
        city: user.city ?? "",
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl ?? "",
        companyName: user.companyName ?? "",
        website: user.website ?? "",
        licenseNumber: user.licenseNumber ?? "",
        yearsExperience: user.yearsExperience?.toString() ?? "",
        serviceTypes: user.serviceTypes?.join(", ") ?? "",
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError(t.portfolio.errorImageOnly);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError(t.portfolio.errorTooLarge);
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) { setAvatarError("Upload failed"); return; }
      const { uploadURL, objectPath } = await res.json() as { uploadURL: string; objectPath: string };
      const putRes = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) { setAvatarError("Upload to storage failed"); return; }
      setForm(f => ({ ...f, avatarUrl: `/api/storage${objectPath}` }));
    } catch {
      setAvatarError("Network error");
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isContractor = isServiceProvider(user);
  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ") || user.fullName;
      const updates: Record<string, unknown> = {
        fullName,
        phone: form.phone,
        city: form.city,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        companyName: form.companyName || null,
      };
      if (isContractor) {
        updates.website = form.website;
        updates.licenseNumber = form.licenseNumber;
        if (form.yearsExperience) {
          const n = parseInt(form.yearsExperience, 10);
          if (!Number.isNaN(n)) updates.yearsExperience = n;
        }
        updates.serviceTypes = form.serviceTypes.split(",").map(s => s.trim()).filter(Boolean);
      }
      await updateProfile(updates);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || user.fullName;
  const initials = [form.firstName[0], form.lastName[0]].filter(Boolean).join("").toUpperCase()
    || user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

      {/* ── Hero header ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-border/40 mb-6">
        {/* Cover strip */}
        <div className="h-28" style={{ background: GRADIENT }} />

        {/* Avatar + identity row */}
        <div className="bg-white px-5 pb-5">
          <div className="flex items-end gap-4 -mt-12 mb-3">
            {/* Clickable avatar */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-primary/10 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              title={t.profile.clickToChange}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : form.avatarUrl ? (
                <>
                  <img src={form.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-primary select-none">{initials}</span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            {/* Name / email / role */}
            <div className="pb-1 min-w-0">
              <p className="font-bold text-lg leading-tight truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <span className="inline-block mt-1.5 text-xs bg-primary/10 text-primary font-medium px-2.5 py-0.5 rounded-full">
                {isContractor ? t.auth.roleContractor : t.auth.roleHomeowner}
              </span>
            </div>
          </div>

          {/* Hint + error */}
          <p className="text-xs text-muted-foreground">{t.profile.clickToChange}</p>
          {avatarError && (
            <p className="text-xs text-destructive mt-1">{avatarError}</p>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">

        {/* ── Personal information ── */}
        <Card className="p-5 md:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {t.profile.personalInfo}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{t.profile.firstName}</Label>
                <Input id="firstName" value={form.firstName} onChange={update("firstName")} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{t.profile.lastName}</Label>
                <Input id="lastName" value={form.lastName} onChange={update("lastName")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-normal">E-Mail</Label>
              <Input value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t.auth.phone}</Label>
                <Input id="phone" value={form.phone} onChange={update("phone")} placeholder="+41 79 123 45 67" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">{t.auth.city}</Label>
                <Input id="city" value={form.city} onChange={update("city")} placeholder="Zürich, CH" />
              </div>
            </div>
          </div>
        </Card>

        {/* ── Company & bio ── */}
        <Card className="p-5 md:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {isContractor ? t.profile.businessInfo : t.profile.companyNameOptional}
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">
                {isContractor ? t.auth.companyName : t.profile.companyNameOptional}
              </Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={update("companyName")}
                placeholder={isContractor ? "" : "Müller AG"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">{t.profile.bio}</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={update("bio")}
                rows={3}
                placeholder={t.profile.bioPlaceholder}
              />
            </div>
          </div>
        </Card>

        {/* ── Business details (contractor only) ── */}
        {isContractor && (
          <Card className="p-5 md:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {t.profile.businessInfo}
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="serviceTypes">{t.auth.serviceTypes}</Label>
                <Textarea
                  id="serviceTypes"
                  value={form.serviceTypes}
                  onChange={update("serviceTypes")}
                  rows={2}
                  placeholder={t.auth.serviceTypesPlaceholder}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="yearsExperience">{t.profile.yearsExperience}</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    value={form.yearsExperience}
                    onChange={update("yearsExperience")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">{t.profile.website}</Label>
                  <Input id="website" value={form.website} onChange={update("website")} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber">{t.profile.licenseNumber}</Label>
                <Input id="licenseNumber" value={form.licenseNumber} onChange={update("licenseNumber")} />
              </div>
            </div>
          </Card>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}

        {/* ── Save row ── */}
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={saving} data-testid="button-save-profile">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.profile.save}
          </Button>
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {t.profile.saved}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

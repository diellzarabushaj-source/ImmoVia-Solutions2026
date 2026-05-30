import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, isServiceProvider } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/language-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PhotoUploader } from "@/components/photo-uploader";

export default function Profile() {
  const { user, loading, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    fullName: "",
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
      setForm({
        fullName: user.fullName,
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

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isContractor = isServiceProvider(user);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        fullName: form.fullName,
        phone: form.phone,
        city: form.city,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
      };
      if (isContractor) {
        updates.companyName = form.companyName;
        updates.website = form.website;
        updates.licenseNumber = form.licenseNumber;
        if (form.yearsExperience) {
          const n = parseInt(form.yearsExperience, 10);
          if (!Number.isNaN(n)) updates.yearsExperience = n;
        }
        updates.serviceTypes = form.serviceTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
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

  return (
    <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">{t.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {isContractor ? t.auth.roleContractor : t.auth.roleHomeowner}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="fullName">{t.auth.fullName}</Label>
            <Input id="fullName" value={form.fullName} onChange={update("fullName")} required />
          </div>

          <div>
            <Label>{t.profile.uploadPhoto}</Label>
            <div className="mt-1.5">
              <PhotoUploader
                label=""
                hint={t.profile.uploadHint}
                value={[]}
                onChange={(paths) => {
                  if (paths[0]) setForm((f) => ({ ...f, avatarUrl: `/api/storage${paths[0]}` }));
                }}
              />
            </div>
            <div className="mt-3">
              <Label htmlFor="avatarUrl" className="text-xs text-muted-foreground font-normal">{t.profile.orPasteUrl}</Label>
              <Input id="avatarUrl" value={form.avatarUrl} onChange={update("avatarUrl")} placeholder="https://..." className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">{t.profile.avatarHint}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">{t.auth.phone}</Label>
              <Input id="phone" value={form.phone} onChange={update("phone")} />
            </div>
            <div>
              <Label htmlFor="city">{t.auth.city}</Label>
              <Input id="city" value={form.city} onChange={update("city")} />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">{t.profile.bio}</Label>
            <Textarea id="bio" value={form.bio} onChange={update("bio")} rows={3} placeholder={t.profile.bioPlaceholder} />
          </div>

          {isContractor && (
            <>
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                  {t.profile.businessInfo}
                </h3>
              </div>
              <div>
                <Label htmlFor="companyName">{t.auth.companyName}</Label>
                <Input id="companyName" value={form.companyName} onChange={update("companyName")} />
              </div>
              <div>
                <Label htmlFor="serviceTypes">{t.auth.serviceTypes}</Label>
                <Textarea id="serviceTypes" value={form.serviceTypes} onChange={update("serviceTypes")} rows={2} placeholder={t.auth.serviceTypesPlaceholder} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearsExperience">{t.profile.yearsExperience}</Label>
                  <Input id="yearsExperience" type="number" min="0" value={form.yearsExperience} onChange={update("yearsExperience")} />
                </div>
                <div>
                  <Label htmlFor="website">{t.profile.website}</Label>
                  <Input id="website" value={form.website} onChange={update("website")} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label htmlFor="licenseNumber">{t.profile.licenseNumber}</Label>
                <Input id="licenseNumber" value={form.licenseNumber} onChange={update("licenseNumber")} />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t.profile.saved}
            </div>
          )}

          <Button type="submit" disabled={saving} data-testid="button-save-profile">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.profile.save}
          </Button>
        </form>
      </Card>
    </div>
  );
}

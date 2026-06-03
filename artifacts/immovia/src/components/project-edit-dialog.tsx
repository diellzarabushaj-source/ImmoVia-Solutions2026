import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/lib/language-context";
import type { ProviderProject } from "@/lib/billing-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Hammer, Sofa, Wrench, Home as HomeIcon, Crown, Sparkles, Layers,
  Zap, Paintbrush, ChefHat, Leaf, SquareStack, HelpCircle, Loader2,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import type { Lang } from "@/lib/categories";
import { validateOtherTag, otherTagErrorMessage, sanitizeOtherTag } from "@/lib/validateOtherTag";
import { PhotoUploader } from "@/components/photo-uploader";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  renovation: Hammer,
  painting: Paintbrush,
  electrical: Zap,
  plumbing: Wrench,
  kitchen: ChefHat,
  flooring: SquareStack,
  interior_design: Sofa,
  cleaning: Leaf,
  other: HelpCircle,
};

interface ProjectEditDialogProps {
  project: ProviderProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ProjectEditDialog({ project, open, onOpenChange, onSaved }: ProjectEditDialogProps) {
  const { t, language } = useLanguage();
  const { categories } = useCategories("project");
  const l = t.customer;
  const [projectPhotos, setProjectPhotos] = useState<string[]>(project.photos ?? []);
  const [otherTagError, setOtherTagError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formSchema = z.object({
    title: z.string().trim().min(3, { message: "Project title is required" }).max(120),
    projectType: z.string().min(1, { message: "Project type is required" }),
    subcategory: z.string().optional(),
    subcategoryOtherText: z.string().max(40).optional(),
    size: z.enum(["small", "medium", "large", "premium"]),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    city: z.string().min(2, { message: "City is required" }),
    budget: z.string().optional(),
    timeline: z.string().optional(),
  });

  const normalizedSize = (["small", "medium", "large", "premium"] as const).includes(
    project.size as "small" | "medium" | "large" | "premium",
  )
    ? (project.size as "small" | "medium" | "large" | "premium")
    : "medium";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project.title ?? "",
      projectType: project.projectType ?? "",
      subcategory: project.subcategory ?? "",
      subcategoryOtherText: project.subcategoryOtherText ?? "",
      size: normalizedSize,
      description: project.description ?? "",
      city: project.city ?? "",
      budget: project.budget ?? "",
      timeline: project.timeline ?? "",
    },
  });

  const categoryOptions = categories.map((cat) => ({
    id: cat.key,
    icon: CATEGORY_ICONS[cat.key] ?? HelpCircle,
    label: cat.label,
  }));
  const selectedCategoryData = categories.find((c) => c.key === form.watch("projectType"));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.subcategory === "other") {
      const result = validateOtherTag(values.subcategoryOtherText ?? "");
      if (!result.ok) {
        setOtherTagError(otherTagErrorMessage(result.error, language as Lang));
        return;
      }
      values.subcategoryOtherText = result.clean;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/customer/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...values, photos: projectPhotos }),
      });
      if (!res.ok) throw new Error("Update failed");
      onSaved();
      onOpenChange(false);
    } catch {
      setServerError(t.common.error ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{l.editProjectTitle}</DialogTitle>
          <DialogDescription>{l.editProjectDesc}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.projectForm.projectTitle}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.projectForm.projectTitlePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.projectForm.step2}</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryOptions.map((type) => (
                      <div
                        key={type.id}
                        className={`cursor-pointer rounded-lg border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                          field.value === type.id
                            ? "border-primary bg-secondary/50 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                        onClick={() => { field.onChange(type.id); form.setValue("subcategory", ""); }}
                      >
                        <type.icon className={`w-6 h-6 ${field.value === type.id ? "text-primary" : ""}`} />
                        <span className="font-medium text-xs text-center">{type.label}</span>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCategoryData && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {language === "de" ? "Genauere Leistung (optional)" :
                   language === "sq" ? "Shërbim specifik (opsional)" :
                   language === "fr" ? "Service précis (optionnel)" :
                   "More specific service (optional)"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryData.subcategories.map((sub) => {
                    const isSelected = form.watch("subcategory") === sub.key;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => {
                          const newVal = isSelected ? "" : sub.key;
                          form.setValue("subcategory", newVal);
                          if (newVal !== "other") {
                            form.setValue("subcategoryOtherText", "");
                            setOtherTagError(null);
                          }
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
                {form.watch("subcategory") === "other" && (
                  <div className="mt-3 space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">
                      {t.projectForm.otherTagLabel}
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      placeholder={t.projectForm.otherTagPlaceholder}
                      value={form.watch("subcategoryOtherText") ?? ""}
                      onChange={(e) => {
                        const sanitized = sanitizeOtherTag(e.target.value);
                        form.setValue("subcategoryOtherText", sanitized);
                        if (sanitized.length >= 3) {
                          const result = validateOtherTag(sanitized);
                          setOtherTagError(result.ok ? null : otherTagErrorMessage(result.error, language as Lang));
                        } else {
                          setOtherTagError(null);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">{t.projectForm.otherTagHint}</p>
                    {otherTagError && <p className="text-xs text-destructive">{otherTagError}</p>}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.projectSize.title}</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { id: "small", icon: HomeIcon, label: t.projectSize.small, desc: t.projectSize.smallDesc },
                      { id: "medium", icon: Layers, label: t.projectSize.medium, desc: t.projectSize.mediumDesc },
                      { id: "large", icon: Sparkles, label: t.projectSize.large, desc: t.projectSize.largeDesc },
                      { id: "premium", icon: Crown, label: t.projectSize.premium, desc: t.projectSize.premiumDesc },
                    ] as const).map((s) => (
                      <div
                        key={s.id}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                          field.value === s.id
                            ? "border-primary bg-secondary/50"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => field.onChange(s.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <s.icon className={`w-5 h-5 ${field.value === s.id ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="font-semibold text-sm">{s.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.projectForm.city}</FormLabel>
                  <FormControl>
                    <Input placeholder="Zurich, CH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.projectForm.description}</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PhotoUploader
              label={t.projectForm.projectPhotos}
              hint={t.projectForm.projectPhotosHint}
              multiple={true}
              value={projectPhotos}
              onChange={setProjectPhotos}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.projectForm.budget}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="under-10k">&lt; CHF 10,000</SelectItem>
                        <SelectItem value="10k-50k">CHF 10,000 - 50,000</SelectItem>
                        <SelectItem value="50k-100k">CHF 50,000 - 100,000</SelectItem>
                        <SelectItem value="100k-500k">CHF 100,000 - 500,000</SelectItem>
                        <SelectItem value="over-500k">&gt; CHF 500,000</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.projectForm.timeline}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asap">As soon as possible</SelectItem>
                        <SelectItem value="1-3-months">1-3 months</SelectItem>
                        <SelectItem value="3-6-months">3-6 months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                {l.cancel}
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{l.saving}</>
                ) : (
                  l.saveChanges
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

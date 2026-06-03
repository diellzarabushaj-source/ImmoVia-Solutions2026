import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { useCreateCompany } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { CheckCircle2, User, Building2 } from "lucide-react";
import type { Lang } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { validateOtherTag, otherTagErrorMessage, sanitizeOtherTag, buildCustomServiceTag } from "@/lib/validateOtherTag";
import { PhotoUploader } from "@/components/photo-uploader";

export default function RegisterCompany() {
  const { t, language } = useLanguage();
  const { categories } = useCategories("service");
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const createCompany = useCreateCompany();
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [otherTagErrors, setOtherTagErrors] = useState<Record<string, string>>({});

  const formSchema = z.object({
    companyName: z.string().min(2, { message: "Company name is required" }),
    contactName: z.string().min(2, { message: "Contact name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(5, { message: "Phone number is required" }),
    city: z.string().min(2, { message: "City is required" }),
    serviceTypes: z.array(z.string()).min(1, { message: "Select at least one service type" }),
    description: z.string().optional(),
    website: z.string().optional(),
    licenseNumber: z.string().optional(),
    yearsExperience: z.coerce.number().optional(),
    workerType: z.enum(["individual", "company"]).default("company"),
    hourlyRate: z.coerce.number().optional(),
    profilePhoto: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      city: "",
      serviceTypes: [],
      description: "",
      website: "",
      licenseNumber: "",
      yearsExperience: undefined,
      workerType: "company",
      hourlyRate: undefined,
      profilePhoto: undefined,
    },
  });

  const workerType = form.watch("workerType");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const customServiceTags: string[] = [];
    const errors: Record<string, string> = {};
    for (const [catKey, text] of Object.entries(otherTexts)) {
      const result = validateOtherTag(text);
      if (result.ok) {
        customServiceTags.push(buildCustomServiceTag(catKey, result.clean));
      } else {
        errors[catKey] = otherTagErrorMessage(result.error, language as Lang);
      }
    }
    if (Object.keys(errors).length > 0) {
      setOtherTagErrors(errors);
      return;
    }
    setOtherTagErrors({});
    createCompany.mutate({
      data: { ...values, customServiceTags } as never
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
      }
    });
  };

  const servicesList = categories.map(cat => ({
    id: cat.key,
    label: cat.label,
  }));

  if (isSubmitted) {
    const subtext: Record<string, string> = {
      sq: "Aplikimi juaj u pranua dhe është duke u shqyrtuar. Do t'ju kontaktojmë së shpejti.",
      en: "Your application has been received and is under review. We will contact you shortly.",
      de: "Ihre Bewerbung wurde erhalten und wird geprüft. Wir melden uns in Kürze bei Ihnen.",
      fr: "Votre candidature a été reçue et est en cours d'examen. Nous vous contacterons prochainement.",
    };
    const nextStepsLabel: Record<string, string> = {
      sq: "Hapat e Ardhshëm",
      en: "Next Steps",
      de: "Nächste Schritte",
      fr: "Prochaines étapes",
    };
    const nextSteps: Record<string, string[]> = {
      sq: [
        "Ekipi ynë do ta shqyrtojë profilin tuaj brenda 48 orëve.",
        "Pasi të miratohet, kompania juaj do të jetë e dukshme në drejtori.",
        "Klientët mund t'ju kontaktojnë dhe mund të dërgoni oferta për projekte.",
      ],
      en: [
        "Our team will review your profile within 48 hours.",
        "Once approved, your company will be visible in the directory.",
        "Clients can contact you and you can submit offers on projects.",
      ],
      de: [
        "Unser Team prüft Ihr Profil innerhalb von 48 Stunden.",
        "Nach Genehmigung wird Ihre Firma im Verzeichnis sichtbar sein.",
        "Kunden können Sie kontaktieren und Sie können Angebote auf Projekte einreichen.",
      ],
      fr: [
        "Notre équipe examinera votre profil dans les 48 heures.",
        "Une fois approuvée, votre société sera visible dans l'annuaire.",
        "Les clients pourront vous contacter et vous pourrez soumettre des offres sur des projets.",
      ],
    };
    const steps = nextSteps[language] ?? nextSteps.de;

    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-sm"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center max-w-lg"
        >
          <h2 className="text-3xl font-serif font-bold mb-3">{t.companyForm.success}</h2>
          <p className="text-muted-foreground text-sm mb-10">
            {subtext[language] ?? subtext.de}
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {nextStepsLabel[language] ?? nextStepsLabel.de}
            </h3>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" onClick={() => setLocation("/companies")}>
              {language === "sq" && "Shiko Firmat"}
              {language === "en" && "Browse Companies"}
              {language === "de" && "Firmen entdecken"}
              {language === "fr" && "Découvrir les entreprises"}
            </Button>
            <Button onClick={() => setLocation("/")}>
              {t.nav.home}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">{t.companyForm.title}</h1>
        <p className="text-muted-foreground">Join our network of verified professionals</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Worker type toggle */}
            <FormField
              control={form.control}
              name="workerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.companyForm.workerType ?? "I am a"}</FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {[
                      { value: "individual", icon: User, label: t.companyForm.individual ?? "Individual Professional" },
                      { value: "company", icon: Building2, label: t.companyForm.company ?? "Company / Firm" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                          field.value === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <opt.icon className="h-4 w-4" /> {opt.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.companyName}</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Construction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.contactName}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.email}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.phone}</FormLabel>
                    <FormControl>
                      <Input placeholder="+41 XX XXX XX XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.companyForm.city}</FormLabel>
                  <FormControl>
                    <Input placeholder="Zurich, CH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceTypes"
              render={() => (
                <FormItem>
                  <div className="mb-3">
                    <FormLabel className="text-base">{t.companyForm.services}</FormLabel>
                    <FormDescription className="text-xs mt-1">
                      {language === "de" ? "Wählen Sie Hauptkategorien und optional Spezialgebiete" :
                       language === "sq" ? "Zgjidhni kategoritë kryesore dhe opsionalisht nënkategoritë" :
                       language === "fr" ? "Sélectionnez les catégories principales et optionnellement les sous-catégories" :
                       "Select main categories and optionally sub-categories"}
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <FormField
                        key={cat.key}
                        control={form.control}
                        name="serviceTypes"
                        render={({ field }) => {
                          const isChecked = field.value?.includes(cat.key);
                          return (
                            <div className={`rounded-lg border transition-all ${isChecked ? "border-primary/40 bg-primary/3" : "border-border"}`}>
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3">
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, cat.key]);
                                      } else {
                                        const tagKeys = cat.subcategories.map(t => t.key);
                                        field.onChange(field.value?.filter((v: string) => v !== cat.key && !tagKeys.includes(v)));
                                        setOtherTexts(prev => { const next = { ...prev }; delete next[cat.key]; return next; });
                                        setOtherTagErrors(prev => { const next = { ...prev }; delete next[cat.key]; return next; });
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium cursor-pointer w-full">
                                  {cat.label}
                                </FormLabel>
                              </FormItem>
                              {isChecked && (
                                <div className="px-3 pb-3 space-y-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {cat.subcategories.map(tag => {
                                      const isOtherTag = tag.key === "other";
                                      const isTagSelected = isOtherTag
                                        ? cat.key in otherTexts
                                        : field.value?.includes(tag.key);
                                      return (
                                        <button
                                          key={tag.key}
                                          type="button"
                                          onClick={() => {
                                            if (isOtherTag) {
                                              if (isTagSelected) {
                                                setOtherTexts(prev => {
                                                  const next = { ...prev };
                                                  delete next[cat.key];
                                                  return next;
                                                });
                                                setOtherTagErrors(prev => {
                                                  const next = { ...prev };
                                                  delete next[cat.key];
                                                  return next;
                                                });
                                              } else {
                                                setOtherTexts(prev => ({ ...prev, [cat.key]: "" }));
                                              }
                                            } else {
                                              if (isTagSelected) {
                                                field.onChange(field.value.filter((v: string) => v !== tag.key));
                                              } else {
                                                field.onChange([...field.value, tag.key]);
                                              }
                                            }
                                          }}
                                          className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                                            isTagSelected
                                              ? "bg-primary/10 border-primary text-primary font-medium"
                                              : "border-border text-muted-foreground hover:border-primary/40"
                                          }`}
                                        >
                                          {tag.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {cat.key in otherTexts && (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        maxLength={40}
                                        placeholder={t.projectForm.otherTagPlaceholder}
                                        value={otherTexts[cat.key]}
                                        onChange={(e) => {
                                          const sanitized = sanitizeOtherTag(e.target.value);
                                          setOtherTexts(prev => ({ ...prev, [cat.key]: sanitized }));
                                          if (sanitized.length >= 3) {
                                            const result = validateOtherTag(sanitized);
                                            setOtherTagErrors(prev => ({
                                              ...prev,
                                              [cat.key]: result.ok ? "" : otherTagErrorMessage(result.error, language as Lang),
                                            }));
                                          } else {
                                            setOtherTagErrors(prev => ({ ...prev, [cat.key]: "" }));
                                          }
                                        }}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                      />
                                      <p className="text-xs text-muted-foreground">{t.projectForm.otherTagHint}</p>
                                      {otherTagErrors[cat.key] && (
                                        <p className="text-xs text-destructive">{otherTagErrors[cat.key]}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.yearsExperience}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.licenseNumber}</FormLabel>
                    <FormControl>
                      <Input placeholder="LIC-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hourly rate — shown only for individual workers */}
            {workerType === "individual" && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.companyForm.hourlyRate ?? "Hourly Rate (€/hr)"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                        <Input
                          type="number"
                          min="1"
                          placeholder="35"
                          className="pl-7"
                          {...field}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>{t.companyForm.hourlyRateDesc ?? "Your typical hourly rate in EUR"}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.companyForm.website}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com" {...field} />
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
                  <FormLabel>{t.companyForm.description}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your company and expertise..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile photo */}
            <div className="space-y-2">
              <PhotoUploader
                label={t.companyForm.profilePhotoLabel ?? "Profile / Company Photo"}
                hint="JPG or PNG, max 10MB"
                multiple={false}
                value={form.watch("profilePhoto") ? [form.watch("profilePhoto")!] : []}
                onChange={(paths) => form.setValue("profilePhoto", paths[0])}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={createCompany.isPending}
            >
              {createCompany.isPending ? t.common.loading : t.companyForm.submit}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

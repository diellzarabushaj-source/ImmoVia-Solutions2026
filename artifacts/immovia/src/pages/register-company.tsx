import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { useCreateCompany, useCreateRegistrationCheckout } from "@workspace/api-client-react";
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
import { CheckCircle2, User, Building2, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import type { Lang } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { validateOtherTag, otherTagErrorMessage, sanitizeOtherTag, buildCustomServiceTag } from "@/lib/validateOtherTag";
import { PhotoUploader } from "@/components/photo-uploader";

export default function RegisterCompany() {
  const { t, language } = useLanguage();
  const { categories } = useCategories("service");
  const [, setLocation] = useLocation();
  const [submittedCompany, setSubmittedCompany] = useState<{ id: number; email: string } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const createCompany = useCreateCompany();
  const createCheckout = useCreateRegistrationCheckout();
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
      onSuccess: (company) => {
        setSubmittedCompany({ id: company.id, email: values.email });
      }
    });
  };

  const handlePayNow = async () => {
    if (!submittedCompany) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const result = await createCheckout.mutateAsync({
        id: submittedCompany.id,
        data: { email: submittedCompany.email },
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setPaymentError(
        language === "sq" ? "Ndodhi një gabim. Ju lutemi provoni përsëri." :
        language === "de" ? "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." :
        language === "fr" ? "Une erreur s'est produite. Veuillez réessayer." :
        "An error occurred. Please try again."
      );
      setPaymentLoading(false);
    }
  };

  const servicesList = categories.map(cat => ({
    id: cat.key,
    label: cat.label,
  }));

  if (submittedCompany) {
    const headline: Record<string, string> = {
      sq: "Aplikimi u regjistrua!",
      en: "Application submitted!",
      de: "Bewerbung eingereicht!",
      fr: "Candidature soumise\u00a0!",
    };
    const subtext: Record<string, string> = {
      sq: "Hapi i fundit: paguani tarifën e regjistrimit prej CHF\u00a0149 për të aktivizuar profilin tuaj.",
      en: "One last step: pay the CHF\u00a0149 registration fee to activate your profile.",
      de: "Letzter Schritt: Zahlen Sie die Registrierungsgebühr von CHF\u00a0149, um Ihr Profil zu aktivieren.",
      fr: "Dernière étape\u00a0: payez les CHF\u00a0149 de frais d'inscription pour activer votre profil.",
    };
    const featureItems: Record<string, string[]> = {
      sq: [
        "Profili juaj shfaqet në drejtorinë e kontraktorëve",
        "Klientët mund t'ju kontaktojnë drejtpërdrejt",
        "Merrni njoftime për projekte të reja",
      ],
      en: [
        "Your profile appears in the contractor directory",
        "Clients can contact you directly",
        "Receive notifications for new projects",
      ],
      de: [
        "Ihr Profil erscheint im Verzeichnis",
        "Kunden können Sie direkt kontaktieren",
        "Benachrichtigungen über neue Projekte erhalten",
      ],
      fr: [
        "Votre profil apparaît dans l'annuaire",
        "Les clients peuvent vous contacter directement",
        "Recevez des notifications pour les nouveaux projets",
      ],
    };
    const payLabel: Record<string, string> = {
      sq: "Paguaj CHF 149 tani",
      en: "Pay CHF 149 now",
      de: "Jetzt CHF 149 bezahlen",
      fr: "Payer CHF 149 maintenant",
    };
    const secureLabel: Record<string, string> = {
      sq: "Pagesë e sigurt me Stripe",
      en: "Secure payment via Stripe",
      de: "Sichere Zahlung über Stripe",
      fr: "Paiement sécurisé via Stripe",
    };
    const features = featureItems[language] ?? featureItems.en;

    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">{headline[language] ?? headline.en}</h2>
            <p className="text-muted-foreground text-sm">{subtext[language] ?? subtext.en}</p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm mb-4">
            <div className="bg-[#1a3a6e] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 opacity-80" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {language === "sq" ? "Tarifë Regjistrimi" :
                   language === "de" ? "Registrierungsgebühr" :
                   language === "fr" ? "Frais d'inscription" :
                   "Registration Fee"}
                </span>
              </div>
              <span className="text-xl font-bold">CHF 149</span>
            </div>
            <div className="px-6 py-5 space-y-3">
              {features.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {paymentError && (
            <p className="text-sm text-red-600 text-center mb-3">{paymentError}</p>
          )}

          <Button
            size="lg"
            className="w-full bg-[#1a3a6e] hover:bg-[#0f2044]"
            onClick={handlePayNow}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {language === "sq" ? "Duke hapur..." : language === "de" ? "Öffnet..." : language === "fr" ? "Ouverture..." : "Opening..."}</span>
            ) : (
              payLabel[language] ?? payLabel.en
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {secureLabel[language] ?? secureLabel.en}
          </p>
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

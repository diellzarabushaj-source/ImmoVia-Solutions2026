import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
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
  FormDescription,
} from "@/components/ui/form";
import { User, Building2, Loader2, Check } from "lucide-react";
import { PlanCards } from "@/components/PlanCards";
import type { PlanType } from "@/components/PlanCards";
import type { Lang } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { validateOtherTag, otherTagErrorMessage, sanitizeOtherTag, buildCustomServiceTag } from "@/lib/validateOtherTag";
import { PhotoUploader } from "@/components/photo-uploader";


const L = {
  sq: {
    step1Title: "Zgjidhni Paketën Tuaj",
    step1Sub: "Zgjidhni nivelin e duhur për biznesin tuaj para se të vazhdoni.",
    step2Title: "Plotësoni Profilin Tuaj",
    step2Sub: "Këto të dhëna do të shfaqen në drejtorinë e profesionistëve.",
    next: "Vazhdoni",
    back: "Kthehu",
    stepOf: (a: number, b: number) => `Hapi ${a} nga ${b}`,
    firstName: "Emri",
    lastName: "Mbiemri",
    companyNameLabel: "Emri i Kompanisë",
    contactPersonLabel: "Personi i Kontaktit",
    plans: {
      basic: { name: "Basic", tag: "Fillestare", features: ["Listim standard në drejtori", "Faqe profili bazike", "Mbështetje me email"] },
      professional: { name: "Professional", tag: "Rekomanduar", features: ["Gjithçka nga Basic", "Listim me përparësi", "Insignë e verifikuar", "Galeri portofoli"] },
      premium: { name: "Premium", tag: "Plotë", features: ["Gjithçka nga Professional", "Paraqitje kryesore në shtëpi", "Vendosje në krye të kërkimit", "Panel analitik"] },
    },
    regFee: "Tarifë regjistrimi njëherë: CHF 149",
    perMonth: "/muaj",
    chooseBtn: "Zgjidhni",
    chosenBtn: "Zgjedhur",
    workerType: "Jam",
    individual: "Profesionist Individual",
    company: "Kompani / Firmë",
  },
  en: {
    step1Title: "Choose Your Plan",
    step1Sub: "Select the level that fits your business before continuing.",
    step2Title: "Complete Your Profile",
    step2Sub: "This information will appear in the professional directory.",
    next: "Continue",
    back: "Back",
    stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    firstName: "First Name",
    lastName: "Last Name",
    companyNameLabel: "Company Name",
    contactPersonLabel: "Contact Person",
    plans: {
      basic: { name: "Basic", tag: "Starter", features: ["Standard directory listing", "Basic profile page", "Email support"] },
      professional: { name: "Professional", tag: "Recommended", features: ["Everything in Basic", "Priority listing", "Verified professional badge", "Portfolio gallery"] },
      premium: { name: "Premium", tag: "Complete", features: ["Everything in Professional", "Featured on homepage", "Top search placement", "Analytics dashboard"] },
    },
    regFee: "One-time registration fee: CHF 149",
    perMonth: "/mo",
    chooseBtn: "Select",
    chosenBtn: "Selected",
    workerType: "I am a",
    individual: "Individual Service Provider",
    company: "Company / Firm",
  },
  de: {
    step1Title: "Paket Wählen",
    step1Sub: "Wählen Sie die passende Stufe für Ihr Unternehmen, bevor Sie fortfahren.",
    step2Title: "Profil Vervollständigen",
    step2Sub: "Diese Angaben erscheinen im Verzeichnis der Fachleute.",
    next: "Weiter",
    back: "Zurück",
    stepOf: (a: number, b: number) => `Schritt ${a} von ${b}`,
    firstName: "Vorname",
    lastName: "Nachname",
    companyNameLabel: "Firmenname",
    contactPersonLabel: "Kontaktperson",
    plans: {
      basic: { name: "Basic", tag: "Einsteiger", features: ["Standard-Verzeichniseintrag", "Einfache Profilseite", "E-Mail-Support"] },
      professional: { name: "Professional", tag: "Empfohlen", features: ["Alles aus Basic", "Priorisierter Eintrag", "Verifizierter Profi-Badge", "Portfolio-Galerie"] },
      premium: { name: "Premium", tag: "Komplett", features: ["Alles aus Professional", "Auf der Startseite hervorgehoben", "Spitzenplatzierung in der Suche", "Analyse-Dashboard"] },
    },
    regFee: "Einmalige Registrierungsgebühr: CHF 149",
    perMonth: "/Monat",
    chooseBtn: "Wählen",
    chosenBtn: "Gewählt",
    workerType: "Ich bin",
    individual: "Einzelne Fachkraft",
    company: "Unternehmen / Firma",
  },
  fr: {
    step1Title: "Choisissez Votre Forfait",
    step1Sub: "Sélectionnez le niveau adapté à votre activité avant de continuer.",
    step2Title: "Complétez Votre Profil",
    step2Sub: "Ces informations apparaîtront dans le répertoire des professionnels.",
    next: "Continuer",
    back: "Retour",
    stepOf: (a: number, b: number) => `Étape ${a} sur ${b}`,
    firstName: "Prénom",
    lastName: "Nom de famille",
    companyNameLabel: "Nom de la Société",
    contactPersonLabel: "Personne de Contact",
    plans: {
      basic: { name: "Basic", tag: "Débutant", features: ["Inscription standard dans l'annuaire", "Page de profil de base", "Assistance par e-mail"] },
      professional: { name: "Professional", tag: "Recommandé", features: ["Tout de Basic", "Inscription prioritaire", "Badge professionnel vérifié", "Galerie portfolio"] },
      premium: { name: "Premium", tag: "Complet", features: ["Tout de Professional", "Mis en avant sur la page d'accueil", "Placement en tête de recherche", "Tableau de bord analytique"] },
    },
    regFee: "Frais d'inscription uniques\u00a0: CHF 149",
    perMonth: "/mois",
    chooseBtn: "Choisir",
    chosenBtn: "Choisi",
    workerType: "Je suis",
    individual: "Prestataire individuel",
    company: "Entreprise / Firme",
  },
} as const;


export default function RegisterCompany() {
  const { t, language } = useLanguage();
  usePageMeta({
    title: "Als Dienstleister registrieren | ImmoVia365",
    description: "Registrieren Sie Ihr Unternehmen auf ImmoVia365 und erhalten Sie Anfragen von Auftraggebern für Renovierung, Bau und weitere Handwerksleistungen in der Schweiz.",
  });
  useStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Dienstleister registrieren", "item": `${APP_URL}/register-company` }
    ]
  });
  const lang = (language || "en") as keyof typeof L;
  const l = L[lang] ?? L.en;
  const { categories } = useCategories("service");
  const [, setLocation] = useLocation();
  const createCompany = useCreateCompany();

  const [step, setStep] = useState<1 | 2>(1);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [otherTagErrors, setOtherTagErrors] = useState<Record<string, string>>({});

  const formSchema = z
    .object({
      workerType: z.enum(["individual", "company"]).default("company"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      email: z.string().email(),
      phone: z.string().min(5),
      city: z.string().min(2),
      serviceTypes: z.array(z.string()).min(1),
      description: z.string().optional(),
      website: z.string().optional(),
      licenseNumber: z.string().optional(),
      yearsExperience: z.coerce.number().optional(),
      hourlyRate: z.coerce.number().optional(),
      profilePhoto: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.workerType === "individual") {
        if (!data.firstName || data.firstName.trim().length < 1) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: l.firstName, path: ["firstName"] });
        }
        if (!data.lastName || data.lastName.trim().length < 1) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: l.lastName, path: ["lastName"] });
        }
      } else {
        if (!data.companyName || data.companyName.trim().length < 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: l.companyNameLabel, path: ["companyName"] });
        }
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workerType: "company",
      firstName: "",
      lastName: "",
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
        errors[catKey] = otherTagErrorMessage(result.error, lang as Lang);
      }
    }
    if (Object.keys(errors).length > 0) {
      setOtherTagErrors(errors);
      return;
    }
    setOtherTagErrors({});

    const resolvedCompanyName =
      values.workerType === "individual"
        ? `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim()
        : (values.companyName ?? "");

    const resolvedContactName =
      values.workerType === "individual"
        ? resolvedCompanyName
        : (values.contactName ?? resolvedCompanyName);

    createCompany.mutate(
      {
        data: {
          companyName: resolvedCompanyName,
          contactName: resolvedContactName,
          email: values.email,
          phone: values.phone,
          city: values.city,
          serviceTypes: values.serviceTypes,
          customServiceTags,
          description: values.description,
          website: values.website,
          licenseNumber: values.licenseNumber,
          yearsExperience: values.yearsExperience,
          workerType: values.workerType,
          hourlyRate: values.hourlyRate,
          profilePhoto: values.profilePhoto,
          planType: planType ?? "basic",
        } as never,
      },
      {
        onSuccess: () => {
          setLocation("/provider");
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Progress indicator */}
      <div className="mb-8 text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          {l.stepOf(step, 3)}
        </p>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n < step
                    ? "bg-primary text-white"
                    : n === step
                    ? "bg-primary text-white ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {n < step ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              {n < 3 && (
                <div className={`w-12 h-0.5 rounded-full transition-all ${n < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Plan selection ─────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-serif font-bold mb-3">{l.step1Title}</h1>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">{l.step1Sub}</p>
          </div>

          <div className="mb-8">
            <PlanCards selected={planType} onSelect={setPlanType} />
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!planType}
            onClick={() => setStep(2)}
          >
            {l.next}
          </Button>
        </div>
      )}

      {/* ── STEP 2: Profile form ──────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-serif font-bold mb-3">{l.step2Title}</h1>
            <p className="text-muted-foreground text-sm">{l.step2Sub}</p>
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
                      <FormLabel>{l.workerType}</FormLabel>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        {[
                          { value: "individual", icon: User, label: l.individual },
                          { value: "company", icon: Building2, label: l.company },
                        ].map((opt) => (
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

                {/* Name fields — dynamic by workerType */}
                {workerType === "individual" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{l.firstName} <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Marco" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{l.lastName} <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Müller" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{l.companyNameLabel} <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Construction AG" {...field} />
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
                          <FormLabel>{l.contactPersonLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Email + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.companyForm.email} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@example.com" {...field} />
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
                        <FormLabel>{t.companyForm.phone} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="+41 XX XXX XX XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.companyForm.city} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Zürich, CH" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Services */}
                <FormField
                  control={form.control}
                  name="serviceTypes"
                  render={() => (
                    <FormItem>
                      <div className="mb-3">
                        <FormLabel className="text-base">
                          {t.companyForm.services} <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription className="text-xs mt-1">
                          {lang === "de"
                            ? "Wählen Sie Hauptkategorien und optional Spezialgebiete"
                            : lang === "sq"
                            ? "Zgjidhni kategoritë kryesore dhe opsionalisht nënkategoritë"
                            : lang === "fr"
                            ? "Sélectionnez les catégories principales et optionnellement les sous-catégories"
                            : "Select main categories and optionally sub-categories"}
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
                                <div
                                  className={`rounded-lg border transition-all ${
                                    isChecked ? "border-primary/40 bg-primary/3" : "border-border"
                                  }`}
                                >
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3">
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, cat.key]);
                                          } else {
                                            const tagKeys = cat.subcategories.map((tt) => tt.key);
                                            field.onChange(
                                              field.value?.filter(
                                                (v: string) => v !== cat.key && !tagKeys.includes(v)
                                              )
                                            );
                                            setOtherTexts((prev) => {
                                              const next = { ...prev };
                                              delete next[cat.key];
                                              return next;
                                            });
                                            setOtherTagErrors((prev) => {
                                              const next = { ...prev };
                                              delete next[cat.key];
                                              return next;
                                            });
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
                                        {cat.subcategories.map((tag) => {
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
                                                    setOtherTexts((prev) => {
                                                      const next = { ...prev };
                                                      delete next[cat.key];
                                                      return next;
                                                    });
                                                    setOtherTagErrors((prev) => {
                                                      const next = { ...prev };
                                                      delete next[cat.key];
                                                      return next;
                                                    });
                                                  } else {
                                                    setOtherTexts((prev) => ({ ...prev, [cat.key]: "" }));
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
                                              setOtherTexts((prev) => ({ ...prev, [cat.key]: sanitized }));
                                              if (sanitized.length >= 3) {
                                                const result = validateOtherTag(sanitized);
                                                setOtherTagErrors((prev) => ({
                                                  ...prev,
                                                  [cat.key]: result.ok
                                                    ? ""
                                                    : otherTagErrorMessage(result.error, lang as Lang),
                                                }));
                                              } else {
                                                setOtherTagErrors((prev) => ({ ...prev, [cat.key]: "" }));
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

                {/* Experience + License */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.companyForm.yearsExperience}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} value={field.value || ""} />
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

                {/* Hourly rate (individual only) */}
                {workerType === "individual" && (
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.companyForm.hourlyRate ?? "Hourly Rate (CHF/hr)"}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                              CHF
                            </span>
                            <Input
                              type="number"
                              min="1"
                              placeholder="80"
                              className="pl-12"
                              {...field}
                              value={field.value || ""}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>{t.companyForm.hourlyRateDesc ?? "Your typical hourly rate"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.companyForm.website}</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.companyForm.description}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            lang === "sq"
                              ? "Tregoni për kompaninë tuaj dhe ekspertizën tuaj..."
                              : lang === "de"
                              ? "Beschreiben Sie Ihr Unternehmen und Ihre Expertise..."
                              : lang === "fr"
                              ? "Parlez de votre société et de votre expertise..."
                              : "Tell us about your company and expertise..."
                          }
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
                    hint="JPG or PNG, max 10 MB"
                    multiple={false}
                    value={form.watch("profilePhoto") ? [form.watch("profilePhoto")!] : []}
                    onChange={(paths) => form.setValue("profilePhoto", paths[0])}
                  />
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    {l.back}
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-[2]"
                    disabled={createCompany.isPending}
                  >
                    {createCompany.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.common.loading}
                      </span>
                    ) : (
                      t.companyForm.submit
                    )}
                  </Button>
                </div>

                {createCompany.isError && (
                  <p className="text-sm text-destructive text-center">
                    {lang === "sq"
                      ? "Gabim gjatë regjistrimit. Provoni përsëri."
                      : lang === "de"
                      ? "Registrierungsfehler. Bitte erneut versuchen."
                      : lang === "fr"
                      ? "Erreur lors de l'enregistrement. Veuillez réessayer."
                      : "Registration error. Please try again."}
                  </p>
                )}
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

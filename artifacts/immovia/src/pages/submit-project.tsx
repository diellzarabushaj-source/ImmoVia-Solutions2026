import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { useAuth, isProjectPoster } from "@/contexts/AuthContext";
import { useCreateProject } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Hammer, Building2, Sofa, TreePine, Wrench, CheckCircle2, Home as HomeIcon, Crown, Sparkles, Layers, Zap, Paintbrush, FlameKindling, ChefHat, Leaf, Star, SquareStack, HelpCircle } from "lucide-react";
import { CATEGORIES, getCategoryLabel, type Lang } from "@/lib/categories";
import { PhotoUploader } from "@/components/photo-uploader";

export default function SubmitProject() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const createProject = useCreateProject();

  useEffect(() => {
    if (!authLoading && user && !isProjectPoster(user)) {
      setAuthError(t.auth.mustBeClient);
    } else {
      setAuthError(null);
    }
  }, [authLoading, user, t.auth.mustBeClient]);

  const [projectPhotos, setProjectPhotos] = useState<string[]>([]);

  const formSchema = z.object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(5, { message: "Phone number is required" }),
    projectType: z.string().min(1, { message: "Project type is required" }),
    size: z.enum(["small", "medium", "large", "premium"]),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    city: z.string().min(2, { message: "City is required" }),
    budget: z.string().optional(),
    timeline: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      projectType: "",
      size: "medium",
      description: "",
      city: user?.city ?? "",
      budget: "",
      timeline: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Send size through; useCreateProject is OpenAPI-typed but fetch is forgiving — fall back to direct fetch if needed.
    const payload = { ...values, photos: projectPhotos } as z.infer<typeof formSchema> & { size: string; photos: string[] };
    createProject.mutate(
      { data: payload as never },
      {
        onSuccess: () => {
          setIsSubmitted(true);
        },
      },
    );
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["fullName", "email", "phone"]);
    } else if (step === 2) {
      isValid = await form.trigger(["projectType"]);
    } else if (step === 3) {
      isValid = await form.trigger(["size"]);
    } else if (step === 4) {
      isValid = await form.trigger(["description", "city"]);
    }

    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const SUBMIT_ICONS: Record<string, React.ElementType> = {
    renovation:     Hammer,
    painting:       Paintbrush,
    electrical:     Zap,
    plumbing:       Wrench,
    kitchen:        ChefHat,
    flooring:       SquareStack,
    interior_design: Sofa,
    cleaning:       Leaf,
    other:          HelpCircle,
  };
  const projectTypes = CATEGORIES.map(cat => ({
    id: cat.key,
    icon: SUBMIT_ICONS[cat.key] ?? HelpCircle,
    label: getCategoryLabel(cat, language as Lang),
  }));

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-md text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">{t.auth.signupTitle}</h2>
        <p className="text-muted-foreground mb-6">{t.auth.roleHomeownerDesc}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/signup">
            <Button data-testid="button-signup-redirect">{t.auth.createAccount}</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">{t.auth.loginLink}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-md text-center">
        <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
          {authError}
        </div>
        <Link href="/provider">
          <Button variant="outline">{t.nav.dashboard}</Button>
        </Link>
      </div>
    );
  }

  if (isSubmitted) {
    const nextSteps: Record<string, string[]> = {
      de: [
        "Unser Team prüft Ihre Anfrage innerhalb von 24 Stunden.",
        "Passende Fachbetriebe werden benachrichtigt und können Angebote einreichen.",
        "Sie erhalten Angebote per E-Mail und können diese direkt vergleichen.",
      ],
      en: [
        "Our team will review your request within 24 hours.",
        "Matching professionals will be notified and can submit offers.",
        "You will receive offers by email and can compare them directly.",
      ],
      sq: [
        "Ekipi ynë do ta shqyrtojë kërkesën tuaj brenda 24 orëve.",
        "Profesionistët përkatës do të njoftohen dhe mund të dërgojnë oferta.",
        "Do të merrni oferta me email dhe mund t'i krahasoni drejtpërdrejt.",
      ],
      fr: [
        "Notre équipe examinera votre demande dans les 24 heures.",
        "Les professionnels correspondants seront notifiés et pourront soumettre des offres.",
        "Vous recevrez des offres par e-mail et pourrez les comparer directement.",
      ],
    };
    const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null) ?? "de";
    const steps = nextSteps[lang] ?? nextSteps.de;

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
          <h2 className="text-3xl font-serif font-bold mb-3">{t.projectForm.success}</h2>
          <p className="text-muted-foreground text-sm mb-10">
            {lang === "de" && "Eine Bestätigungsmail wurde an Ihre E-Mail-Adresse gesendet."}
            {lang === "en" && "A confirmation email has been sent to your address."}
            {lang === "sq" && "Një email konfirmimi u dërgua në adresën tuaj."}
            {lang === "fr" && "Un email de confirmation a été envoyé à votre adresse."}
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {lang === "de" && "Nächste Schritte"}
              {lang === "en" && "Next Steps"}
              {lang === "sq" && "Hapat e Ardhshëm"}
              {lang === "fr" && "Prochaines étapes"}
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
              {lang === "de" && "Firmen entdecken"}
              {lang === "en" && "Browse Companies"}
              {lang === "sq" && "Shiko Firmat"}
              {lang === "fr" && "Découvrir les entreprises"}
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
        <h1 className="text-3xl font-serif font-bold mb-6">{t.projectForm.title}</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i}
              </div>
              {i < 5 && (
                <div className={`w-6 sm:w-12 md:w-20 h-1 mx-1 sm:mx-2 ${
                  step > i ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground font-medium">
          {step === 1 && t.projectForm.step1}
          {step === 2 && t.projectForm.step2}
          {step === 3 && t.projectSize.title}
          {step === 4 && t.projectForm.step3}
          {step === 5 && t.projectForm.step4}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.projectForm.fullName}</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.projectForm.email}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
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
                        <FormLabel>{t.projectForm.phone}</FormLabel>
                        <FormControl>
                          <Input placeholder="+41 XX XXX XX XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">{t.projectForm.step2}</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {projectTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all ${
                                field.value === type.id
                                  ? "border-primary bg-secondary/50 text-foreground"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange(type.id)}
                            >
                              <type.icon className={`w-8 h-8 ${field.value === type.id ? "text-primary" : ""}`} />
                              <span className="font-medium text-sm text-center">{type.label}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">{t.projectSize.title}</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                          {([
                            { id: "small", icon: HomeIcon, label: t.projectSize.small, desc: t.projectSize.smallDesc },
                            { id: "medium", icon: Layers, label: t.projectSize.medium, desc: t.projectSize.mediumDesc },
                            { id: "large", icon: Sparkles, label: t.projectSize.large, desc: t.projectSize.largeDesc },
                            { id: "premium", icon: Crown, label: t.projectSize.premium, desc: t.projectSize.premiumDesc },
                          ] as const).map((s) => (
                            <div
                              key={s.id}
                              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                field.value === s.id
                                  ? "border-primary bg-secondary/50"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange(s.id)}
                              data-testid={`size-${s.id}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <s.icon className={`w-5 h-5 ${field.value === s.id ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="font-semibold">{s.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{s.desc}</p>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
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
                          <Textarea 
                            placeholder="Describe your project in detail..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Project photos */}
                  <PhotoUploader
                    label="Project Photos (optional)"
                    hint="Add photos to help professionals understand your project — JPG/PNG, max 10MB each"
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-muted p-4 rounded-lg text-sm mb-4">
                    {t.projectForm.reviewInfo}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contact</h4>
                      <p className="font-medium">{form.getValues().fullName}</p>
                      <p className="text-sm">{form.getValues().email}</p>
                      <p className="text-sm">{form.getValues().phone}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Location</h4>
                      <p className="font-medium">{form.getValues().city}</p>
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Details</h4>
                      <p className="font-medium capitalize">{form.getValues().projectType}</p>
                      <p className="text-sm mt-1 bg-background p-3 rounded border border-border">
                        {form.getValues().description}
                      </p>
                    </div>
                    {form.getValues().budget && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Budget</h4>
                        <p className="font-medium">{form.getValues().budget}</p>
                      </div>
                    )}
                    {form.getValues().timeline && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Timeline</h4>
                        <p className="font-medium">{form.getValues().timeline}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between pt-6 border-t border-border mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1 || createProject.isPending}
              >
                {t.projectForm.back}
              </Button>
              
              {step < 5 ? (
                <Button type="button" onClick={nextStep} data-testid={`button-next-${step}`}>
                  {t.projectForm.next}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createProject.isPending}
                  className="bg-primary"
                >
                  {createProject.isPending ? t.common.loading : t.projectForm.submit}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

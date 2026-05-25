import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { PhotoUploader } from "@/components/photo-uploader";

export default function RegisterCompany() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const createCompany = useCreateCompany();

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
    createCompany.mutate({
      data: values
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
      }
    });
  };

  const servicesList = [
    { id: "renovation", label: t.offers.renovation },
    { id: "construction", label: t.offers.construction },
    { id: "interior", label: t.offers.interior },
    { id: "exterior", label: t.offers.exterior },
    { id: "other", label: t.offers.other },
  ];

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4">{t.companyForm.success}</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Your application has been received and is under review. We will contact you shortly.
        </p>
        <Button onClick={() => setLocation("/")}>{t.nav.home}</Button>
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
                  <div className="mb-4">
                    <FormLabel className="text-base">{t.companyForm.services}</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {servicesList.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="serviceTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer w-full">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )
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

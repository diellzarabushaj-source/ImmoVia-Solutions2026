import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
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
import { Hammer, Building2, Sofa, TreePine, Wrench, CheckCircle2 } from "lucide-react";

export default function SubmitProject() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const createProject = useCreateProject();

  const formSchema = z.object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(5, { message: "Phone number is required" }),
    projectType: z.string().min(1, { message: "Project type is required" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    city: z.string().min(2, { message: "City is required" }),
    budget: z.string().optional(),
    timeline: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      projectType: "",
      description: "",
      city: "",
      budget: "",
      timeline: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createProject.mutate({
      data: values
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
      }
    });
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["fullName", "email", "phone"]);
    } else if (step === 2) {
      isValid = await form.trigger(["projectType"]);
    } else if (step === 3) {
      isValid = await form.trigger(["description", "city"]);
    }
    
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const projectTypes = [
    { id: "renovation", icon: Hammer, label: t.services.renovation },
    { id: "construction", icon: Building2, label: t.services.construction },
    { id: "interior", icon: Sofa, label: t.services.interior },
    { id: "exterior", icon: TreePine, label: t.services.exterior },
    { id: "other", icon: Wrench, label: t.services.other },
  ];

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4">{t.projectForm.success}</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          {t.steps.step2Desc}
        </p>
        <Button onClick={() => setLocation("/")}>{t.nav.home}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif font-bold mb-6">{t.projectForm.title}</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i}
              </div>
              {i < 4 && (
                <div className={`w-12 sm:w-20 h-1 mx-2 ${
                  step > i ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground font-medium">
          {step === 1 && t.projectForm.step1}
          {step === 2 && t.projectForm.step2}
          {step === 3 && t.projectForm.step3}
          {step === 4 && t.projectForm.step4}
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

              {step === 4 && (
                <motion.div
                  key="step4"
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
              
              {step < 4 ? (
                <Button type="button" onClick={nextStep}>
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

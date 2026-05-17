import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Hammer, Building2, Sofa, TreePine, Wrench } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground py-24 md:py-32 lg:py-40">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-6">
              {t.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-sidebar-foreground/80 mb-10 max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/submit-project">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base h-12 px-8">
                  {t.hero.ctaProject}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register-company">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-sidebar-foreground/20 hover:bg-sidebar-foreground/10 text-sidebar-foreground text-base h-12 px-8">
                  {t.hero.ctaCompany}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary blur-[120px]" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary blur-[120px]" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">{t.steps.title}</h2>
            <div className="w-16 h-1 bg-primary mx-auto" />
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              { title: t.steps.step1Title, desc: t.steps.step1Desc, num: "01" },
              { title: t.steps.step2Title, desc: t.steps.step2Desc, num: "02" },
              { title: t.steps.step3Title, desc: t.steps.step3Desc, num: "03" }
            ].map((step, i) => (
              <motion.div key={i} variants={fadeIn} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center text-xl font-bold font-serif mb-6 z-10">
                  {step.num}
                </div>
                {i < 2 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-border -z-0" />}
                <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">{t.services.title}</h2>
            <div className="w-16 h-1 bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: t.services.renovation, icon: Hammer },
              { name: t.services.construction, icon: Building2 },
              { name: t.services.interior, icon: Sofa },
              { name: t.services.exterior, icon: TreePine },
              { name: t.services.other, icon: Wrench },
            ].map((service, i) => (
              <Link key={i} href="/submit-project">
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center text-center hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-foreground">{service.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-24 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <Shield className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-3xl font-serif font-bold mb-2">100%</h3>
              <p className="text-sidebar-foreground/70">Verified Professionals</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-3xl font-serif font-bold mb-2">5k+</h3>
              <p className="text-sidebar-foreground/70">Completed Projects</p>
            </div>
            <div className="flex flex-col items-center">
              <Building2 className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-3xl font-serif font-bold mb-2">3</h3>
              <p className="text-sidebar-foreground/70">Countries Served</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

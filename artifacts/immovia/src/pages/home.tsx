import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  HeadphonesIcon,
  Hammer,
  Building2,
  Sofa,
  TreePine,
  Wrench,
  Plug,
  Star,
  Users,
  Globe,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Hammer,
      title: t.offers.renovation,
      desc: t.offers.renovationDesc,
      price: t.offers.renovationPrice,
      color: "bg-blue-50 text-blue-700",
      border: "hover:border-blue-200",
    },
    {
      icon: Building2,
      title: t.offers.construction,
      desc: t.offers.constructionDesc,
      price: t.offers.constructionPrice,
      color: "bg-navy-50 text-foreground",
      border: "hover:border-foreground/20",
    },
    {
      icon: Sofa,
      title: t.offers.interior,
      desc: t.offers.interiorDesc,
      price: t.offers.interiorPrice,
      color: "bg-indigo-50 text-indigo-700",
      border: "hover:border-indigo-200",
    },
    {
      icon: TreePine,
      title: t.offers.exterior,
      desc: t.offers.exteriorDesc,
      price: t.offers.exteriorPrice,
      color: "bg-emerald-50 text-emerald-700",
      border: "hover:border-emerald-200",
    },
    {
      icon: Wrench,
      title: t.offers.plumbing,
      desc: t.offers.plumbingDesc,
      price: t.offers.plumbingPrice,
      color: "bg-sky-50 text-sky-700",
      border: "hover:border-sky-200",
    },
    {
      icon: Plug,
      title: t.offers.electric,
      desc: t.offers.electricDesc,
      price: t.offers.electricPrice,
      color: "bg-amber-50 text-amber-700",
      border: "hover:border-amber-200",
    },
  ];

  const whyUs = [
    { icon: Shield, title: t.why.verified, desc: t.why.verifiedDesc },
    { icon: Zap, title: t.why.fast, desc: t.why.fastDesc },
    { icon: CheckCircle2, title: t.why.secure, desc: t.why.secureDesc },
    { icon: HeadphonesIcon, title: t.why.support, desc: t.why.supportDesc },
  ];

  const stats = [
    { value: "5,000+", label: t.stats.projects, icon: TrendingUp },
    { value: "320+", label: t.stats.professionals, icon: Users },
    { value: "3", label: t.stats.countries, icon: Globe },
    { value: "98%", label: t.stats.satisfaction, icon: Star },
  ];

  const testimonials = [
    { text: t.testimonials.t1, author: t.testimonials.t1Author, city: t.testimonials.t1City, rating: 5 },
    { text: t.testimonials.t2, author: t.testimonials.t2Author, city: t.testimonials.t2City, rating: 5 },
    { text: t.testimonials.t3, author: t.testimonials.t3Author, city: t.testimonials.t3City, rating: 5 },
  ];

  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-foreground text-white py-28 md:py-36">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Glow blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[80%] rounded-full bg-primary opacity-10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[70%] rounded-full bg-blue-400 opacity-8 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              <Star className="w-3 h-3 text-primary fill-primary" />
              {t.hero.badge}
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-[1.08]"
            >
              {t.hero.title.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t.hero.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-xl md:text-2xl font-light text-primary mb-6"
            >
              {t.hero.titleHighlight}
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg text-white/65 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
            >
              <Link href="/submit-project">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base h-13 px-8 shadow-lg shadow-primary/25"
                  data-testid="hero-cta-project"
                >
                  {t.hero.ctaProject}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register-company">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-white/25 hover:bg-white/10 text-white text-base h-13 px-8"
                  data-testid="hero-cta-company"
                >
                  {t.hero.ctaCompany}
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-xs font-medium"
            >
              {[t.hero.trustBadge1, t.hero.trustBadge2, t.hero.trustBadge3].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground mt-1">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES / OFFERS ── */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.offers.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.offers.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
          >
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href="/submit-project">
                  <div
                    className={`group bg-white border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer ${s.border} flex flex-col gap-4 h-full`}
                    data-testid={`service-card-${i}`}
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg mb-2">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm font-semibold text-primary">{s.price}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                        {t.offers.cta}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.steps.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.steps.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              { num: "01", title: t.steps.step1Title, desc: t.steps.step1Desc },
              { num: "02", title: t.steps.step2Title, desc: t.steps.step2Desc },
              { num: "03", title: t.steps.step3Title, desc: t.steps.step3Desc },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-6 md:gap-10 mb-10 last:mb-0"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-foreground text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  {i < 2 && <div className="w-px flex-1 bg-border mt-3 min-h-[2.5rem]" />}
                </div>
                <div className="pb-10 last:pb-0">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/submit-project">
              <Button size="lg" className="px-10" data-testid="steps-cta">
                {t.cta.button}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY IMMOVIA ── */}
      <section className="py-24 bg-secondary/40">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.why.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.why.subtitle}</p>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
          >
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white rounded-xl border border-border p-6 flex flex-col gap-4"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.testimonials.title}</h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-5" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((t_, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-muted/30 border border-border rounded-xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t_.rating }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed flex-1 italic">"{t_.text}"</p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm text-foreground">{t_.author}</p>
                  <p className="text-xs text-muted-foreground">{t_.city}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground mb-3">
              {t.team.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t.team.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {t.team.members.map((member, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center group"
                variants={fadeUp}
              >
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-[#eef2f9] mb-4 shadow-md group-hover:shadow-lg transition-shadow">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h3 className="font-bold text-foreground text-base leading-tight">{member.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DUAL CTA ── */}
      <section className="py-20 bg-foreground text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Homeowner CTA */}
            <motion.div
              className="bg-primary rounded-2xl p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Hammer className="w-8 h-8 text-white/70" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cta.title}</h3>
                <p className="text-white/75 text-sm leading-relaxed">{t.cta.subtitle}</p>
              </div>
              <Link href="/submit-project">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold w-full sm:w-auto"
                  data-testid="footer-cta-project"
                >
                  {t.cta.button}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Company CTA */}
            <motion.div
              className="bg-white/8 border border-white/15 rounded-2xl p-8 flex flex-col gap-5"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cta.companyTitle}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{t.cta.companySubtitle}</p>
              </div>
              <Link href="/register-company">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold w-full sm:w-auto"
                  data-testid="footer-cta-company"
                >
                  {t.cta.companyButton}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
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
  Search,
  Home as HomeIcon,
  Briefcase,
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

  // ── Parallax & 3-D mouse tracking ──
  const heroRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 18 });

  // Video shifts opposite to cursor (parallax depth illusion)
  const vidX = useTransform(springX, [-0.5, 0.5], ["5%", "-5%"]);
  const vidY = useTransform(springY, [-0.5, 0.5], ["5%", "-5%"]);

  // Content tilts subtly in the same direction
  const tiltX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  // Scroll: video rises as you scroll down (parallax)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const scrollVidY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const services = [
    {
      icon: Hammer,
      title: t.offers.renovation,
      desc: t.offers.renovationDesc,
      price: t.offers.renovationPrice,
      photo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&fit=crop",
      serviceKey: "renovation",
    },
    {
      icon: Building2,
      title: t.offers.construction,
      desc: t.offers.constructionDesc,
      price: t.offers.constructionPrice,
      photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop",
      serviceKey: "construction",
    },
    {
      icon: Sofa,
      title: t.offers.interior,
      desc: t.offers.interiorDesc,
      price: t.offers.interiorPrice,
      photo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80&fit=crop",
      serviceKey: "interior",
    },
    {
      icon: TreePine,
      title: t.offers.exterior,
      desc: t.offers.exteriorDesc,
      price: t.offers.exteriorPrice,
      photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
      serviceKey: "exterior",
    },
    {
      icon: Wrench,
      title: t.offers.plumbing,
      desc: t.offers.plumbingDesc,
      price: t.offers.plumbingPrice,
      photo: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=600&q=80&fit=crop",
      serviceKey: "plumbing",
    },
    {
      icon: Plug,
      title: t.offers.electric,
      desc: t.offers.electricDesc,
      price: t.offers.electricPrice,
      photo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&fit=crop",
      serviceKey: "electric",
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
      <motion.section
        ref={heroRef}
        className="relative overflow-hidden bg-foreground text-white py-16 md:py-24 lg:py-32"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── VIDEO BACKGROUND (scroll + mouse parallax) ── */}
        <motion.div className="absolute inset-[-12%]" style={{ y: scrollVidY }}>
          <motion.div className="absolute inset-0" style={{ x: vidX, y: vidY }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80&fit=crop"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-workers-on-a-construction-site-with-cranes-in-the-background-42737-large.mp4" type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-construction-site-structure-of-a-house-being-built-40742-large.mp4" type="video/mp4" />
            </video>
            {/* Deep cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/65 to-foreground/88" />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
          </motion.div>
        </motion.div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none z-[1]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* Glow orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[80%] rounded-full bg-primary opacity-[0.12] blur-[130px] pointer-events-none z-[1]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[70%] rounded-full bg-blue-400 opacity-[0.08] blur-[110px] pointer-events-none z-[1]" />

        {/* Content — subtle 3-D tilt follows cursor */}
        <motion.div
          className="container mx-auto px-4 relative z-10"
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1400, transformStyle: "preserve-3d" }}
        >
          <motion.div className="max-w-4xl mx-auto text-center" initial="initial" animate="animate" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              <Star className="w-3 h-3 text-primary fill-primary" />
              {t.hero.badge}
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-[1.05]"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}>
              {t.hero.title.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? "text-primary drop-shadow-lg" : i === 2 ? "text-blue-300 drop-shadow-lg" : "text-white"}>
                  {line}{i < t.hero.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl font-light text-white mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
              {t.hero.subtitle}
            </motion.p>

            {/* Persona cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10">
              {/* Client persona */}
              <Link href="/companies">
                <div className="group rounded-xl p-5 text-left border border-white/20 cursor-pointer transition-all duration-200 hover:border-blue-400/50"
                  style={{ background: "rgba(10,20,50,0.60)", backdropFilter: "blur(14px)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/30 border border-primary/40 flex items-center justify-center flex-shrink-0">
                      <HomeIcon className="w-4 h-4 text-blue-300" />
                    </div>
                    <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">{t.hero.persona1Label}</span>
                  </div>
                  <h3 className="text-white text-base font-bold mb-1 leading-snug">{t.hero.persona1Title}</h3>
                  <p className="text-white/65 text-xs leading-relaxed mb-3">{t.hero.persona1Desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 group-hover:gap-2 transition-all">
                    {t.hero.persona1Cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>

              {/* Professional persona */}
              <Link href="/register-company">
                <div className="group rounded-xl p-5 text-left border border-white/20 cursor-pointer transition-all duration-200 hover:border-blue-400/50"
                  style={{ background: "rgba(10,20,50,0.60)", backdropFilter: "blur(14px)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/30 border border-primary/40 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-blue-300" />
                    </div>
                    <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">{t.hero.persona2Label}</span>
                  </div>
                  <h3 className="text-white text-base font-bold mb-1 leading-snug">{t.hero.persona2Title}</h3>
                  <p className="text-white/65 text-xs leading-relaxed mb-3">{t.hero.persona2Desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 group-hover:gap-2 transition-all">
                    {t.hero.persona2Cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link href="/companies">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base px-8 shadow-lg shadow-primary/30" data-testid="hero-cta-project">
                  <Search className="mr-2 h-4 w-4" />
                  {t.hero.ctaProject}
                </Button>
              </Link>
              <Link href="/register-company">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white/40 hover:bg-white/20 text-white text-base px-8 backdrop-blur-sm" data-testid="hero-cta-company">
                  {t.hero.ctaCompany}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-xs font-medium">
              {[t.hero.trustBadge1, t.hero.trustBadge2, t.hero.trustBadge3].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary drop-shadow" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

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
      <section className="py-14 md:py-24 bg-muted/30">
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
                <Link href={`/companies?service=${s.serviceKey}`}>
                  <div
                    className="group relative rounded-2xl overflow-hidden cursor-pointer h-72 shadow-md hover:shadow-xl transition-all duration-300"
                    data-testid={`service-card-${i}`}
                  >
                    {/* Photo background */}
                    <img
                      src={s.photo}
                      alt={s.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                    {/* Icon badge top-left */}
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-bold text-white text-lg leading-tight mb-1">{s.title}</h3>
                      <p className="text-white/75 text-xs leading-relaxed line-clamp-2 mb-3">{s.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold bg-primary/90 text-white px-2.5 py-1 rounded-full">
                          {s.price}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/80 group-hover:text-white transition-colors font-medium">
                          {t.offers.cta}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 md:py-24 bg-white">
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
      <section className="py-14 md:py-24 bg-secondary/40">
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
      <section className="py-14 md:py-24 bg-white">
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

      {/* ── DUAL CTA ── */}
      <section className="py-14 md:py-20 bg-foreground text-white">
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

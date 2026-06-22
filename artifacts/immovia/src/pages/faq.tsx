import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { fetchFaqPage, type SanityFaqPage, type LocalizedString } from "@/lib/sanity";
import { HelpCircle, ChevronDown, Loader2, ArrowRight, Mail, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function loc(field: LocalizedString | undefined, lang: string): string {
  if (!field) return "";
  return (field as Record<string, string>)[lang] ?? field.en ?? "";
}

const fallback = {
  sq: {
    title: "Pyetjet e Shpeshta",
    subtitle: "Gjeni përgjigje për pyetjet tuaja rreth ImmoVia365.",
    items: [
      {
        question: "Si funksionon ImmoVia365?",
        answer: "ImmoVia365 është një platformë dixhitale që lidh pronarë shtëpish dhe klientë me kontraktorë dhe profesionistë të besuar. Postoni një projekt, merrni aplikime nga profesionistë, krahasoni ofertat dhe zgjidhni ofruesin më të mirë.",
      },
      {
        question: "A është falas regjistrimi?",
        answer: "Regjistrimi bazë është plotësisht falas. Klientët mund të postojnë projekte pa asnjë kosto. Ofruesit e shërbimeve mund të regjistrohen me Planin Bazë pa pagesë, ose të zgjedhin planet Profesionale dhe Premium për veçori shtesë.",
      },
      {
        question: "Si verifikohen kontraktorët?",
        answer: "Çdo ofrues shërbimi kalon nëpër procesin tonë të aprovimit ku kontrollojmë informacionin e biznesit, licencat dhe vlerësimet. Profilet me shenjën e aprovimit kanë kaluar verifikimin bazë të platformës.",
      },
      {
        question: "Sa kohë duhet për të marrë oferta?",
        answer: "Zakonisht brenda 24–48 orëve pas postimit të projektit tuaj filloni të merrni aplikime nga profesionistë. Koha mund të ndryshojë sipas llojit të projektit dhe vendndodhjes.",
      },
      {
        question: "A mund të ndryshoj planin tim?",
        answer: "Po, mund të ndryshoni planin tuaj në çdo kohë nga paneli i llogarisë. Ndryshimet hyjnë në fuqi menjëherë ose në fillim të periudhës tjetër të faturimit, sipas llojit të ndryshimit.",
      },
      {
        question: "Si paguhen shërbimet?",
        answer: "Pagesat e abonimit bëhen nëpërmjet Stripe me kartë krediti ose debiti. ImmoVia365 nuk menaxhon pagesat midis klientëve dhe ofruesve — kjo është marrëveshje direkte midis palëve.",
      },
      {
        question: "Çfarë ndodh nëse anulohem?",
        answer: "Nëse anuloni abonimin tuaj, do të vazhdoni të keni akses në veçoritë e planit tuaj deri në fund të periudhës aktuale të faturimit. Pas kësaj, llogaria juaj kalon automatikisht në Planin Bazë falas.",
      },
      {
        question: "Si mund të kontaktoj mbështetjen?",
        answer: "Na kontaktoni nëpërmjet formularit të kontaktit në faqen tonë ose drejtpërdrejt me email: info@immovia365.ch. Ekipi ynë është i disponueshëm të hënën — të premten, 08:00–17:00 CET.",
      },
    ],
  },
  en: {
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common questions about ImmoVia365.",
    items: [
      {
        question: "How does ImmoVia365 work?",
        answer: "ImmoVia365 is a digital platform connecting homeowners and clients with trusted contractors and professionals. Post a project, receive applications from professionals, compare offers, and choose the best provider.",
      },
      {
        question: "Is registration free?",
        answer: "Basic registration is completely free. Clients can post projects at no cost. Service providers can register with the free Basic Plan or choose Professional and Premium plans for additional features.",
      },
      {
        question: "How are contractors verified?",
        answer: "Every service provider goes through our approval process where we check business information, licences, and reviews. Profiles with the approval badge have passed the platform's basic verification.",
      },
      {
        question: "How long does it take to receive offers?",
        answer: "Typically within 24–48 hours of posting your project you will start receiving applications from professionals. Time may vary depending on the type of project and location.",
      },
      {
        question: "Can I change my plan?",
        answer: "Yes, you can change your plan at any time from your account dashboard. Changes take effect immediately or at the beginning of the next billing period, depending on the type of change.",
      },
      {
        question: "How are services paid for?",
        answer: "Subscription payments are made through Stripe with a credit or debit card. ImmoVia365 does not manage payments between clients and providers — this is a direct arrangement between the parties.",
      },
      {
        question: "What happens if I cancel?",
        answer: "If you cancel your subscription, you will continue to have access to your plan's features until the end of the current billing period. After that, your account automatically reverts to the free Basic Plan.",
      },
      {
        question: "How can I contact support?",
        answer: "Contact us via the contact form on our website or directly by email: info@immovia365.ch. Our team is available Monday to Friday, 08:00–17:00 CET.",
      },
    ],
  },
  de: {
    title: "Häufig gestellte Fragen",
    subtitle: "Finden Sie Antworten auf häufige Fragen zu ImmoVia365.",
    items: [
      {
        question: "Wie funktioniert ImmoVia365?",
        answer: "ImmoVia365 ist eine digitale Plattform, die Hausbesitzer und Kunden mit vertrauenswürdigen Auftragnehmern und Fachleuten verbindet. Stellen Sie ein Projekt ein, erhalten Sie Bewerbungen von Fachleuten, vergleichen Sie Angebote und wählen Sie den besten Anbieter.",
      },
      {
        question: "Ist die Registrierung kostenlos?",
        answer: "Die Basisregistrierung ist völlig kostenlos. Kunden können Projekte ohne Kosten einstellen. Dienstleister können sich mit dem kostenlosen Basisplan registrieren oder Professional- und Premium-Pläne für zusätzliche Funktionen wählen.",
      },
      {
        question: "Wie werden Auftragnehmer überprüft?",
        answer: "Jeder Dienstleister durchläuft unseren Genehmigungsprozess, bei dem wir Geschäftsinformationen, Lizenzen und Bewertungen prüfen. Profile mit dem Genehmigungsabzeichen haben die grundlegende Plattformüberprüfung bestanden.",
      },
      {
        question: "Wie lange dauert es, Angebote zu erhalten?",
        answer: "Normalerweise erhalten Sie innerhalb von 24–48 Stunden nach der Einstellung Ihres Projekts erste Bewerbungen von Fachleuten. Die Zeit kann je nach Projektart und Standort variieren.",
      },
      {
        question: "Kann ich meinen Plan ändern?",
        answer: "Ja, Sie können Ihren Plan jederzeit über Ihr Konto-Dashboard ändern. Änderungen treten sofort oder zu Beginn des nächsten Abrechnungszeitraums in Kraft, abhängig von der Art der Änderung.",
      },
      {
        question: "Wie werden Dienstleistungen bezahlt?",
        answer: "Abonnementzahlungen erfolgen über Stripe mit Kredit- oder Debitkarte. ImmoVia365 verwaltet keine Zahlungen zwischen Kunden und Anbietern — dies ist eine direkte Vereinbarung zwischen den Parteien.",
      },
      {
        question: "Was passiert, wenn ich kündige?",
        answer: "Wenn Sie Ihr Abonnement kündigen, haben Sie bis zum Ende des aktuellen Abrechnungszeitraums weiterhin Zugang zu den Funktionen Ihres Plans. Danach wechselt Ihr Konto automatisch zum kostenlosen Basisplan.",
      },
      {
        question: "Wie kann ich den Support kontaktieren?",
        answer: "Kontaktieren Sie uns über das Kontaktformular auf unserer Website oder direkt per E-Mail: info@immovia365.ch. Unser Team ist montags bis freitags, 08:00–17:00 Uhr MEZ, verfügbar.",
      },
    ],
  },
  fr: {
    title: "Foire Aux Questions",
    subtitle: "Trouvez des réponses aux questions fréquentes sur ImmoVia365.",
    items: [
      {
        question: "Comment fonctionne ImmoVia365 ?",
        answer: "ImmoVia365 est une plateforme numérique qui met en relation des propriétaires et des clients avec des entrepreneurs et des professionnels de confiance. Publiez un projet, recevez des candidatures de professionnels, comparez les offres et choisissez le meilleur prestataire.",
      },
      {
        question: "L'inscription est-elle gratuite ?",
        answer: "L'inscription de base est entièrement gratuite. Les clients peuvent publier des projets sans frais. Les prestataires de services peuvent s'inscrire avec le Plan Basic gratuit ou choisir les plans Professionnel et Premium pour des fonctionnalités supplémentaires.",
      },
      {
        question: "Comment les entrepreneurs sont-ils vérifiés ?",
        answer: "Chaque prestataire passe par notre processus d'approbation où nous vérifions les informations commerciales, les licences et les avis. Les profils avec le badge d'approbation ont passé la vérification de base de la plateforme.",
      },
      {
        question: "Combien de temps faut-il pour recevoir des offres ?",
        answer: "Généralement, dans les 24 à 48 heures suivant la publication de votre projet, vous commencerez à recevoir des candidatures de professionnels. Le délai peut varier selon le type de projet et la localisation.",
      },
      {
        question: "Puis-je changer mon plan ?",
        answer: "Oui, vous pouvez changer votre plan à tout moment depuis votre tableau de bord. Les modifications prennent effet immédiatement ou au début de la prochaine période de facturation, selon le type de changement.",
      },
      {
        question: "Comment les services sont-ils payés ?",
        answer: "Les paiements d'abonnement sont effectués via Stripe avec une carte de crédit ou de débit. ImmoVia365 ne gère pas les paiements entre clients et prestataires — c'est un arrangement direct entre les parties.",
      },
      {
        question: "Que se passe-t-il si j'annule ?",
        answer: "Si vous annulez votre abonnement, vous continuerez à avoir accès aux fonctionnalités de votre plan jusqu'à la fin de la période de facturation en cours. Ensuite, votre compte revient automatiquement au Plan Basic gratuit.",
      },
      {
        question: "Comment contacter le support ?",
        answer: "Contactez-nous via le formulaire de contact sur notre site web ou directement par email : info@immovia365.ch. Notre équipe est disponible du lundi au vendredi, de 08h00 à 17h00 CET.",
      },
    ],
  },
} as const;

type LangKey = keyof typeof fallback;

const ctaLabels: Record<LangKey, { heading: string; sub: string; contact: string; chat: string }> = {
  sq: { heading: "Keni ende pyetje?", sub: "Ekipi ynë është këtu për t'ju ndihmuar.", contact: "Na Kontaktoni", chat: "Hap Chat-in" },
  en: { heading: "Still have questions?", sub: "Our team is here to help you.", contact: "Contact Us", chat: "Open Chat" },
  de: { heading: "Noch Fragen?", sub: "Unser Team ist für Sie da.", contact: "Kontakt aufnehmen", chat: "Chat öffnen" },
  fr: { heading: "Vous avez encore des questions ?", sub: "Notre équipe est là pour vous aider.", contact: "Nous contacter", chat: "Ouvrir le chat" },
};

export default function Faq() {
  const { language } = useLanguage();
  const lang = (language as LangKey) in fallback ? (language as LangKey) : "en";

  const [sanityPage, setSanityPage] = useState<SanityFaqPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchFaqPage()
      .then((data) => setSanityPage(data))
      .finally(() => setLoading(false));
  }, []);

  usePageMeta({
    title: "FAQ | ImmoVia365",
    description: "Find answers to frequently asked questions about ImmoVia365 — how it works, pricing, verification and support.",
    noindex: false,
  });

  useStructuredData({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (sanityPage?.items ?? fallback[lang].items).map((item) => ({
      "@type": "Question",
      name: sanityPage ? loc(item.question as unknown as LocalizedString, lang) : (item as { question: string }).question,
      acceptedAnswer: {
        "@type": "Answer",
        text: sanityPage ? loc(item.answer as unknown as LocalizedString, lang) : (item as { answer: string }).answer,
      },
    })),
  });

  useStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
      { "@type": "ListItem", position: 2, name: "FAQ", item: `${APP_URL}/faq` },
    ],
  });

  const pageTitle = sanityPage ? loc(sanityPage.title, lang) || fallback[lang].title : fallback[lang].title;
  const items = sanityPage
    ? (sanityPage.items ?? []).map((item) => ({
        question: loc(item.question, lang),
        answer: loc(item.answer, lang),
      }))
    : fallback[lang].items;

  const cta = ctaLabels[lang];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative bg-foreground text-white overflow-hidden py-20 md:py-28">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        {/* Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/15 blur-[100px] pointer-events-none" />

        <div className="relative container mx-auto px-6 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* CardDecorator-style icon */}
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>

            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.22em] mb-3">FAQ</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">{pageTitle}</h1>
            <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">{fallback[lang].subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Accordion ── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  className="border-b border-border last:border-b-0"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  viewport={{ once: true }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left py-5 group"
                  >
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {item.question}
                    </span>
                    <div className={`w-7 h-7 rounded-full border border-border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${openIndex === i ? "bg-primary border-primary" : "bg-transparent group-hover:border-primary/50"}`}>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${openIndex === i ? "rotate-180 text-white" : "text-muted-foreground"}`}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-foreground/65 leading-relaxed pb-5 pr-10">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#f4f7fc] py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{cta.heading}</h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{cta.sub}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button size="lg" className="font-semibold w-full sm:w-auto">
                  <Mail className="mr-2 h-4 w-4" />
                  {cta.contact}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

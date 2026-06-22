import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Clock, CheckCircle2, Send, Quote } from "lucide-react";

export default function Contact() {
  const { t } = useLanguage();
  usePageMeta({
    title: "Kontakt | ImmoVia365",
    description: "Kontaktieren Sie das ImmoVia365-Team. Wir helfen Ihnen bei Fragen zu Projekten, Dienstleistungen und Ihrer Registrierung als Handwerker in der Schweiz.",
  });
  useStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Kontakt", "item": `${APP_URL}/contact` }
    ]
  });
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const infoItems = [
    { icon: Mail, value: t.contact.infoEmail },
    { icon: MapPin, value: t.contact.infoAddress },
    { icon: Clock, value: t.contact.infoHours },
  ];

  return (
    <div className="flex-1">
      {/* Header */}
      <section className="bg-[#0f2044] py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t.contact.title}
          </motion.h1>
          <motion.p
            className="text-white/65 text-lg max-w-md mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t.contact.subtitle}
          </motion.p>
        </div>
      </section>

      {/* ── CEO QUOTE STRIP ── */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <motion.div
            className="flex flex-col sm:flex-row items-stretch gap-0 rounded-2xl overflow-hidden shadow-sm border border-[#d0daf0]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            {/* Photo panel */}
            <div className="sm:w-44 w-full h-48 sm:h-auto flex-shrink-0 overflow-hidden">
              <img
                src="/team-raze.png"
                alt={t.contact.quoteAuthor}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Quote panel */}
            <div className="flex-1 bg-gradient-to-br from-[#eef2f9] to-blue-50 px-7 py-7 flex flex-col justify-center relative">
              <Quote className="absolute top-4 right-5 w-10 h-10 text-primary/10 pointer-events-none select-none" />
              <p className="text-[#1a3a6e] text-base md:text-lg font-medium italic leading-relaxed mb-4 relative z-10">
                "{t.contact.quoteText}"
              </p>
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-primary/50" />
                <div>
                  <p className="text-sm font-bold text-[#0f2044]">{t.contact.quoteAuthor}</p>
                  <p className="text-xs text-muted-foreground">{t.contact.quoteRole}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">

            {/* Info panel */}
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-lg font-bold text-[#0f2044] mb-2">{t.contact.infoTitle}</h2>
              {infoItems.map(({ icon: Icon, value }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#eef2f9] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#1a3a6e]" />
                  </div>
                  <span className="text-sm text-muted-foreground pt-2 leading-snug">{value}</span>
                </div>
              ))}
            </motion.div>

            {/* Form */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {status === "success" ? (
                <Card className="border-green-200 bg-green-50 shadow-none">
                  <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                    <h3 className="text-xl font-bold text-green-800">{t.contact.successTitle}</h3>
                    <p className="text-green-700 text-sm text-center">{t.contact.successText}</p>
                    <Button
                      variant="outline"
                      className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                      onClick={() => setStatus("idle")}
                    >
                      {t.contact.submit}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name">{t.contact.nameLabel}</Label>
                          <Input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder={t.contact.namePlaceholder}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email">{t.contact.emailLabel}</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder={t.contact.emailPlaceholder}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="subject">{t.contact.subjectLabel}</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          placeholder={t.contact.subjectPlaceholder}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="message">{t.contact.messageLabel}</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          placeholder={t.contact.messagePlaceholder}
                          rows={5}
                          required
                        />
                      </div>

                      {status === "error" && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                          {t.contact.errorText}
                        </p>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-[#1a3a6e] hover:bg-[#0f2044] flex items-center gap-2"
                        disabled={status === "sending"}
                      >
                        <Send className="w-4 h-4" />
                        {status === "sending" ? t.contact.sending : t.contact.submit}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

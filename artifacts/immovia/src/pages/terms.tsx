import { useLanguage } from "@/lib/language-context";
import { Shield } from "lucide-react";

const content = {
  sq: {
    title: "Kushtet e Shërbimit",
    updated: "Përditësuar: 1 Janar 2025",
    intro: "Ju lutem lexoni me kujdes këto kushte para se të përdorni platformën ImmoVia. Duke hyrë ose përdorur shërbimin tonë, ju pranoni të jeni të lidhur me këto kushte.",
    sections: [
      {
        title: "1. Pranimi i Kushteve",
        body: "Duke u regjistruar ose duke përdorur ImmoVia, ju konfirmoni që keni të paktën 18 vjeç dhe keni kapacitetin juridik për të lidhur kontrata. Nëse përdorni platformën në emër të një kompanie, konfirmoni se keni autoritetin për të vepruar në emrin e saj.",
      },
      {
        title: "2. Përshkrimi i Shërbimit",
        body: "ImmoVia është një platformë dixhitale që lidh pronarë shtëpish me kontraktorë dhe profesionistë të ndërtimit dhe rinovimit. Ne ofrojmë mjete për kërkimin, krahasimin dhe kontaktimin e ofruesve të shërbimeve. ImmoVia nuk është palë në asnjë kontratë midis klientit dhe ofruesit.",
      },
      {
        title: "3. Regjistrimi dhe Llogaria",
        body: "Ju jeni përgjegjës për mbajtjen e konfidencialitetit të kredencialeve të llogarisë suaj. Ju nuk duhet të ndani llogarinë tuaj me të tjerët. ImmoVia rezervon të drejtën të pezullojë ose fshijë llogaritë që shkelin këto kushte.",
      },
      {
        title: "4. Përdorimi i Pranueshëm",
        body: "Ju pranoni të mos përdorni platformën për: (a) veprimtari të paligjshme; (b) ngacmim, shpifje ose sjellje abuzive; (c) botimin e informacioneve false ose mashtrues; (d) mbledhje të paautorizuar të të dhënave; (e) përpjekje për të kompromentuar sigurinë e platformës.",
      },
      {
        title: "5. Tarifat dhe Pagesat",
        body: "Plani Bazë ofrohet pa pagesë. Planet Profesionale dhe Ndërmarrje kanë tarifa mujore ose vjetore të specifikuara në faqen e çmimeve. Të gjitha pagesat janë jorikthyeshme pas konfirmimit, me përjashtim të rasteve kur kërkohet nga ligji.",
      },
      {
        title: "6. Pronësia Intelektuale",
        body: "Të gjithë përmbajtja, logot, markën dhe kodi burimor të ImmoVia janë pronë ekskluzive e ImmoVia SH.P.K. Ju mund të gjeneroni përmbajtje në platformë (foto, përshkrime) dhe mbani të drejtat mbi to, por na jepni një licencë jo-ekskluzive për t'i shfaqur brenda shërbimit.",
      },
      {
        title: "7. Kufizimi i Përgjegjësisë",
        body: "ImmoVia nuk garanton cilësinë e punës së kontraktorëve, saktësinë e vlerësimeve, ose disponueshmërinë e vazhdueshme të platformës. Nuk jemi përgjegjës për dëme indirekte, të rastësishme ose pasuese që rrjedhin nga përdorimi i shërbimit.",
      },
      {
        title: "8. Ndryshimet e Kushteve",
        body: "ImmoVia rezervon të drejtën të ndryshojë këto kushte në çdo kohë. Ndryshimet do të njoftohen me e-mail ose njoftim brenda platformës të paktën 14 ditë para hyrjes në fuqi. Vazhdimi i përdorimit pas datës efektive nënkupton pranimin.",
      },
      {
        title: "9. Ligji i Zbatueshëm",
        body: "Këto kushte rregullohen nga ligjet e Republikës së Shqipërisë. Çdo mosmarrëveshje do të zgjidhet fillimisht përmes negociatave dhe, nëse kjo nuk arrin rezultat, nëpërmjet arbitrazhit në Tiranë.",
      },
      {
        title: "10. Na Kontaktoni",
        body: "Për pyetje rreth këtyre kushteve: legal@immovia.com",
      },
    ],
  },
  en: {
    title: "Terms of Service",
    updated: "Last updated: January 1, 2025",
    intro: "Please read these Terms carefully before using the ImmoVia platform. By accessing or using our service, you agree to be bound by these Terms.",
    sections: [
      {
        title: "1. Acceptance of Terms",
        body: "By registering or using ImmoVia, you confirm you are at least 18 years old and have the legal capacity to enter into contracts. If you use the platform on behalf of a company, you confirm you have the authority to act on its behalf.",
      },
      {
        title: "2. Description of Service",
        body: "ImmoVia is a digital platform connecting homeowners with contractors and professionals in construction and renovation. We provide tools for searching, comparing, and contacting service providers. ImmoVia is not a party to any contract between a client and a provider.",
      },
      {
        title: "3. Registration and Account",
        body: "You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others. ImmoVia reserves the right to suspend or delete accounts that violate these Terms.",
      },
      {
        title: "4. Acceptable Use",
        body: "You agree not to use the platform for: (a) illegal activities; (b) harassment, defamation or abusive conduct; (c) posting false or misleading information; (d) unauthorized data collection; (e) attempting to compromise platform security.",
      },
      {
        title: "5. Fees and Payments",
        body: "The Basic Plan is offered free of charge. Professional and Enterprise plans carry monthly or annual fees as listed on the pricing page. All payments are non-refundable after confirmation, except where required by law.",
      },
      {
        title: "6. Intellectual Property",
        body: "All content, logos, branding and source code of ImmoVia are the exclusive property of ImmoVia LLC. You may generate content on the platform (photos, descriptions) and retain ownership, but you grant us a non-exclusive licence to display it within the service.",
      },
      {
        title: "7. Limitation of Liability",
        body: "ImmoVia does not guarantee the quality of contractor work, accuracy of ratings, or continuous platform availability. We are not liable for indirect, incidental or consequential damages arising from use of the service.",
      },
      {
        title: "8. Changes to Terms",
        body: "ImmoVia reserves the right to modify these Terms at any time. Changes will be notified by email or in-platform notice at least 14 days before taking effect. Continued use after the effective date implies acceptance.",
      },
      {
        title: "9. Governing Law",
        body: "These Terms are governed by the laws of the Republic of Albania. Any dispute shall first be resolved through negotiation and, if unsuccessful, through arbitration in Tirana.",
      },
      {
        title: "10. Contact Us",
        body: "For questions about these Terms: legal@immovia.com",
      },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    updated: "Zuletzt aktualisiert: 1. Januar 2025",
    intro: "Bitte lesen Sie diese Bedingungen sorgfältig durch, bevor Sie die ImmoVia-Plattform nutzen. Durch den Zugriff auf oder die Nutzung unseres Dienstes stimmen Sie zu, an diese Bedingungen gebunden zu sein.",
    sections: [
      {
        title: "1. Annahme der Bedingungen",
        body: "Durch die Registrierung oder Nutzung von ImmoVia bestätigen Sie, dass Sie mindestens 18 Jahre alt sind und die Rechtsfähigkeit besitzen, Verträge abzuschließen. Wenn Sie die Plattform im Namen eines Unternehmens nutzen, bestätigen Sie, dass Sie befugt sind, in dessen Namen zu handeln.",
      },
      {
        title: "2. Beschreibung des Dienstes",
        body: "ImmoVia ist eine digitale Plattform, die Hausbesitzer mit Auftragnehmern und Fachleuten im Bau- und Renovierungsbereich verbindet. Wir bieten Werkzeuge zur Suche, zum Vergleich und zur Kontaktaufnahme mit Dienstleistern. ImmoVia ist keine Vertragspartei zwischen einem Kunden und einem Anbieter.",
      },
      {
        title: "3. Registrierung und Konto",
        body: "Sie sind verantwortlich für die Vertraulichkeit Ihrer Kontodaten. Sie dürfen Ihr Konto nicht mit anderen teilen. ImmoVia behält sich das Recht vor, Konten zu sperren oder zu löschen, die gegen diese Bedingungen verstoßen.",
      },
      {
        title: "4. Zulässige Nutzung",
        body: "Sie stimmen zu, die Plattform nicht zu nutzen für: (a) illegale Aktivitäten; (b) Belästigung, Verleumdung oder missbräuchliches Verhalten; (c) Veröffentlichung falscher oder irreführender Informationen; (d) unbefugte Datenerhebung; (e) Versuche, die Plattformsicherheit zu gefährden.",
      },
      {
        title: "5. Gebühren und Zahlungen",
        body: "Der Basisplan ist kostenlos. Professionelle und Enterprise-Pläne haben monatliche oder jährliche Gebühren, die auf der Preisseite aufgeführt sind. Alle Zahlungen sind nach der Bestätigung nicht erstattungsfähig, sofern dies nicht gesetzlich vorgeschrieben ist.",
      },
      {
        title: "6. Geistiges Eigentum",
        body: "Alle Inhalte, Logos, Marken und Quellcodes von ImmoVia sind ausschließliches Eigentum der ImmoVia GmbH. Sie können Inhalte auf der Plattform erstellen und behalten das Eigentum, gewähren uns jedoch eine nicht-exklusive Lizenz zur Anzeige im Rahmen des Dienstes.",
      },
      {
        title: "7. Haftungsbeschränkung",
        body: "ImmoVia garantiert nicht die Qualität der Auftragnehmerarbeit, die Genauigkeit von Bewertungen oder die kontinuierliche Plattformverfügbarkeit. Wir haften nicht für indirekte, zufällige oder Folgeschäden, die aus der Nutzung des Dienstes entstehen.",
      },
      {
        title: "8. Änderungen der Bedingungen",
        body: "ImmoVia behält sich das Recht vor, diese Bedingungen jederzeit zu ändern. Änderungen werden per E-Mail oder plattforminternem Hinweis mindestens 14 Tage vor dem Inkrafttreten mitgeteilt. Die weitere Nutzung nach dem Wirksamkeitsdatum gilt als Zustimmung.",
      },
      {
        title: "9. Anwendbares Recht",
        body: "Diese Bedingungen unterliegen dem Recht der Republik Albanien. Streitigkeiten werden zunächst durch Verhandlungen und, falls erfolglos, durch Schiedsverfahren in Tirana beigelegt.",
      },
      {
        title: "10. Kontakt",
        body: "Bei Fragen zu diesen Bedingungen: legal@immovia.com",
      },
    ],
  },
  fr: {
    title: "Conditions Générales d'Utilisation",
    updated: "Dernière mise à jour : 1er janvier 2025",
    intro: "Veuillez lire attentivement ces Conditions avant d'utiliser la plateforme ImmoVia. En accédant à notre service ou en l'utilisant, vous acceptez d'être lié par ces Conditions.",
    sections: [
      {
        title: "1. Acceptation des Conditions",
        body: "En vous inscrivant ou en utilisant ImmoVia, vous confirmez que vous avez au moins 18 ans et disposez de la capacité juridique pour conclure des contrats. Si vous utilisez la plateforme au nom d'une entreprise, vous confirmez que vous êtes autorisé à agir en son nom.",
      },
      {
        title: "2. Description du Service",
        body: "ImmoVia est une plateforme numérique qui met en relation des propriétaires avec des entrepreneurs et des professionnels du bâtiment et de la rénovation. Nous fournissons des outils pour rechercher, comparer et contacter des prestataires. ImmoVia n'est partie à aucun contrat entre un client et un prestataire.",
      },
      {
        title: "3. Inscription et Compte",
        body: "Vous êtes responsable de la confidentialité de vos identifiants de compte. Vous ne devez pas partager votre compte avec d'autres personnes. ImmoVia se réserve le droit de suspendre ou de supprimer les comptes qui enfreignent ces Conditions.",
      },
      {
        title: "4. Utilisation Acceptable",
        body: "Vous acceptez de ne pas utiliser la plateforme pour : (a) des activités illégales ; (b) du harcèlement, de la diffamation ou un comportement abusif ; (c) la publication d'informations fausses ou trompeuses ; (d) la collecte de données non autorisée ; (e) des tentatives de compromettre la sécurité de la plateforme.",
      },
      {
        title: "5. Tarifs et Paiements",
        body: "Le Plan Basic est offert gratuitement. Les plans Professionnel et Entreprise ont des frais mensuels ou annuels indiqués sur la page des tarifs. Tous les paiements sont non remboursables après confirmation, sauf si la loi l'exige.",
      },
      {
        title: "6. Propriété Intellectuelle",
        body: "Tous les contenus, logos, marques et codes sources d'ImmoVia sont la propriété exclusive d'ImmoVia SARL. Vous pouvez générer du contenu sur la plateforme et en conserver la propriété, mais vous nous accordez une licence non exclusive pour l'afficher dans le service.",
      },
      {
        title: "7. Limitation de Responsabilité",
        body: "ImmoVia ne garantit pas la qualité des travaux des entrepreneurs, l'exactitude des évaluations ou la disponibilité continue de la plateforme. Nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs découlant de l'utilisation du service.",
      },
      {
        title: "8. Modifications des Conditions",
        body: "ImmoVia se réserve le droit de modifier ces Conditions à tout moment. Les modifications seront notifiées par e-mail ou avis intégré au moins 14 jours avant leur entrée en vigueur. La poursuite de l'utilisation après la date d'entrée en vigueur implique l'acceptation.",
      },
      {
        title: "9. Droit Applicable",
        body: "Ces Conditions sont régies par les lois de la République d'Albanie. Tout litige sera d'abord résolu par négociation et, en cas d'échec, par arbitrage à Tirana.",
      },
      {
        title: "10. Nous Contacter",
        body: "Pour toute question concernant ces Conditions : legal@immovia.com",
      },
    ],
  },
};

export default function Terms() {
  const { language } = useLanguage();
  const c = content[language] ?? content.en;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{c.title}</h1>
          </div>
          <p className="text-white/50 text-sm">{c.updated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-3xl py-12">
        <p className="text-foreground/70 leading-relaxed mb-10 text-base border-l-4 border-primary pl-4">
          {c.intro}
        </p>

        <div className="flex flex-col gap-8">
          {c.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-foreground mb-2">{s.title}</h2>
              <p className="text-foreground/70 leading-relaxed text-sm">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

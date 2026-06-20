import { useLanguage } from "@/lib/language-context";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useStructuredData, APP_URL } from "@/hooks/useStructuredData";
import { Lock } from "lucide-react";

const content = {
  sq: {
    title: "Politika e Privatësisë",
    updated: "Përditësuar: 1 Janar 2025",
    intro: "ImmoVia365 ('ne', 'neve', 'platforma') angazhohet të mbrojë privatësinë tuaj. Kjo politikë shpjegon cilat të dhëna mbledhim, si i përdorim dhe të drejtat tuaja sipas GDPR dhe legjislacionit shqiptar.",
    sections: [
      {
        title: "1. Kontrollori i të Dhënave",
        body: "Kontrollori i të dhënave është ImmoVia365 SH.P.K., me seli në Tiranë, Shqipëri. Email: privacy@immovia.com",
      },
      {
        title: "2. Të Dhënat që Mbledhim",
        body: "Mbledhim: (a) të dhëna identifikimi — emri, email-i, numri i telefonit; (b) të dhëna profesionale — emri i kompanisë, shërbimet, licencat; (c) të dhëna të projekteve — përshkrimi, lokacioni, buxheti; (d) të dhëna teknike — adresa IP, lloji i shfletuesit, koha e hyrjes; (e) komunikimet — mesazhet midis klientëve dhe ofruesve brenda platformës.",
      },
      {
        title: "3. Baza Ligjore e Përpunimit",
        body: "Përpunojmë të dhënat tuaja bazuar në: (a) ekzekutimin e kontratës — për të ofruar shërbimin; (b) interesin legjitim — për sigurinë e platformës dhe parandalimin e mashtrimit; (c) pajtimin — për komunikime marketing (mund ta tërhiqni në çdo kohë); (d) detyrimin ligjor — kur kërkohet nga ligji.",
      },
      {
        title: "4. Si i Përdorim të Dhënat",
        body: "Të dhënat tuaja përdoren për: krijimin dhe menaxhimin e llogarisë; lidhjen e klientëve me kontraktorë; dërgimin e njoftimeve dhe përditësimeve; analizën e performancës së platformës; parandalimin e mashtrimit dhe aktiviteteve të paligjshme; plotësimin e detyrimeve ligjore.",
      },
      {
        title: "5. Ndarja e të Dhënave me Palë të Treta",
        body: "Nuk shesim të dhënat tuaja personale. Mund t'i ndajmë me: (a) ofrues shërbimesh teknike (hosting, email) nën marrëveshje konfidencialiteti; (b) autoritete qeveritare kur kërkohet me urdhër gjykate; (c) blerës potencialë në rast shitjeje biznesi, me njoftim paraprak.",
      },
      {
        title: "6. Transferta Ndërkombëtare",
        body: "Të dhënat mund të transferohen jashtë Shqipërisë (p.sh. tek serverët e BE-së). Çdo transfertë kryhet me mbrojtje adekuate sipas standardeve të GDPR, duke përfshirë klauzolat kontraktuale standarde.",
      },
      {
        title: "7. Periudha e Ruajtjes",
        body: "Ruajmë të dhënat tuaja: derisa llogaria juaj është aktive; 3 vjet pas mbylljes së llogarisë për qëllime ligjore; deri në 7 vjet për të dhënat financiare sipas ligjit tatimor.",
      },
      {
        title: "8. Të Drejtat Tuaja (GDPR)",
        body: "Keni të drejtën të: aksesoni të dhënat tuaja; korrigjoni të dhëna të passakta; fshini të dhënat ('e drejta për t'u harruar'); kufizoni përpunimin; kundërshtoni përpunimin; portabilitetit të të dhënave; tërhiqni pajtimin. Për të ushtruar këto të drejta: privacy@immovia.com. Keni gjithashtu të drejtën të ankoheni tek Komisioneri i Mbrojtjes së të Dhënave Personale i Shqipërisë.",
      },
      {
        title: "9. Cookies dhe Teknologjitë e Gjurmimit",
        body: "Përdorim cookies esenciale (sesioni, autentikimi) dhe analitike (trafikut të platformës). Nuk përdorim cookies reklamuese të palëve të treta. Mund t'i çaktivizoni cookies analitike nga cilësimet e shfletuesit, por kjo mund të ndikojë funksionalitetin.",
      },
      {
        title: "10. Siguria e të Dhënave",
        body: "Zbatojmë masa teknike dhe organizative për mbrojtjen e të dhënave: enkriptim TLS për transfertën e të dhënave; hash-im të fjalëkalimeve me bcrypt; kufizimet e aksesit sipas rolit; monitorim të vazhdueshëm të sigurisë; backup të rregullta. Nuk mund të garantojmë siguri absolute, por njoftojmë autoriteteve brenda 72 orëve për çdo shkelje.",
      },
      {
        title: "11. Ndryshimet e Politikës",
        body: "Çdo ndryshim material do të njoftohet me email të paktën 30 ditë para hyrjes në fuqi. Data e përditësimit në krye të faqes tregon versionin aktual.",
      },
      {
        title: "12. Na Kontaktoni",
        body: "Zyrtari ynë i Mbrojtjes së të Dhënave: privacy@immovia.com | ImmoVia365 SH.P.K., Rruga e Durrësit, Tiranë, Shqipëri",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: January 1, 2025",
    intro: "ImmoVia365 ('we', 'us', 'platform') is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights under GDPR and applicable law.",
    sections: [
      {
        title: "1. Data Controller",
        body: "The data controller is ImmoVia365 LLC, headquartered in Tirana, Albania. Email: privacy@immovia.com",
      },
      {
        title: "2. Data We Collect",
        body: "We collect: (a) identification data — name, email, phone number; (b) professional data — company name, services, licences; (c) project data — description, location, budget; (d) technical data — IP address, browser type, login time; (e) communications — messages between clients and providers within the platform.",
      },
      {
        title: "3. Legal Basis for Processing",
        body: "We process your data on the basis of: (a) contract performance — to deliver the service; (b) legitimate interest — for platform security and fraud prevention; (c) consent — for marketing communications (withdrawable at any time); (d) legal obligation — when required by law.",
      },
      {
        title: "4. How We Use Your Data",
        body: "Your data is used to: create and manage your account; connect clients with contractors; send notifications and updates; analyse platform performance; prevent fraud and illegal activities; fulfil legal obligations.",
      },
      {
        title: "5. Sharing Data with Third Parties",
        body: "We do not sell your personal data. We may share it with: (a) technical service providers (hosting, email) under confidentiality agreements; (b) government authorities when required by court order; (c) potential buyers in the event of a business sale, with prior notice.",
      },
      {
        title: "6. International Transfers",
        body: "Data may be transferred outside Albania (e.g. to EU servers). Every transfer is carried out with adequate safeguards in line with GDPR standards, including standard contractual clauses.",
      },
      {
        title: "7. Retention Period",
        body: "We retain your data: while your account is active; 3 years after account closure for legal purposes; up to 7 years for financial data under tax law.",
      },
      {
        title: "8. Your Rights (GDPR)",
        body: "You have the right to: access your data; rectify inaccurate data; erase data ('right to be forgotten'); restrict processing; object to processing; data portability; withdraw consent. To exercise these rights: privacy@immovia.com. You also have the right to lodge a complaint with the Albanian Personal Data Protection Commissioner.",
      },
      {
        title: "9. Cookies and Tracking Technologies",
        body: "We use essential cookies (session, authentication) and analytics cookies (platform traffic). We do not use third-party advertising cookies. You can disable analytics cookies in your browser settings, but this may affect functionality.",
      },
      {
        title: "10. Data Security",
        body: "We implement technical and organisational measures to protect data: TLS encryption for data transfer; bcrypt password hashing; role-based access controls; continuous security monitoring; regular backups. We cannot guarantee absolute security, but notify authorities within 72 hours of any breach.",
      },
      {
        title: "11. Policy Changes",
        body: "Any material changes will be notified by email at least 30 days before taking effect. The update date at the top of this page indicates the current version.",
      },
      {
        title: "12. Contact Us",
        body: "Our Data Protection Officer: privacy@immovia.com | ImmoVia365 LLC, Rruga e Durrësit, Tirana, Albania",
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: 1. Januar 2025",
    intro: "ImmoVia365 ('wir', 'uns', 'Plattform') verpflichtet sich zum Schutz Ihrer Privatsphäre. Diese Richtlinie erläutert, welche Daten wir erfassen, wie wir sie nutzen und Ihre Rechte gemäß DSGVO und geltendem Recht.",
    sections: [
      {
        title: "1. Verantwortlicher",
        body: "Verantwortlicher für die Datenverarbeitung ist ImmoVia365 GmbH mit Sitz in Tirana, Albanien. E-Mail: privacy@immovia.com",
      },
      {
        title: "2. Erhobene Daten",
        body: "Wir erheben: (a) Identifikationsdaten — Name, E-Mail, Telefonnummer; (b) berufliche Daten — Firmenname, Dienstleistungen, Lizenzen; (c) Projektdaten — Beschreibung, Standort, Budget; (d) technische Daten — IP-Adresse, Browsertyp, Anmeldezeit; (e) Kommunikation — Nachrichten zwischen Kunden und Anbietern innerhalb der Plattform.",
      },
      {
        title: "3. Rechtsgrundlage der Verarbeitung",
        body: "Wir verarbeiten Ihre Daten auf Basis von: (a) Vertragserfüllung — zur Erbringung des Dienstes; (b) berechtigtem Interesse — zur Plattformsicherheit und Betrugsprävention; (c) Einwilligung — für Marketingkommunikation (jederzeit widerrufbar); (d) rechtlicher Verpflichtung — wenn gesetzlich vorgeschrieben.",
      },
      {
        title: "4. Verwendung Ihrer Daten",
        body: "Ihre Daten werden genutzt für: Erstellung und Verwaltung Ihres Kontos; Verbindung von Kunden mit Auftragnehmern; Versand von Benachrichtigungen und Updates; Analyse der Plattformleistung; Betrugs- und Missbrauchsprävention; Erfüllung rechtlicher Pflichten.",
      },
      {
        title: "5. Weitergabe an Dritte",
        body: "Wir verkaufen Ihre personenbezogenen Daten nicht. Eine Weitergabe erfolgt an: (a) technische Dienstleister (Hosting, E-Mail) unter Vertraulichkeitsvereinbarungen; (b) Behörden bei gerichtlicher Anordnung; (c) potenzielle Käufer im Falle eines Unternehmensverkaufs mit vorheriger Benachrichtigung.",
      },
      {
        title: "6. Internationale Übermittlungen",
        body: "Daten können außerhalb Albaniens übermittelt werden (z. B. auf EU-Server). Jede Übermittlung erfolgt mit angemessenen Schutzmaßnahmen gemäß DSGVO-Standards, einschließlich Standardvertragsklauseln.",
      },
      {
        title: "7. Speicherdauer",
        body: "Wir speichern Ihre Daten: solange Ihr Konto aktiv ist; 3 Jahre nach Kontoschließung für rechtliche Zwecke; bis zu 7 Jahre für Finanzdaten gemäß Steuerrecht.",
      },
      {
        title: "8. Ihre Rechte (DSGVO)",
        body: "Sie haben das Recht auf: Auskunft über Ihre Daten; Berichtigung unrichtiger Daten; Löschung ('Recht auf Vergessenwerden'); Einschränkung der Verarbeitung; Widerspruch gegen die Verarbeitung; Datenübertragbarkeit; Widerruf der Einwilligung. Zur Ausübung dieser Rechte: privacy@immovia.com. Sie haben auch das Recht, beim albanischen Datenschutzbeauftragten Beschwerde einzulegen.",
      },
      {
        title: "9. Cookies und Tracking",
        body: "Wir verwenden essentielle Cookies (Sitzung, Authentifizierung) und Analyse-Cookies (Plattformverkehr). Wir verwenden keine Drittanbieter-Werbe-Cookies. Sie können Analyse-Cookies in Ihren Browsereinstellungen deaktivieren, was jedoch die Funktionalität beeinträchtigen kann.",
      },
      {
        title: "10. Datensicherheit",
        body: "Wir implementieren technische und organisatorische Maßnahmen: TLS-Verschlüsselung für die Datenübertragung; Passwort-Hashing mit bcrypt; rollenbasierte Zugriffskontrollen; kontinuierliches Sicherheitsmonitoring; regelmäßige Backups. Absolute Sicherheit können wir nicht garantieren, informieren Behörden jedoch innerhalb von 72 Stunden über etwaige Verstöße.",
      },
      {
        title: "11. Änderungen der Richtlinie",
        body: "Wesentliche Änderungen werden mindestens 30 Tage vor Inkrafttreten per E-Mail mitgeteilt. Das Aktualisierungsdatum oben auf dieser Seite gibt die aktuelle Version an.",
      },
      {
        title: "12. Kontakt",
        body: "Unser Datenschutzbeauftragter: privacy@immovia.com | ImmoVia365 GmbH, Rruga e Durrësit, Tirana, Albanien",
      },
    ],
  },
  fr: {
    title: "Politique de Confidentialité",
    updated: "Dernière mise à jour : 1er janvier 2025",
    intro: "ImmoVia365 ('nous', 'notre plateforme') s'engage à protéger votre vie privée. Cette politique explique quelles données nous collectons, comment nous les utilisons et vos droits en vertu du RGPD et de la législation applicable.",
    sections: [
      {
        title: "1. Responsable du traitement",
        body: "Le responsable du traitement est ImmoVia365 SARL, dont le siège est à Tirana, Albanie. Email : privacy@immovia.com",
      },
      {
        title: "2. Données collectées",
        body: "Nous collectons : (a) données d'identification — nom, email, numéro de téléphone ; (b) données professionnelles — nom de l'entreprise, services, licences ; (c) données de projet — description, localisation, budget ; (d) données techniques — adresse IP, type de navigateur, heure de connexion ; (e) communications — messages entre clients et prestataires au sein de la plateforme.",
      },
      {
        title: "3. Base juridique du traitement",
        body: "Nous traitons vos données sur la base : (a) de l'exécution du contrat — pour fournir le service ; (b) de l'intérêt légitime — pour la sécurité de la plateforme et la prévention des fraudes ; (c) du consentement — pour les communications marketing (révocable à tout moment) ; (d) de l'obligation légale — lorsque la loi l'exige.",
      },
      {
        title: "4. Utilisation de vos données",
        body: "Vos données sont utilisées pour : créer et gérer votre compte ; mettre en relation clients et entrepreneurs ; envoyer des notifications et mises à jour ; analyser les performances de la plateforme ; prévenir les fraudes et activités illégales ; remplir les obligations légales.",
      },
      {
        title: "5. Partage avec des tiers",
        body: "Nous ne vendons pas vos données personnelles. Nous pouvons les partager avec : (a) des prestataires techniques (hébergement, email) sous accord de confidentialité ; (b) des autorités publiques sur ordonnance judiciaire ; (c) des acquéreurs potentiels en cas de cession d'entreprise, avec notification préalable.",
      },
      {
        title: "6. Transferts internationaux",
        body: "Les données peuvent être transférées hors d'Albanie (ex. vers des serveurs UE). Chaque transfert est effectué avec des garanties adéquates conformes aux normes RGPD, notamment les clauses contractuelles types.",
      },
      {
        title: "7. Durée de conservation",
        body: "Nous conservons vos données : tant que votre compte est actif ; 3 ans après la clôture du compte à des fins légales ; jusqu'à 7 ans pour les données financières en vertu du droit fiscal.",
      },
      {
        title: "8. Vos droits (RGPD)",
        body: "Vous avez le droit : d'accéder à vos données ; de rectifier des données inexactes ; d'effacer vos données ('droit à l'oubli') ; de limiter le traitement ; de vous opposer au traitement ; à la portabilité des données ; de retirer votre consentement. Pour exercer ces droits : privacy@immovia.com. Vous avez également le droit de déposer une plainte auprès du Commissaire albanais à la protection des données.",
      },
      {
        title: "9. Cookies et technologies de suivi",
        body: "Nous utilisons des cookies essentiels (session, authentification) et analytiques (trafic de la plateforme). Nous n'utilisons pas de cookies publicitaires tiers. Vous pouvez désactiver les cookies analytiques dans les paramètres de votre navigateur, ce qui peut affecter certaines fonctionnalités.",
      },
      {
        title: "10. Sécurité des données",
        body: "Nous mettons en œuvre des mesures techniques et organisationnelles : chiffrement TLS pour le transfert des données ; hachage des mots de passe avec bcrypt ; contrôles d'accès basés sur les rôles ; surveillance continue de la sécurité ; sauvegardes régulières. Nous ne pouvons garantir une sécurité absolue, mais notifions les autorités dans les 72 heures en cas de violation.",
      },
      {
        title: "11. Modifications de la politique",
        body: "Tout changement substantiel sera notifié par email au moins 30 jours avant son entrée en vigueur. La date de mise à jour en haut de cette page indique la version actuelle.",
      },
      {
        title: "12. Nous contacter",
        body: "Notre Délégué à la Protection des Données : privacy@immovia.com | ImmoVia365 SARL, Rruga e Durrësit, Tirana, Albanie",
      },
    ],
  },
};

export default function Privacy() {
  const { language } = useLanguage();
  usePageMeta({
    title: "Datenschutzrichtlinie | ImmoVia365",
    description: "Erfahren Sie, wie ImmoVia365 Ihre persönlichen Daten gemäß DSGVO und Schweizer Datenschutzgesetz (DSG) schützt und verarbeitet.",
    noindex: false,
  });
  useStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Datenschutz", "item": `${APP_URL}/privacy` }
    ]
  });
  const c = content[language] ?? content.en;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-8 w-8 text-primary" />
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

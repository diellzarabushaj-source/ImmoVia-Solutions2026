const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'artifacts', 'immovia', 'src', 'lib', 'translations.ts');
let s = fs.readFileSync(file, 'utf8');

// Ordered exact-phrase replacements. Longer/compound phrases MUST come before shorter ones.
// We operate on distinctive inner phrases (not key names) and quoted-value forms where a bare
// word would corrupt camelCase keys (e.g. totalCompanies / Firmenname).
const pairs = [
  // ===================== ALBANIAN (sq) =====================
  // Type 1 -> Klient
  ['Postuesit e Projekteve me Ofrues', 'Klientët me Ofrues'],
  ['Postues Individual Projektesh', 'Klient Individual'],
  ['Postues Kompanie Projektesh', 'Klient Kompani'],
  ['postuara nga Postuesit e aprovuar', 'postuara nga Klientët e aprovuar'],
  ['Postuesit të Projektit', 'Klientit'],
  ['Postues Projektesh', 'Klient'],
  ['Postues Projekti', 'Klient'],
  ['Kërkesat e fundit të pronarëve', 'Kërkesat e fundit të klientëve'],
  // Type 2 -> Ofrues Shërbimi
  ['Profesionistët Tanë', 'Ofruesit Tanë të Shërbimit'],
  ['Shfleto profesionistët dhe kompanitë e verifikuara nga ImmoVia.', 'Shfleto Ofruesit e Shërbimit të verifikuar nga ImmoVia.'],
  ['profesionistët e verifikuar', 'Ofruesit e Shërbimit të verifikuar'],
  ['Profesionistë të Verifikuar', 'Ofrues Shërbimi të Verifikuar'],
  ['I lidhur me profesionist', 'I lidhur me Ofrues Shërbimi'],
  ['oferta nga kontraktorë të kualifikuar', 'oferta nga Ofrues Shërbimi të kualifikuar'],
  ['Lidheni me profesionistët', 'Lidheni me Ofruesit e Shërbimit'],
  ['Ne ju lidhim me kontraktorë të verifikuar', 'Ne ju lidhim me Ofrues Shërbimi të verifikuar'],
  ['Merrni oferta të personalizuara nga kontraktorë të verifikuar', 'Merrni oferta të personalizuara nga Ofrues Shërbimi të verifikuar'],
  ['Krahasoni ofertat dhe zgjidhni profesionistin më të mirë', 'Krahasoni ofertat dhe zgjidhni Ofruesin e Shërbimit më të mirë'],
  ['Për Kontraktorët', 'Për Ofruesit e Shërbimit'],
  ['ndihmuar profesionistët të kuptojnë', 'ndihmuar Ofruesit e Shërbimit të kuptojnë'],
  ['për këtë profesionist?', 'për këtë Ofrues Shërbimi?'],
  ['Profesionist Individual', 'Ofrues Individual Shërbimi'],
  ['Gjej Profesionistin e Duhur', 'Gjej Ofruesin e Duhur të Shërbimit'],
  ['Marketplace i profesionistëve dhe kompanive të verifikuara', 'Marketplace i Ofruesve të Shërbimit të verifikuar'],
  // sq directory/admin (provider directory) - quoted/full forms only
  ["companies: 'Kompanitë'", "companies: 'Ofruesit e Shërbimit'"],
  ["companiesTab: 'Kompanitë'", "companiesTab: 'Ofruesit e Shërbimit'"],
  ['Totali i Kompanive', 'Totali i Ofruesve të Shërbimit'],
  ['Kompani në Pritje', 'Ofrues Shërbimi në Pritje'],
  ['Kthehu te Kompanitë', 'Kthehu te Ofruesit e Shërbimit'],

  // ===================== ENGLISH (en) =====================
  // Type 1 -> Client
  ['Individual Project Poster', 'Individual Client'],
  ['Company Project Poster', 'Company Client'],
  ['Project Posters', 'Clients'],
  ['Project Poster', 'Client'],
  ['Latest homeowner requests', 'Latest client requests'],
  ['Track your projects and chat with contractors.', 'Track your projects and chat with service providers.'],
  // Type 2 -> Service Provider
  ['Our Professionals', 'Our Service Providers'],
  ['Browse verified professionals and companies on ImmoVia.', 'Browse verified Service Providers on ImmoVia.'],
  ['see all verified professionals', 'see all verified Service Providers'],
  ['Verified Professionals', 'Verified Service Providers'],
  ['Matched with a professional', 'Matched with a service provider'],
  ['quotes from qualified contractors in your area', 'quotes from qualified service providers in your area'],
  ['Get matched with professionals', 'Get matched with service providers'],
  ['We connect you with verified contractors in your area', 'We connect you with verified service providers in your area'],
  ['Receive tailored offers from verified contractors', 'Receive tailored offers from verified service providers'],
  ['Compare offers and hire the best professional', 'Compare offers and hire the best service provider'],
  ['For Contractors', 'For Service Providers'],
  ['Add photos to help professionals understand your project', 'Add photos to help service providers understand your project'],
  ['Individual Professional', 'Individual Service Provider'],
  ['Find the Right Professional', 'Find the Right Service Provider'],
  ['Marketplace of verified professionals and companies', 'Marketplace of verified Service Providers'],
  ['Have a project for this professional?', 'Have a project for this service provider?'],
  // en directory/admin (provider directory) - quoted/full forms only
  ["companies: 'Companies'", "companies: 'Service Providers'"],
  ["companiesTab: 'Companies'", "companiesTab: 'Service Providers'"],
  ['Total Companies', 'Total Service Providers'],
  ['Pending Companies', 'Pending Service Providers'],
  ['Back to Companies', 'Back to Service Providers'],

  // ===================== GERMAN (de) =====================
  // Type 1 -> Kunde
  ['Privater Projektausschreiber', 'Privatkunde'],
  ['Unternehmen als Projektausschreiber', 'Geschäftskunde'],
  ['verbindet Projektausschreiber mit', 'verbindet Kunden mit'],
  ['Für Auftraggeber', 'Für Kunden'],
  ['Projektausschreiber', 'Kunde'],
  ['als Auftraggeber, um', 'als Kunde, um'],
  ['Als Auftraggeber Registrieren', 'Als Kunde Registrieren'],
  ['Als Auftraggeber registrieren', 'Als Kunde registrieren'],
  ['Anfragen von Hausbesitzern', 'Anfragen von Kunden'],
  ['Hausbesitzern', 'Kunden'],
  ['Hausbesitzer', 'Kunde'],
  // Type 2 -> Dienstleister
  ['Dienstanbieter', 'Dienstleister'],
  ['Unsere Fachleute', 'Unsere Dienstleister'],
  ['Durchsuchen Sie verifizierte Fachleute und Unternehmen auf ImmoVia.', 'Durchsuchen Sie verifizierte Dienstleister auf ImmoVia.'],
  ['alle verifizierten Fachleute zu sehen', 'alle verifizierten Dienstleister zu sehen'],
  ['Geprüfte Fachleute', 'Geprüfte Dienstleister'],
  ['Mit Fachmann verbunden', 'Mit Dienstleister verbunden'],
  ['Mit Fachleuten verbunden werden', 'Mit Dienstleistern verbunden werden'],
  ['mit verifizierten Handwerkern in Ihrer Nähe', 'mit verifizierten Dienstleistern in Ihrer Nähe'],
  ['von qualifizierten Handwerkern in Ihrer Nähe', 'von qualifizierten Dienstleistern in Ihrer Nähe'],
  ['von geprüften Fachleuten erhalten', 'von geprüften Dienstleistern erhalten'],
  ['den besten Fachmann auswählen', 'den besten Dienstleister auswählen'],
  ['Für Fachleute', 'Für Dienstleister'],
  ['damit Fachbetriebe Ihr Projekt', 'damit Dienstleister Ihr Projekt'],
  ['chatten Sie mit Handwerkern', 'chatten Sie mit Dienstleistern'],
  ['Marktplatz für geprüfte Fachleute und Unternehmen', 'Marktplatz für geprüfte Dienstleister'],
  ['von Service Providern', 'von Dienstleistern'],
  // de directory/admin (provider directory) - quoted/full forms only
  ["companies: 'Firmen'", "companies: 'Dienstleister'"],
  ["companiesTab: 'Firmen'", "companiesTab: 'Dienstleister'"],
  ['Gesamtfirmen', 'Dienstleister gesamt'],
  ['Ausstehende Firmen', 'Ausstehende Dienstleister'],
  ['Zurück zu den Firmen', 'Zurück zu den Dienstleistern'],

  // ===================== FRENCH (fr) =====================
  // Type 1 -> Client
  ["Donneur d'ordre individuel", 'Client individuel'],
  ["Donneurs d'ordre", 'Clients'],
  ["Donneur d'Ordre", 'Client'],
  ["comme donneur d'ordre", 'comme Client'],
  ["Donneur d'ordre", 'Client'],
  ['demandes de propriétaires', 'demandes de clients'],
  // Type 2 -> Prestataire
  ['Nos Professionnels', 'Nos Prestataires'],
  ['Parcourez les professionnels et entreprises vérifiés sur ImmoVia.', 'Parcourez les Prestataires vérifiés sur ImmoVia.'],
  ['pour voir tous les professionnels vérifiés', 'pour voir tous les Prestataires vérifiés'],
  ['Professionnels Vérifiés', 'Prestataires Vérifiés'],
  ['Mis en relation avec un professionnel', 'Mis en relation avec un prestataire'],
  ['Soyez mis en relation avec des professionnels', 'Soyez mis en relation avec des prestataires'],
  ['Recevez des offres personnalisées de professionnels vérifiés', 'Recevez des offres personnalisées de prestataires vérifiés'],
  ['Comparez les offres et choisissez le meilleur professionnel', 'Comparez les offres et choisissez le meilleur prestataire'],
  ['Pour les Professionnels', 'Pour les Prestataires'],
  ['aider les professionnels à comprendre votre projet', 'aider les prestataires à comprendre votre projet'],
  ['Professionnel Individuel', 'Prestataire individuel'],
  ['Trouver le Bon Professionnel', 'Trouver le Bon Prestataire'],
  ['Marketplace de professionnels et sociétés vérifiés', 'Marketplace de Prestataires vérifiés'],
  ['Vous avez un projet pour ce professionnel ?', 'Vous avez un projet pour ce prestataire ?'],
  ['Prestataire de services', 'Prestataire'],
  ['comptes Prestataires de services', 'comptes Prestataires'],
  // fr directory/admin (provider directory) - quoted/full forms only
  ["companies: 'Sociétés'", "companies: 'Prestataires'"],
  ["companiesTab: 'Sociétés'", "companiesTab: 'Prestataires'"],
  ['Total Sociétés', 'Total Prestataires'],
  ['Sociétés en Attente', 'Prestataires en Attente'],
  ['Retour aux Sociétés', 'Retour aux Prestataires'],
];

let report = [];
for (const [oldStr, newStr] of pairs) {
  const count = s.split(oldStr).length - 1;
  if (count > 0) s = s.split(oldStr).join(newStr);
  report.push(`${count}\t${JSON.stringify(oldStr)} -> ${JSON.stringify(newStr)}`);
}
fs.writeFileSync(file, s, 'utf8');
console.log(report.join('\n'));
const zero = report.filter(r => r.startsWith('0\t'));
console.log('\n=== ZERO-MATCH (check these) ===\n' + (zero.length ? zero.join('\n') : 'none'));

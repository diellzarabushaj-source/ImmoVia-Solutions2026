import { db, subscriptionPlansTable, immocreditPacksTable, projectsTable } from "@workspace/db";
import { eq, and, count, notInArray } from "drizzle-orm";
import { logger } from "./logger";

const NEW_PLAN_SLUGS = ["free", "basic", "pro", "premium"];

const PLANS = [
  {
    slug: "free",
    name: "Free",
    priceCents: 0,
    yearlyPriceCents: 0,
    monthlyCredits: 2,
    featured: false,
    badge: null,
    visibilityRank: 0,
    contactVisible: false,
    features: [
      "2 Project Credits/Monat",
      "Basis-Anbieterprofil",
      "Nur registrierte Auftraggeber",
      "Kontaktdaten nicht sichtbar",
      "Nur In-Plattform-Messaging",
      "Niedrigste Sichtbarkeit",
    ],
    sortOrder: 1,
  },
  {
    slug: "basic",
    name: "Basic Provider",
    priceCents: 2900,       // 29 CHF/month
    yearlyPriceCents: 27900, // 279 CHF/year
    monthlyCredits: 10,
    featured: false,
    badge: "Basic Provider",
    visibilityRank: 1,
    contactVisible: true,
    features: [
      "10 Project Credits/Monat",
      "Basic Provider Abzeichen",
      "Kontaktdaten sichtbar (registrierte Auftraggeber)",
      "Nur registrierte Auftraggeber",
      "Standardsichtbarkeit",
    ],
    sortOrder: 2,
  },
  {
    slug: "pro",
    name: "Pro Provider",
    priceCents: 7900,       // 79 CHF/month
    yearlyPriceCents: 75900, // 759 CHF/year
    monthlyCredits: 35,
    featured: true,
    badge: "Pro Provider",
    visibilityRank: 2,
    contactVisible: true,
    features: [
      "35 Project Credits/Monat",
      "Pro Provider Abzeichen",
      "Erscheint über Basic-Anbietern",
      "Bessere Sichtbarkeit",
      "Kontaktdaten sichtbar (registrierte Auftraggeber)",
    ],
    sortOrder: 3,
  },
  {
    slug: "premium",
    name: "Premium Partner",
    priceCents: 14900,       // 149 CHF/month
    yearlyPriceCents: 143000, // 1430 CHF/year
    monthlyCredits: -1,      // -1 = unlimited
    featured: false,
    badge: "Premium Partner",
    visibilityRank: 3,
    contactVisible: true,
    features: [
      "Unbegrenzte Project Credits",
      "Premium Partner Abzeichen",
      "Erstplatzierung in Anbieterlisten",
      "Zugang zu nicht-registrierten Leads",
      "Kontaktdaten für alle sichtbar",
      "Featured Platzierung",
    ],
    sortOrder: 4,
  },
];

const PACKS = [
  { slug: "mini", name: "Mini Pack", priceCents: 1200, credits: 10, sortOrder: 1 },
  { slug: "starter", name: "Starter Pack", priceCents: 2500, credits: 25, sortOrder: 2 },
  { slug: "growth", name: "Growth Pack", priceCents: 5500, credits: 60, sortOrder: 3 },
  { slug: "business", name: "Business Pack", priceCents: 12900, credits: 150, sortOrder: 4 },
  { slug: "pro", name: "Pro Pack", priceCents: 22900, credits: 300, sortOrder: 5 },
];

export async function seedBilling(): Promise<void> {
  try {
    await db
      .delete(subscriptionPlansTable)
      .where(notInArray(subscriptionPlansTable.slug, NEW_PLAN_SLUGS));

    for (const p of PLANS) {
      await db
        .insert(subscriptionPlansTable)
        .values(p)
        .onConflictDoUpdate({
          target: subscriptionPlansTable.slug,
          set: {
            name: p.name,
            priceCents: p.priceCents,
            yearlyPriceCents: p.yearlyPriceCents,
            monthlyCredits: p.monthlyCredits,
            featured: p.featured,
            features: p.features,
            sortOrder: p.sortOrder,
            badge: p.badge,
            visibilityRank: p.visibilityRank,
            contactVisible: p.contactVisible,
          },
        });
    }
    for (const p of PACKS) {
      await db
        .insert(immocreditPacksTable)
        .values(p)
        .onConflictDoUpdate({
          target: immocreditPacksTable.slug,
          set: {
            name: p.name,
            priceCents: p.priceCents,
            credits: p.credits,
            sortOrder: p.sortOrder,
          },
        });
    }
    logger.info("Billing seed complete");
  } catch (err) {
    logger.error({ err }, "Billing seed failed");
  }
}

const DEMO_PROJECTS = [
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 44 000 00 01", projectType: "exterior", description: "Für ein Einfamilienhaus in Zürich werden professionelle Fassadenarbeiten gesucht. Die Fassade soll geprüft, gereinigt, ausgebessert und neu gestrichen werden.", city: "Zürich", budget: "Bis CHF 10'000", timeline: "1–3 Monate", title: "Fassade eines Einfamilienhauses sanieren", size: "small" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 31 000 00 02", projectType: "renovation", description: "Ein bestehendes Badezimmer soll modernisiert werden. Gewünscht sind neue Platten, eine moderne Dusche, ein neues Lavabo, WC und hochwertige Armaturen.", city: "Bern", budget: "CHF 10'000 – 25'000", timeline: "2–6 Wochen", title: "Badezimmer komplett modernisieren", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 61 000 00 03", projectType: "interior", description: "Eine 4-Zimmer-Wohnung soll komplett neu gestrichen werden. Wände und Decken müssen vorbereitet und sauber weiss gestrichen werden.", city: "Basel", budget: "CHF 3'000 – 7'000", timeline: "1–2 Wochen", title: "4-Zimmer-Wohnung neu streichen", size: "small" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 41 000 00 04", projectType: "interior", description: "Alter Boden soll entfernt und neuer Parkett im Wohnzimmer sowie in zwei Schlafzimmern verlegt werden. Materialberatung ist erwünscht.", city: "Luzern", budget: "CHF 5'000 – 12'000", timeline: "2–4 Wochen", title: "Parkettboden in Wohnräumen verlegen", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 52 000 00 05", projectType: "interior", description: "Die alte Küche soll demontiert und durch eine moderne Küche ersetzt werden. Gesucht wird ein Unternehmen für Planung, Lieferung und Montage.", city: "Winterthur", budget: "CHF 15'000 – 35'000", timeline: "1–2 Monate", title: "Küche demontieren und neu einbauen", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 71 000 00 06", projectType: "electric", description: "In einem Einfamilienhaus sollen zusätzliche Steckdosen, neue Lichtschalter und moderne LED-Beleuchtung installiert werden.", city: "St. Gallen", budget: "CHF 4'000 – 10'000", timeline: "2–5 Wochen", title: "Elektroinstallation im Einfamilienhaus erweitern", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 21 000 00 07", projectType: "exterior", description: "Der Garten soll neu gestaltet werden. Gewünscht sind ein Sitzplatz, neue Pflanzen, Rasenarbeiten und ein kleiner Weg mit Steinplatten.", city: "Lausanne", budget: "CHF 8'000 – 18'000", timeline: "1–2 Monate", title: "Garten mit Sitzplatz neu gestalten", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 41 000 00 08", projectType: "other", description: "Nach Renovierungsarbeiten wird eine gründliche Baureinigung benötigt. Fenster, Böden, Küche, Bad und allgemeine Flächen sollen gereinigt werden.", city: "Zug", budget: "Bis CHF 2'000", timeline: "1–3 Tage", title: "Wohnung nach Renovierung reinigen", size: "small" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 33 000 00 09", projectType: "other", description: "Die bestehende Heizung soll ersetzt werden. Gesucht wird eine energieeffiziente Lösung mit Beratung, Planung und Installation.", city: "Thun", budget: "CHF 20'000 – 45'000", timeline: "1–3 Monate", title: "Neue Heizlösung für Einfamilienhaus installieren", size: "large" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 91 000 00 10", projectType: "interior", description: "Im Badezimmer und Eingangsbereich sollen neue Platten verlegt werden. Alte Platten müssen entfernt und der Untergrund vorbereitet werden.", city: "Lugano", budget: "CHF 4'000 – 9'000", timeline: "2–4 Wochen", title: "Badezimmer und Eingangsbereich neu verplatten", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 22 000 00 11", projectType: "electric", description: "Eine Wohnung soll mit Smart-Home-Funktionen ausgestattet werden. Beleuchtung, Heizung und Sicherheitssystem sollen zentral gesteuert werden können.", city: "Genève", budget: "CHF 5'000 – 15'000", timeline: "3–6 Wochen", title: "Smart-Home-System in Wohnung einrichten", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 62 000 00 12", projectType: "renovation", description: "Eine ältere 3.5-Zimmer-Wohnung soll komplett renoviert werden. Benötigt werden Maler, Bodenleger, Sanitärarbeiten und kleinere Innenausbauarbeiten.", city: "Aarau", budget: "CHF 25'000 – 50'000", timeline: "2–4 Monate", title: "Ältere 3.5-Zimmer-Wohnung komplett renovieren", size: "large" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 52 000 00 13", projectType: "interior", description: "Für den Eingangsbereich wird ein moderner Einbauschrank nach Mass gesucht. Das Design soll schlicht, hochwertig und platzsparend sein.", city: "Schaffhausen", budget: "CHF 3'000 – 8'000", timeline: "2–5 Wochen", title: "Einbauschrank nach Mass planen und montieren", size: "small" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 32 000 00 14", projectType: "renovation", description: "Eine kleine Bürofläche soll modernisiert werden. Gewünscht sind neue Farbe, neuer Boden, bessere Beleuchtung und kleinere Anpassungen im Innenausbau.", city: "Biel/Bienne", budget: "CHF 10'000 – 25'000", timeline: "1–2 Monate", title: "Kleine Bürofläche modernisieren", size: "medium" },
  { fullName: "ImmoVia Demo", email: "demo@immovia365.ch", phone: "+41 44 000 00 15", projectType: "other", description: "Eine Wohnung soll vor dem Verkauf professionell vorbereitet werden. Gesucht werden kleinere Reparaturen, Reinigung, Home-Staging und optische Aufwertung.", city: "Zürich", budget: "CHF 2'000 – 6'000", timeline: "1–2 Wochen", title: "Wohnung für Verkauf vorbereiten", size: "small" },
];

export async function seedDemoProjects(): Promise<void> {
  try {
    const [{ value: existing }] = await db
      .select({ value: count() })
      .from(projectsTable)
      .where(and(eq(projectsTable.email, "demo@immovia365.ch"), eq(projectsTable.status, "open")));

    if (existing >= 15) {
      logger.info("Demo projects already seeded — skipping");
      return;
    }

    await db.delete(projectsTable).where(eq(projectsTable.email, "demo@immovia365.ch"));
    await db.insert(projectsTable).values(
      DEMO_PROJECTS.map(p => ({ ...p, status: "open" as const, photos: [] }))
    );
    logger.info({ inserted: DEMO_PROJECTS.length }, "Demo projects seeded");
  } catch (err) {
    logger.error({ err }, "Demo project seed failed");
  }
}

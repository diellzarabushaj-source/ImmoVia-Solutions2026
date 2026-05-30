export type Lang = "en" | "de" | "sq" | "fr";
export type MultiLang = Record<Lang, string>;

export interface CategoryTag {
  key: string;
  label: MultiLang;
}

export interface Category {
  key: string;
  iconName: string;
  photo: string;
  label: MultiLang;
  tags: CategoryTag[];
}

export const CATEGORIES: Category[] = [
  {
    key: "renovation",
    iconName: "Hammer",
    photo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&fit=crop",
    label: { en: "Renovation & Remodeling", de: "Renovierung & Umbau", sq: "Rinovim & Ndërtim", fr: "Rénovation & Réaménagement" },
    tags: [
      { key: "apartment_renovation", label: { en: "Apartment renovation", de: "Wohnungsrenovierung", sq: "Rinovim apartamenti", fr: "Rénovation d'appartement" } },
      { key: "house_renovation",     label: { en: "House renovation",     de: "Hausrenovierung",    sq: "Rinovim shtëpie",      fr: "Rénovation de maison" } },
      { key: "interior_finishing",   label: { en: "Interior finishing",   de: "Innenausbau",        sq: "Përfundim interior",   fr: "Finition intérieure" } },
      { key: "old_building",         label: { en: "Old building renovation", de: "Altbaurenovierung", sq: "Rinovim ndërtese të vjetër", fr: "Rénovation d'ancien bâtiment" } },
      { key: "full_renovation",      label: { en: "Full renovation",      de: "Komplettrenovierung", sq: "Rinovim i plotë",      fr: "Rénovation complète" } },
      { key: "other",                label: { en: "Other",                de: "Sonstiges",          sq: "Tjetër",               fr: "Autre" } },
    ],
  },
  {
    key: "painting",
    iconName: "Paintbrush",
    photo: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&fit=crop",
    label: { en: "Painting & Plastering", de: "Maler & Verputz", sq: "Lyerje & Suvatim", fr: "Peinture & Plâtrage" },
    tags: [
      { key: "interior_painting", label: { en: "Interior painting", de: "Innenanstrich",    sq: "Lyerje interiori",  fr: "Peinture intérieure" } },
      { key: "exterior_painting", label: { en: "Exterior painting", de: "Außenanstrich",    sq: "Lyerje eksteriori", fr: "Peinture extérieure" } },
      { key: "wall_design",       label: { en: "Wall design",       de: "Wandgestaltung",   sq: "Dizajn murësh",     fr: "Design mural" } },
      { key: "plastering",        label: { en: "Plastering",        de: "Verputzen",         sq: "Suvatim",           fr: "Plâtrage" } },
      { key: "facade_work",       label: { en: "Facade work",       de: "Fassadenarbeit",   sq: "Punime fasade",     fr: "Travaux de façade" } },
      { key: "other",             label: { en: "Other",             de: "Sonstiges",        sq: "Tjetër",            fr: "Autre" } },
    ],
  },
  {
    key: "electrical",
    iconName: "Zap",
    photo: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&fit=crop",
    label: { en: "Electrical & Smart Home", de: "Elektro & Smart Home", sq: "Elektrik & Smart Home", fr: "Électricité & Maison intelligente" },
    tags: [
      { key: "electrical_installation", label: { en: "Electrical installation", de: "Elektroinstallation", sq: "Instalim elektrik",        fr: "Installation électrique" } },
      { key: "lighting",                label: { en: "Lighting",               de: "Beleuchtung",          sq: "Ndriçim",                   fr: "Éclairage" } },
      { key: "sockets_switches",        label: { en: "Sockets & switches",     de: "Steckdosen & Schalter", sq: "Priza & çelësa",           fr: "Prises & interrupteurs" } },
      { key: "smart_home",              label: { en: "Smart home",             de: "Smart Home",           sq: "Shtëpi inteligjente",       fr: "Maison connectée" } },
      { key: "security_systems",        label: { en: "Security systems",       de: "Sicherheitssysteme",   sq: "Sisteme sigurie",           fr: "Systèmes de sécurité" } },
      { key: "other",                   label: { en: "Other",                  de: "Sonstiges",            sq: "Tjetër",                    fr: "Autre" } },
    ],
  },
  {
    key: "plumbing",
    iconName: "Wrench",
    photo: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=600&q=80&fit=crop",
    label: { en: "Plumbing & Bathroom", de: "Sanitär & Bad", sq: "Hidraulikë & Banjë", fr: "Plomberie & Salle de bain" },
    tags: [
      { key: "bathroom_renovation",    label: { en: "Bathroom renovation",    de: "Badrenovierung",        sq: "Rinovim banjo",        fr: "Rénovation de salle de bain" } },
      { key: "plumbing_installation",  label: { en: "Plumbing installation",  de: "Sanitärinstallation",   sq: "Instalim hidraulik",   fr: "Installation de plomberie" } },
      { key: "shower_bathtub",         label: { en: "Shower & bathtub",       de: "Dusche & Badewanne",    sq: "Dush & vaskë",         fr: "Douche & baignoire" } },
      { key: "water_connections",      label: { en: "Water connections",      de: "Wasseranschlüsse",      sq: "Lidhje uji",           fr: "Raccordements d'eau" } },
      { key: "repairs",                label: { en: "Repairs",                de: "Reparaturen",           sq: "Riparime",             fr: "Réparations" } },
      { key: "other",                  label: { en: "Other",                  de: "Sonstiges",             sq: "Tjetër",               fr: "Autre" } },
    ],
  },
  {
    key: "kitchen",
    iconName: "ChefHat",
    photo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop",
    label: { en: "Kitchen & Carpentry", de: "Küche & Schreiner", sq: "Kuzhinë & Marangozi", fr: "Cuisine & Menuiserie" },
    tags: [
      { key: "kitchen_renovation",  label: { en: "Kitchen renovation",  de: "Küchenrenovierung",  sq: "Rinovim kuzhine",       fr: "Rénovation de cuisine" } },
      { key: "kitchen_installation",label: { en: "Kitchen installation", de: "Kücheninstallation", sq: "Instalim kuzhine",      fr: "Installation de cuisine" } },
      { key: "custom_furniture",    label: { en: "Custom furniture",    de: "Maßmöbel",           sq: "Mobilie me porosi",     fr: "Mobilier sur mesure" } },
      { key: "built_in_cabinets",   label: { en: "Built-in cabinets",   de: "Einbauschränke",     sq: "Dollapë të integruara", fr: "Armoires encastrées" } },
      { key: "doors_woodwork",      label: { en: "Doors & woodwork",    de: "Türen & Holzarbeiten", sq: "Dyer & punë druri",   fr: "Portes & menuiserie" } },
      { key: "other",               label: { en: "Other",               de: "Sonstiges",          sq: "Tjetër",               fr: "Autre" } },
    ],
  },
  {
    key: "flooring",
    iconName: "SquareStack",
    photo: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=80&fit=crop",
    label: { en: "Flooring & Tiles", de: "Bodenbeläge & Fliesen", sq: "Dysheme & Pllaka", fr: "Revêtements de sol & Carrelage" },
    tags: [
      { key: "parquet",       label: { en: "Parquet",       de: "Parkett",       sq: "Parket",            fr: "Parquet" } },
      { key: "laminate",      label: { en: "Laminate",      de: "Laminat",       sq: "Laminat",           fr: "Stratifié" } },
      { key: "vinyl_flooring",label: { en: "Vinyl flooring",de: "Vinylboden",    sq: "Dysheme vinili",    fr: "Sol vinyle" } },
      { key: "tiles",         label: { en: "Tiles",         de: "Fliesen",       sq: "Pllaka",            fr: "Carrelage" } },
      { key: "floor_repair",  label: { en: "Floor repair",  de: "Bodenreparatur",sq: "Riparim dyshemeje", fr: "Réparation de sol" } },
      { key: "other",         label: { en: "Other",         de: "Sonstiges",     sq: "Tjetër",            fr: "Autre" } },
    ],
  },
  {
    key: "interior_design",
    iconName: "Sofa",
    photo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80&fit=crop",
    label: { en: "Interior Design & Home Staging", de: "Innenarchitektur & Home Staging", sq: "Dizajn Interior & Home Staging", fr: "Design d'intérieur & Home Staging" },
    tags: [
      { key: "room_concept",     label: { en: "Room concept",     de: "Raumkonzept",         sq: "Konceptim dhome",    fr: "Concept de pièce" } },
      { key: "furnishing",       label: { en: "Furnishing",       de: "Einrichtung",          sq: "Mobilim",            fr: "Ameublement" } },
      { key: "color_concept",    label: { en: "Color concept",    de: "Farbkonzept",          sq: "Konceptim ngjyrash", fr: "Concept de couleurs" } },
      { key: "lighting_concept", label: { en: "Lighting concept", de: "Lichtkonzept",         sq: "Konceptim ndriçimi", fr: "Concept d'éclairage" } },
      { key: "property_styling", label: { en: "Property styling", de: "Immobilien-Styling",   sq: "Stilim prona",       fr: "Stylisme immobilier" } },
      { key: "other",            label: { en: "Other",            de: "Sonstiges",            sq: "Tjetër",             fr: "Autre" } },
    ],
  },
  {
    key: "cleaning",
    iconName: "Leaf",
    photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
    label: { en: "Cleaning, Garden & Property Services", de: "Reinigung, Garten & Liegenschaftsdienste", sq: "Pastrim, Kopsht & Shërbime Pronash", fr: "Nettoyage, Jardin & Services immobiliers" },
    tags: [
      { key: "move_out_cleaning",     label: { en: "Move-out cleaning",    de: "Auszugsreinigung",      sq: "Pastrimi pas largimit",     fr: "Nettoyage de fin de bail" } },
      { key: "construction_cleaning", label: { en: "Construction cleaning", de: "Baureinigung",          sq: "Pastrimi pas ndërtimit",    fr: "Nettoyage de chantier" } },
      { key: "garden_maintenance",    label: { en: "Garden maintenance",    de: "Gartenpflege",          sq: "Mirëmbajtje kopshti",       fr: "Entretien de jardin" } },
      { key: "facility_maintenance",  label: { en: "Facility maintenance",  de: "Liegenschaftsunterhalt",sq: "Mirëmbajtje objekti",       fr: "Maintenance des installations" } },
      { key: "property_services",     label: { en: "Property services",     de: "Liegenschaftsdienste",  sq: "Shërbime pronash",          fr: "Services immobiliers" } },
      { key: "other",                 label: { en: "Other",                 de: "Sonstiges",             sq: "Tjetër",                    fr: "Autre" } },
    ],
  },
  {
    key: "other",
    iconName: "HelpCircle",
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop",
    label: { en: "Other", de: "Sonstiges", sq: "Tjetër", fr: "Autre" },
    tags: [
      { key: "general_request", label: { en: "General request", de: "Allgemeine Anfrage",    sq: "Kërkesë e përgjithshme", fr: "Demande générale" } },
      { key: "not_sure",        label: { en: "Not sure yet",    de: "Noch nicht sicher",     sq: "Ende jo i sigurt",       fr: "Pas encore sûr" } },
      { key: "custom_project",  label: { en: "Custom project",  de: "Individuelles Projekt", sq: "Projekt i veçantë",      fr: "Projet sur mesure" } },
      { key: "consultation",    label: { en: "Consultation",    de: "Beratung",              sq: "Konsultim",              fr: "Consultation" } },
      { key: "special_service", label: { en: "Special service", de: "Sonderleistung",        sq: "Shërbim special",        fr: "Service spécial" } },
      { key: "other",           label: { en: "Other",           de: "Sonstiges",             sq: "Tjetër",                 fr: "Autre" } },
    ],
  },
];

export const CATEGORY_KEYS = CATEGORIES.map(c => c.key);

export function getCategoryLabel(cat: Category, lang: Lang): string {
  return cat.label[lang] ?? cat.label.de;
}

export function getTagLabel(tag: CategoryTag, lang: Lang): string {
  return tag.label[lang] ?? tag.label.de;
}

export function getCategoryByKey(key: string): Category | undefined {
  return CATEGORIES.find(c => c.key === key);
}

export function resolveCategoryLabel(key: string, lang: Lang): string {
  const cat = getCategoryByKey(key);
  return cat ? getCategoryLabel(cat, lang) : key;
}

export function resolveTagLabel(tagKey: string, lang: Lang): string {
  for (const cat of CATEGORIES) {
    const tag = cat.tags.find(t => t.key === tagKey);
    if (tag) return getTagLabel(tag, lang);
  }
  return tagKey;
}

export function resolveAnyLabel(key: string, lang: Lang): string {
  const cat = getCategoryByKey(key);
  if (cat) return getCategoryLabel(cat, lang);
  return resolveTagLabel(key, lang);
}

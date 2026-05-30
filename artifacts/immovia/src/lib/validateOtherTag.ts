export const OTHER_TAG_MAX_LEN = 40;
export const OTHER_TAG_MIN_LEN = 3;

const BLOCKED_KEYWORDS = [
  "casino", "gambling", "porn", "adult", "sex", "nude", "drug", "narcotic",
  "hack", "crack", "spam", "phish", "scam", "fraud", "bitcoin", "crypto",
  "forex", "investment", "loan", "betting", "lottery", "click here",
  "buy now", "free money", "make money", "earn cash",
];

export type TagValidationError = "too_short" | "too_long" | "invalid_chars" | "not_relevant";

export type TagValidationResult =
  | { ok: true; clean: string }
  | { ok: false; error: TagValidationError };

export function sanitizeOtherTag(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-.,()&/]/gu, "")
    .slice(0, OTHER_TAG_MAX_LEN);
}

export function validateOtherTag(raw: string): TagValidationResult {
  const clean = sanitizeOtherTag(raw);
  if (clean.length < OTHER_TAG_MIN_LEN) return { ok: false, error: "too_short" };
  if (clean.length > OTHER_TAG_MAX_LEN) return { ok: false, error: "too_long" };
  const lower = clean.toLowerCase();
  if (BLOCKED_KEYWORDS.some((k) => lower.includes(k))) {
    return { ok: false, error: "not_relevant" };
  }
  return { ok: true, clean };
}

export function otherTagErrorMessage(
  error: TagValidationError,
  lang: "en" | "de" | "sq" | "fr",
): string {
  const msgs: Record<TagValidationError, Record<string, string>> = {
    too_short: {
      en: "Please describe your service (min. 3 characters).",
      de: "Bitte beschreiben Sie den Dienst (mind. 3 Zeichen).",
      sq: "Ju lutemi përshkruani shërbimin (min. 3 karaktere).",
      fr: "Veuillez décrire le service (min. 3 caractères).",
    },
    too_long: {
      en: "Maximum 40 characters allowed.",
      de: "Maximal 40 Zeichen erlaubt.",
      sq: "Maksimumi 40 karaktere.",
      fr: "Maximum 40 caractères autorisés.",
    },
    invalid_chars: {
      en: "Only letters, numbers and basic punctuation are allowed.",
      de: "Nur Buchstaben, Zahlen und einfache Satzzeichen sind erlaubt.",
      sq: "Vetëm shkronja, numra dhe shenja themelore pikësimi.",
      fr: "Seuls les lettres, chiffres et la ponctuation de base sont autorisés.",
    },
    not_relevant: {
      en: "Please enter a service relevant to renovation or home services.",
      de: "Bitte geben Sie einen Dienst im Bereich Renovation oder Hausdienstleistungen ein.",
      sq: "Ju lutemi shkruani një shërbim që lidhet me rinovim ose shërbime shtëpiake.",
      fr: "Veuillez entrer un service lié à la rénovation ou aux services à domicile.",
    },
  };
  return msgs[error][lang] ?? msgs[error].en;
}

export function buildCustomServiceTag(categoryKey: string, text: string): string {
  return `${categoryKey}|${text}`;
}

export function parseCustomServiceTag(
  entry: string,
): { categoryKey: string; text: string } | null {
  const idx = entry.indexOf("|");
  if (idx < 1) return null;
  return { categoryKey: entry.slice(0, idx), text: entry.slice(idx + 1) };
}

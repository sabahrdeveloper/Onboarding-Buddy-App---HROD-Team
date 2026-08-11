/** Language detection — tags each message for analytics/logging. Matching
 * itself is language-agnostic (the intent engine tokenizes both scripts), so
 * this classification doesn't change which answer is picked; it's recorded
 * on assistant_messages so we can see the real English/Bangla/Banglish mix
 * of real usage. */

export type DetectedLanguage = "bn" | "banglish" | "en" | "mixed";

const BANGLA_RANGE = /[ঀ-৿]/g;

// A handful of very frequent Banglish function words — enough to distinguish
// "ami leave nibo" (Banglish) from plain English, without needing a full
// transliteration dictionary.
const BANGLISH_MARKERS = new Set([
  "ami", "tumi", "apni", "amar", "korbo", "korte", "chai", "hobe", "kivabe",
  "kibhabe", "keno", "kobe", "kothay", "dekhbo", "korte", "lagbe", "nibo",
  "dibo", "jonno", "theke", "porbe",
]);

export function detectLanguage(text: string): DetectedLanguage {
  const banglaChars = (text.match(BANGLA_RANGE) ?? []).length;
  const totalChars = text.replace(/\s/g, "").length || 1;
  const banglaRatio = banglaChars / totalChars;

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const banglishHits = words.filter((w) => BANGLISH_MARKERS.has(w)).length;
  const hasLatin = /[a-z]/i.test(text);

  if (banglaRatio > 0.3 && hasLatin) return "mixed";
  if (banglaRatio > 0.3) return "bn";
  if (banglishHits > 0) return "banglish";
  return "en";
}

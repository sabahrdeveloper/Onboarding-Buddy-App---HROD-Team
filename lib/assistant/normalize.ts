/** Input normalization — lowercase, punctuation/space cleanup, repeated-character
 * collapse, and a curated Banglish spelling-variant map. This runs before any
 * matching so "chhuti", "chooti", "chutti" all collapse to the same surface form
 * the rest of the pipeline (and the seeded keyword/synonym data) expects. */

const SPELLING_VARIANTS: Record<string, string> = {
  chuti: "chuti",
  chhuti: "chuti",
  chooti: "chuti",
  chutti: "chuti",
  chutii: "chuti",
  profail: "profile",
  prophile: "profile",
  vule: "bhule",
  vulay: "bhule",
  geci: "gechi",
  gesi: "gechi",
};

/** Multi-word (or punctuation-split) expressions that must survive as one
 * token. Critical for abbreviations like "TA/DA": punctuation stripping turns
 * it into "ta da", and the tokenizer then drops both halves for being under
 * 3 characters — leaving the engine with literally zero signal. Applied on the
 * normalized string, so keys must already be lowercase/punctuation-free. */
const PHRASE_VARIANTS: [RegExp, string][] = [
  [/\bta ?da\b/g, "tada"],
  [/\bt a d a\b/g, "tada"],
  // KB keywords store "PeopleDesk" as one token (that's how the source
  // questions spell it) — join the spaced-out typing to match. Deliberately
  // NOT done for "share desk"/"food corner": those keywords are stored as
  // separate words, so joining them would break matching, not help it.
  [/\bpeople ?desk\b/g, "peopledesk"],
];

/** Collapses runs of 3+ identical characters down to a single one — "chuttii"
 * style over-typing — without touching legitimate doubled letters (Bangla/
 * English words rarely have 3+ of the same letter in a row). */
function collapseRepeatedChars(text: string): string {
  return text.replace(/(.)\1{2,}/g, "$1");
}

export function normalizeText(raw: string): string {
  let text = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\sঀ-৿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = collapseRepeatedChars(text);

  for (const [pattern, replacement] of PHRASE_VARIANTS) {
    text = text.replace(pattern, replacement);
  }

  const words = text.split(" ").map((w) => SPELLING_VARIANTS[w] ?? w);
  return words.join(" ");
}

/** Synonym engine — canonicalizes surface variants ("vacation", "chuti",
 * "ছুটি") to one canonical term ("leave") before intent scoring, so the
 * keyword-overlap match in intent-engine.ts doesn't need every synonym
 * duplicated into every intent's keyword list. */

export interface SynonymRow {
  canonical_term: string;
  variant: string;
}

export function buildSynonymMap(rows: SynonymRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.variant.toLowerCase(), row.canonical_term.toLowerCase());
  }
  return map;
}

export function canonicalizeTokens(tokens: string[], synonymMap: Map<string, string>): string[] {
  return tokens.map((t) => synonymMap.get(t) ?? t);
}

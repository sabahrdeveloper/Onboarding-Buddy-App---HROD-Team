/** Fuzzy matching — edit-distance typo tolerance ("bhule gesi", "vule geci",
 * "vulay geci" all landing near "bhule gechi"). Used as a second pass after
 * exact/synonym matching fails for a token, so a real typo doesn't silently
 * drop a token that would otherwise have identified the right intent. */

/** Classic Levenshtein distance, iterative DP, O(n*m). Inputs here are single
 * words (a handful of characters), so this is cheap even run per-token. */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Finds the closest word in a known vocabulary within a distance threshold
 * that scales with word length (typos on longer words can differ by more
 * characters and still clearly be "the same word"). Returns null — not a
 * guess — when nothing is close enough, so an unrelated word never gets
 * silently rewritten into something misleading. */
export function findClosestMatch(word: string, vocabulary: Iterable<string>, maxDistanceRatio = 0.3): string | null {
  if (word.length < 3) return null; // too short for edit-distance to be meaningful
  const maxDistance = Math.max(1, Math.floor(word.length * maxDistanceRatio));

  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of vocabulary) {
    if (Math.abs(candidate.length - word.length) > maxDistance) continue;
    const distance = levenshteinDistance(word, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return bestDistance <= maxDistance ? best : null;
}

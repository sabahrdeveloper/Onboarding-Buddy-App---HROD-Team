import { tokenize } from "@/lib/assistant-kb";
import { findClosestMatch } from "./fuzzy";
import { canonicalizeTokens } from "./synonyms";

export interface SlotDef {
  name: string;
  prompt: string;
  entity_type: string;
}

export interface AssistantIntent {
  intent_id: string;
  intent_name: string;
  source: string;
  keywords: string[];
  required_slots: SlotDef[];
  response_templates: Record<string, string[]>;
  follow_up_questions: string[];
  related_intents: string[];
  escalation_rule: string | null;
  confidence_threshold: number;
}

export interface IntentMatch {
  intent: AssistantIntent;
  score: number;
  confidence: number;
}

/** Document frequency across all intents' keyword bags — the same IDF idea
 * proven out in lib/assistant-kb.ts's PeopleDesk matcher, now generalized to
 * every intent regardless of source (onboarding task, PeopleDesk FAQ, or
 * manually-authored). */
function buildDocumentFrequency(intents: AssistantIntent[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const intent of intents) {
    for (const tok of new Set(intent.keywords)) {
      df.set(tok, (df.get(tok) ?? 0) + 1);
    }
  }
  return df;
}

/**
 * Scores every intent against a query via IDF-weighted keyword overlap, after
 * synonym canonicalization and (for tokens with no exact/synonym hit) fuzzy
 * correction against the full keyword vocabulary. Returns the ranked matches
 * (best first) so the caller can compute a relative confidence from the top
 * two scores, per the confidence-scoring design (Section "State machine" of
 * the Spec).
 */
export function scoreIntents(
  rawQuery: string,
  intents: AssistantIntent[],
  synonymMap: Map<string, string>,
): IntentMatch[] {
  if (intents.length === 0) return [];

  const df = buildDocumentFrequency(intents);
  const n = intents.length;
  const idf = (tok: string) => Math.log((n + 1) / ((df.get(tok) ?? 0) + 1)) + 1;

  const vocabulary = new Set<string>();
  for (const intent of intents) for (const k of intent.keywords) vocabulary.add(k);

  let queryTokens = canonicalizeTokens(tokenize(rawQuery), synonymMap);
  // Fuzzy-correct any token that doesn't already exist in the known
  // vocabulary — catches typos ("vule gechi") without touching words that
  // already match something real.
  queryTokens = queryTokens.map((tok) => {
    if (vocabulary.has(tok)) return tok;
    return findClosestMatch(tok, vocabulary) ?? tok;
  });
  const uniqueQueryTokens = [...new Set(queryTokens)];

  // IDF-weighted "density": what share of this intent's own keyword weight
  // the query actually covers. A raw keyword-count tiebreak would let a
  // mostly-unrelated intent that happens to have very few keywords (e.g. a
  // 4-keyword "policy" intent that lists "leave" as one of them) outrank a
  // genuinely on-topic intent with more keywords — weighting by each
  // keyword's own idf avoids that.
  const intentKeywordIdfSum = new Map<string, number>();
  for (const intent of intents) {
    const sum = intent.keywords.reduce((acc, k) => acc + idf(k), 0);
    intentKeywordIdfSum.set(intent.intent_id, sum || 1);
  }

  const scored: IntentMatch[] = [];
  for (const intent of intents) {
    const keywordSet = new Set(intent.keywords);
    let score = 0;
    for (const tok of uniqueQueryTokens) {
      if (keywordSet.has(tok)) score += idf(tok);
    }
    if (score > 0) scored.push({ intent, score, confidence: 0 });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // On an exact tie, prefer a guided intent (declared required_slots): it
    // responds with a natural narrowing question ("কোন ধরনের ছুটি?") instead
    // of a generic blurb — the most conversational way to break ambiguity.
    const slotsA = a.intent.required_slots.length > 0 ? 1 : 0;
    const slotsB = b.intent.required_slots.length > 0 ? 1 : 0;
    if (slotsA !== slotsB) return slotsB - slotsA;
    const densityA = a.score / (intentKeywordIdfSum.get(a.intent.intent_id) ?? 1);
    const densityB = b.score / (intentKeywordIdfSum.get(b.intent.intent_id) ?? 1);
    return densityB - densityA;
  });

  // Confidence = absolute strength × relative dominance. Strength reuses the
  // 2.5 IDF-score threshold proven in lib/assistant-kb.ts (one distinctive
  // word clears it). Dominance is the top-vs-runner-up margin: a strong score
  // that clearly beats the runner-up answers directly (>0.85); a strong score
  // in a near-tie clarifies (0.6–0.85); a weak score falls back (<0.6). A pure
  // top/(top+runner) ratio was tried first but made the direct-answer band
  // unreachable — in a 158-intent corpus the runner-up almost always shares a
  // keyword, permanently capping the ratio below 0.85.
  const top = scored[0];
  const runnerUp = scored[1];
  for (const match of scored) {
    if (match === top) {
      const strength = Math.min(top.score / 2.5, 1);
      const margin = runnerUp ? (top.score - runnerUp.score) / top.score : 1;
      match.confidence = clamp01(strength * (0.6 + 0.5 * margin));
    } else {
      match.confidence = clamp01(match.score / (top.score + 1));
    }
  }

  return scored;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function bestResponseTemplate(intent: AssistantIntent, angle: string | null): string {
  const templates = angle ? intent.response_templates[angle] : undefined;
  const pool = templates && templates.length > 0 ? templates : intent.response_templates.default ?? [];
  if (pool.length === 0) return "";
  return pool[Math.floor(Math.random() * pool.length)];
}

export function missingSlot(intent: AssistantIntent, collectedSlots: Record<string, string>): SlotDef | null {
  for (const slot of intent.required_slots) {
    if (!collectedSlots[slot.name]) return slot;
  }
  return null;
}

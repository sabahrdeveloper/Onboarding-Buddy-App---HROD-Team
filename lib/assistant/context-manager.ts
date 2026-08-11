import { detectIntent, tokenize } from "@/lib/assistant-kb";
import type { AssistantIntent } from "./intent-engine";

/** Pronouns/references (English + Bangla/Banglish) that signal "this message
 * continues the current topic" rather than starting a new one. */
const REFERENCE_WORDS = new Set([
  "it", "this", "that", "they", "those", "him", "her", "these",
  "eta", "oita", "shegulo", "segulo", "oi", "eita", "ওটা", "এটা", "সেগুলো", "ওই",
]);

export interface SessionContextState {
  currentTopic: string | null;
  currentIntentId: string | null;
  previousIntentId: string | null;
}

export interface ContextResolution {
  /** True when the message should be treated as a continuation of the
   * current topic/intent rather than a fresh, independent question. */
  isContinuation: boolean;
  /** The intent to prefer when continuing (the session's current one), if any. */
  continuedIntentId: string | null;
}

/**
 * Decides whether a message starts a new topic or continues the existing
 * one. A message continues the session's topic when it contains a reference
 * word ("it", "eta", ...), or is itself just a why/how/who/deadline/confirm
 * angle word ("keno?", "ki bhabe?") with no topic noun of its own — those
 * only make sense read against the previous answer. A short message that
 * names its own topic (e.g. a quick-question tap like "help" or "policy")
 * is NOT a continuation just because it's short — it must be scored fresh.
 */
export function resolveContext(rawQuery: string, session: SessionContextState): ContextResolution {
  const tokens = tokenize(rawQuery, 1);
  const hasReference = tokens.some((t) => REFERENCE_WORDS.has(t));
  // Angle words (keno/kivabe/kobe/...) are themselves generic Banglish filler,
  // so they get stripped by tokenize()'s stopword list — checking word count
  // on the *raw* (unstripped) message is what keeps this scoped to genuinely
  // tiny fragments like "keno?" rather than a full fresh sentence that merely
  // contains one of these words in passing (e.g. "...korte chai").
  const rawWordCount = rawQuery.trim().split(/\s+/).filter(Boolean).length;
  const isBareFollowUpAngle = rawWordCount > 0 && rawWordCount <= 3 && detectIntent(rawQuery) !== null;

  if (session.currentIntentId && (hasReference || isBareFollowUpAngle)) {
    return { isContinuation: true, continuedIntentId: session.currentIntentId };
  }
  return { isContinuation: false, continuedIntentId: null };
}

/** Given the strongest fresh-intent match's score against a continuation
 * candidate, decide whether the fresh match is confident enough to override
 * the continuation — a clear topic shift ("what about attendance?" after a
 * leave conversation) should win over blindly continuing the old topic. */
export function shouldOverrideContinuation(freshConfidence: number, threshold = 0.85): boolean {
  return freshConfidence > threshold;
}

export function topicFor(intent: AssistantIntent): string {
  return intent.source === "onboarding_task" ? `task:${intent.intent_id}` : intent.intent_name;
}

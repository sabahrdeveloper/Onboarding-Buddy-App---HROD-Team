import { createClient } from "@/lib/supabase/server";
import { submitHelpRequest } from "@/actions/help";
import { detectIntent as detectAngle } from "@/lib/assistant-kb";
import { normalizeText } from "./normalize";
import { detectLanguage } from "./language";
import { buildSynonymMap } from "./synonyms";
import { scoreIntents, missingSlot, type AssistantIntent, type SlotDef } from "./intent-engine";
import { extractEntities, type ExtractedEntities } from "./entities";
import { resolveContext, shouldOverrideContinuation, topicFor } from "./context-manager";
import { matchPhrase } from "./phrases";
import { nextState, type ConversationState } from "./state-machine";
import {
  generateSmalltalk,
  generateSlotPrompt,
  generateAnswer,
  generateEscalation,
  generateFallback,
  type SmalltalkKind,
} from "./response-generator";
import { getSession, updateSession, getRecentMessages, saveMessage, logEvent } from "./session-manager";

export interface ProcessMessageResult {
  text: string;
  followUpQuestion: string | null;
  conversationState: ConversationState;
}

// Social words the tokenizer's stopword list would otherwise swallow whole —
// without this, "thanks" or "ok" would score zero and hit the apologetic
// fallback, which instantly breaks the feeling of a conversation.
const SMALLTALK_WORDS: Record<string, SmalltalkKind> = {
  hi: "greeting", hello: "greeting", hey: "greeting", salam: "greeting",
  assalamu: "greeting", assalamualaikum: "greeting", alaikum: "greeting",
  "হাই": "greeting", "হ্যালো": "greeting", "সালাম": "greeting", "আসসালামুয়ালাইকুম": "greeting",
  thanks: "thanks", thank: "thanks", thanku: "thanks", tnx: "thanks", thx: "thanks",
  dhonnobad: "thanks", dhonnobaad: "thanks", "ধন্যবাদ": "thanks",
  ok: "ack", okay: "ack", okk: "ack", acha: "ack", accha: "ack", achha: "ack",
  thik: "ack", ache: "ack", hmm: "ack", hm: "ack", "ঠিক": "ack", "আচ্ছা": "ack",
  bye: "bye", goodbye: "bye", biday: "bye", "বিদায়": "bye",
  allah: "bye", hafez: "bye", hafiz: "bye",
  you: "thanks", // only reachable via "thank you"-style phrases (see detector)
};

/** Detects pure social messages ("hi", "thanks a lot", "ok bye") — every word
 * must be smalltalk vocabulary, and the whole message must be short. Returns
 * the dominant kind (bye > thanks > greeting > ack) or null. */
function detectSmalltalk(rawText: string): SmalltalkKind | null {
  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\sঀ-৿]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0 || words.length > 4) return null;
  const kinds: SmalltalkKind[] = [];
  for (const w of words) {
    const kind = SMALLTALK_WORDS[w];
    if (!kind) return null;
    kinds.push(kind);
  }
  for (const priority of ["bye", "thanks", "greeting"] as const) {
    if (kinds.includes(priority)) return priority;
  }
  return "ack";
}

async function loadIntents(): Promise<AssistantIntent[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("assistant_intents").select().eq("active", true);
  return (data ?? []).map((row) => ({
    intent_id: row.intent_id,
    intent_name: row.intent_name,
    source: row.source ?? "manual",
    keywords: row.keywords,
    required_slots: (row.required_slots as unknown as SlotDef[]) ?? [],
    response_templates: (row.response_templates as unknown as Record<string, string[]>) ?? {},
    follow_up_questions: row.follow_up_questions,
    related_intents: row.related_intents,
    escalation_rule: row.escalation_rule,
    confidence_threshold: row.confidence_threshold,
  }));
}

async function loadSynonymMap(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("assistant_synonyms").select("canonical_term, variant");
  return buildSynonymMap(data ?? []);
}

function extractSlotValue(slot: SlotDef, rawText: string, entities: ExtractedEntities): string | null {
  switch (slot.entity_type) {
    case "leave_type":
      return entities.leaveType ?? null;
    case "phone":
      return entities.phone ?? null;
    case "email":
      return entities.email ?? null;
    case "date":
      return entities.date ?? null;
    case "department":
      return entities.department ?? null;
    case "designation":
      return entities.designation ?? null;
    default:
      // Free text slots (issue_type, text, ...) — the message itself is the answer.
      return rawText.trim() || null;
  }
}

interface SideEffectResult {
  ran: boolean;
  /** Extra line to append to the answer (e.g. the created ticket ID). */
  resultNote: string | null;
}

async function runSideEffects(intent: AssistantIntent, slots: Record<string, string>): Promise<SideEffectResult> {
  if (intent.intent_id === "REQUEST_HELP") {
    const result = await submitHelpRequest({
      issueType: slots.issue_type ?? "Other",
      relatedTaskId: null,
      description: slots.description ?? "",
      phone: slots.phone ?? "",
    });
    if (result.error) return { ran: true, resultNote: result.error };
    return { ran: true, resultNote: `আপনার Ticket ID: ${result.ticketId}। HR team শীঘ্রই যোগাযোগ করবে।` };
  }
  return { ran: false, resultNote: null };
}

export async function processMessage(sessionId: string, rawText: string): Promise<ProcessMessageResult> {
  const session = await getSession(sessionId);
  if (!session) {
    return { text: "সেশন পাওয়া যায়নি। পেজ রিলোড করে আবার চেষ্টা করুন।", followUpQuestion: null, conversationState: "conversation_end" };
  }

  const language = detectLanguage(rawText);
  const entities = extractEntities(rawText);
  const normalized = normalizeText(rawText);

  const [intents, synonymMap, recentMessages] = await Promise.all([
    loadIntents(),
    loadSynonymMap(),
    getRecentMessages(sessionId),
  ]);

  await saveMessage(sessionId, {
    role: "user",
    messageText: rawText,
    detectedLanguage: language,
    entities: entities as unknown as Record<string, unknown>,
  });

  const intentsById = new Map(intents.map((i) => [i.intent_id, i]));
  const matches = scoreIntents(normalized, intents, synonymMap);
  const top = matches[0] ?? null;

  const lastAssistantMessage = [...recentMessages].reverse().find((m) => m.role === "assistant");
  const repeatedLowConfidence = Boolean(
    lastAssistantMessage &&
      (lastAssistantMessage.confidenceScore ?? 0) < 0.6 &&
      (!top || top.confidence < 0.6),
  );

  // Pure social message ("hi", "thanks", "ok", "bye") — reply in kind at any
  // point in the conversation, without touching the current topic/intent so a
  // real follow-up can still continue where things left off. Skipped while
  // collecting a slot, where "ok" may be a legitimate free-text answer.
  const smalltalk = session.conversationState !== "collecting_information" ? detectSmalltalk(rawText) : null;
  if (smalltalk) {
    const { text } = generateSmalltalk(smalltalk);
    const state = smalltalk === "greeting" ? nextState(session.conversationState, "first_message") : session.conversationState;
    await updateSession(sessionId, { conversationState: state, lastAction: `smalltalk_${smalltalk}` });
    await saveMessage(sessionId, { role: "assistant", messageText: text });
    return { text, followUpQuestion: null, conversationState: state };
  }

  // Slot-filling in progress: this message is most likely an answer to the
  // last slot prompt, unless a clearly stronger fresh match indicates the
  // user has moved on to a different topic entirely.
  if (session.conversationState === "collecting_information" && session.currentIntent) {
    const intent = intentsById.get(session.currentIntent);
    const freshOverride = top && shouldOverrideContinuation(top.confidence) && top.intent.intent_id !== session.currentIntent;

    if (intent && !freshOverride) {
      const pending = missingSlot(intent, session.collectedSlots);
      const updatedSlots = { ...session.collectedSlots };
      if (pending) {
        const value = extractSlotValue(pending, rawText, entities);
        if (value) updatedSlots[pending.name] = value;
      }

      const stillMissing = missingSlot(intent, updatedSlots);
      if (stillMissing) {
        const state = nextState(session.conversationState, "slot_still_missing");
        await updateSession(sessionId, { conversationState: state, collectedSlots: updatedSlots, lastAction: "slot_prompt" });
        const { text } = generateSlotPrompt(stillMissing.prompt);
        await saveMessage(sessionId, { role: "assistant", messageText: text, detectedIntent: intent.intent_id });
        return { text, followUpQuestion: null, conversationState: state };
      }

      // All slots filled — resolve and answer.
      const state = nextState(session.conversationState, "all_slots_filled");
      const sideEffect = await runSideEffects(intent, updatedSlots);
      const angle = updatedSlots.leave_type?.toLowerCase() ?? null;
      const generated = generateAnswer(intent, angle, updatedSlots);
      // After a transactional intent completes, surface the result (ticket ID)
      // and skip the generic follow-up question — "tell me more?" right after
      // "your ticket was submitted" reads as a bug, not a conversation.
      const text = sideEffect.resultNote ? `${generated.text}\n\n${sideEffect.resultNote}` : generated.text;
      const followUpQuestion = sideEffect.ran ? null : generated.followUpQuestion;
      const finalState = nextState(state, "answer_delivered");
      await updateSession(sessionId, {
        conversationState: finalState,
        // Reset so a later re-trigger of the same intent collects fresh
        // slots instead of silently reusing this conversation's values.
        collectedSlots: {},
        currentTopic: topicFor(intent),
        lastAction: "answered",
      });
      await saveMessage(sessionId, { role: "assistant", messageText: text, detectedIntent: intent.intent_id, confidenceScore: 1 });
      return { text, followUpQuestion, conversationState: finalState };
    }
  }

  // Colloquial phrase shortcut: situation expressions like "ajke office jete
  // chai na" carry no scoreable keywords (they're all stopwords/daily words) —
  // the phrase layer maps them straight to an intent, sometimes prefilling a
  // slot the phrase itself answers ("shorir kharap" → Medical leave).
  const phraseHit = matchPhrase(normalized);
  const phraseIntent = phraseHit ? intentsById.get(phraseHit.intentId) : undefined;
  const slotSeed = (phraseIntent && phraseHit?.slotPrefills) || {};

  // Context resolution: does this message continue the current topic?
  const context = resolveContext(rawText, {
    currentTopic: session.currentTopic,
    currentIntentId: session.currentIntent,
    previousIntentId: session.previousIntent,
  });
  const useContinuation =
    !phraseIntent &&
    context.isContinuation &&
    context.continuedIntentId &&
    !(top && shouldOverrideContinuation(top.confidence));

  const chosen = phraseIntent
    ? { intent: phraseIntent, confidence: 0.95 }
    : useContinuation
      ? { intent: intentsById.get(context.continuedIntentId!)!, confidence: 0.9 }
      : top;

  if (!chosen || !chosen.intent) {
    const escalate = repeatedLowConfidence;
    const state = nextState(session.conversationState, escalate ? "repeated_low_confidence" : "low_confidence_match");
    await logEvent(sessionId, "unmatched_query", { text: rawText });
    const { text } = escalate ? generateEscalation(null) : generateFallback();
    await updateSession(sessionId, { conversationState: state, lastAction: escalate ? "escalated" : "fallback", confidenceScore: top?.confidence ?? 0 });
    await saveMessage(sessionId, { role: "assistant", messageText: text, confidenceScore: top?.confidence ?? 0 });
    return { text, followUpQuestion: null, conversationState: state };
  }

  const intent = chosen.intent;
  const confidence = chosen.confidence;

  if (intent.escalation_rule === "always") {
    const pending = missingSlot(intent, slotSeed);
    if (pending) {
      const state = nextState(session.conversationState, "slot_still_missing");
      await updateSession(sessionId, {
        conversationState: state,
        currentIntent: intent.intent_id,
        previousIntent: session.currentIntent,
        currentTopic: topicFor(intent),
        collectedSlots: slotSeed,
        lastAction: "slot_prompt",
      });
      const { text } = generateSlotPrompt(pending.prompt);
      await saveMessage(sessionId, { role: "assistant", messageText: text, detectedIntent: intent.intent_id, confidenceScore: confidence });
      return { text, followUpQuestion: null, conversationState: state };
    }
  }

  // Answer-first policy: a real conversation answers with its best
  // understanding and lets the user redirect — it never answers a question
  // with a question when it has a workable match. Only a genuinely weak match
  // (below one distinctive keyword's worth of IDF score) falls back.
  const matchIsWeak = !phraseIntent && !useContinuation && (!top || top.score < 2);
  if (matchIsWeak) {
    const escalate = repeatedLowConfidence;
    const state = nextState(session.conversationState, escalate ? "repeated_low_confidence" : "low_confidence_match");
    await logEvent(sessionId, "unmatched_query", { text: rawText, closest_intent: intent.intent_id, confidence });
    const { text } = escalate
      ? generateEscalation(intent)
      : generateFallback(matches.slice(0, 3).map((m) => m.intent));
    await updateSession(sessionId, { conversationState: state, lastAction: escalate ? "escalated" : "fallback", confidenceScore: confidence });
    await saveMessage(sessionId, { role: "assistant", messageText: text, confidenceScore: confidence });
    return { text, followUpQuestion: null, conversationState: state };
  }

  // When the runner-up scored nearly as high, the answer still goes out, but
  // with a short "did you mean" suffix listing the close alternatives.
  const relatedNames =
    !phraseIntent && !useContinuation && top
      ? matches
          .slice(1, 3)
          .filter((m) => m.score >= 0.8 * top.score && m.intent.intent_id !== intent.intent_id)
          .map((m) => m.intent.intent_name)
      : [];

  // Answer, filling slots first if this intent requires any (phrase prefills
  // count as already collected — the user shouldn't be asked what they said).
  const carriedSlots = session.currentIntent === intent.intent_id ? { ...session.collectedSlots, ...slotSeed } : slotSeed;
  const pending = missingSlot(intent, carriedSlots);
  if (pending) {
    const state = nextState(session.conversationState, "slot_still_missing");
    await updateSession(sessionId, {
      conversationState: state,
      currentIntent: intent.intent_id,
      previousIntent: session.currentIntent,
      currentTopic: topicFor(intent),
      collectedSlots: carriedSlots,
      confidenceScore: confidence,
      lastAction: "slot_prompt",
    });
    const { text } = generateSlotPrompt(pending.prompt);
    await saveMessage(sessionId, { role: "assistant", messageText: text, detectedIntent: intent.intent_id, confidenceScore: confidence });
    return { text, followUpQuestion: null, conversationState: state };
  }

  const angle =
    carriedSlots.leave_type?.toLowerCase() ??
    (intent.source === "onboarding_task" ? detectAngle(rawText) : null);
  const { text, followUpQuestion } = generateAnswer(intent, angle, carriedSlots, relatedNames);
  const state = nextState(nextState(session.conversationState, "high_confidence_match"), "answer_delivered");
  await updateSession(sessionId, {
    conversationState: state,
    currentIntent: intent.intent_id,
    previousIntent: session.currentIntent,
    currentTopic: topicFor(intent),
    confidenceScore: confidence,
    lastAction: "answered",
  });
  await saveMessage(sessionId, { role: "assistant", messageText: text, detectedIntent: intent.intent_id, confidenceScore: confidence });
  return { text, followUpQuestion, conversationState: state };
}

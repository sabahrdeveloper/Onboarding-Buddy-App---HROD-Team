import type { AssistantIntent } from "./intent-engine";
import { bestResponseTemplate } from "./intent-engine";

/** Rotated phrasings for routing-to-a-human language, so the assistant
 * doesn't repeat the exact same sentence every time it hands off — per the
 * Spec's "natural response variations" requirement. */
const HANDOFF_VARIATIONS = [
  "HR can help you with this.",
  "Please reach out to the HR team.",
  "The HR department handles this request.",
  "You may contact HR regarding this matter.",
];

const GREETING_VARIATIONS = [
  "হ্যালো! আমি OnboardingBuddy Assistant। কীভাবে সাহায্য করতে পারি?",
  "স্বাগতম! কী জানতে চান বলুন।",
  "হাই! আপনাকে কীভাবে সহায়তা করতে পারি?",
];

const THANKS_VARIATIONS = [
  "আপনাকে স্বাগতম! আর কিছু জানতে চাইলে বলুন। 😊",
  "সাহায্য করতে পেরে ভালো লাগলো! অন্য কিছু দরকার হলে জানাবেন।",
  "কোনো ব্যাপার না! আরও প্রশ্ন থাকলে নির্দ্বিধায় করুন।",
];

const ACK_VARIATIONS = [
  "ঠিক আছে! আর কিছু জানতে চাইলে বলুন।",
  "আচ্ছা। অন্য কোনো প্রশ্ন থাকলে জানাবেন।",
  "বুঝেছি। আরও সাহায্য লাগলে আমি আছি!",
];

const BYE_VARIATIONS = [
  "ভালো থাকবেন! যেকোনো সময় প্রশ্ন নিয়ে ফিরে আসতে পারেন।",
  "আল্লাহ হাফেজ! Onboarding-এ শুভকামনা রইলো।",
  "বিদায়! দরকার হলে আবার আসবেন।",
];

function pickRandom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Fills {slotName} placeholders in a template with collected slot values. */
function interpolate(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => slots[key] ?? match);
}

export interface GeneratedResponse {
  text: string;
  followUpQuestion: string | null;
}

export type SmalltalkKind = "greeting" | "thanks" | "ack" | "bye";

export function generateSmalltalk(kind: SmalltalkKind): GeneratedResponse {
  const pool =
    kind === "greeting"
      ? GREETING_VARIATIONS
      : kind === "thanks"
        ? THANKS_VARIATIONS
        : kind === "bye"
          ? BYE_VARIATIONS
          : ACK_VARIATIONS;
  return { text: pickRandom(pool), followUpQuestion: null };
}

export function generateGreeting(): GeneratedResponse {
  return generateSmalltalk("greeting");
}

export function generateSlotPrompt(prompt: string): GeneratedResponse {
  return { text: prompt, followUpQuestion: null };
}

export function generateAnswer(
  intent: AssistantIntent,
  angle: string | null,
  slots: Record<string, string>,
  relatedNames: string[] = [],
): GeneratedResponse {
  const template = bestResponseTemplate(intent, angle);
  let text = interpolate(template, slots);
  // Answer-first policy: when other intents scored nearly as high, still
  // answer the best match but mention the alternatives — a conversation
  // partner gives their best understanding and lets the user redirect,
  // instead of answering a question with a question.
  if (relatedNames.length > 0) {
    text += `\n\nআপনি কি অন্য কিছু জানতে চেয়েছিলেন? যেমন: ${relatedNames.join(" · ")}`;
  }
  const followUpQuestion =
    relatedNames.length === 0 && intent.follow_up_questions.length > 0
      ? pickRandom(intent.follow_up_questions)
      : null;
  return { text, followUpQuestion };
}

export function generateEscalation(intent: AssistantIntent | null): GeneratedResponse {
  const handoff = pickRandom(HANDOFF_VARIATIONS);
  const rule = intent?.escalation_rule;
  const text = rule ? `${rule} ${handoff}` : `এই বিষয়ে সরাসরি সহায়তা প্রয়োজন। ${handoff}`;
  return { text, followUpQuestion: null };
}

/** <60% confidence — per spec this should still "suggest related topics", not
 * just apologize, since a low-confidence top match is still often the right
 * general area (e.g. a single ambiguous keyword shared by many Leave FAQs). */
export function generateFallback(candidates: AssistantIntent[] = []): GeneratedResponse {
  if (candidates.length === 0) {
    return {
      text: "দুঃখিত, আমি ঠিক বুঝতে পারিনি। একটু ভিন্নভাবে বলবেন, অথবা Help Request পাঠাতে পারেন।",
      followUpQuestion: null,
    };
  }
  const topics = candidates.slice(0, 3).map((c) => c.intent_name).join(" / ");
  return {
    text: `দুঃখিত, ঠিক বুঝতে পারিনি — তবে সম্ভবত আপনি এই বিষয়ে জানতে চাইছেন: ${topics}। একটু নির্দিষ্ট করে লিখবেন কি, অথবা Help Request পাঠাতে পারেন।`,
    followUpQuestion: null,
  };
}

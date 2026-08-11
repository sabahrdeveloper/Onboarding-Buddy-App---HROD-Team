import type { KbEntry, Task } from "@/lib/types";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "your", "you", "i", "this",
  "that", "is", "are", "from", "by", "as", "at", "be", "it", "its", "their", "them", "will", "can",
  // Banglish pronouns/particles/auxiliary-verb forms — these show up in almost
  // every translated question ("Ami kivabe X korbo?") regardless of topic, so
  // leaving them in would make them useless (or actively misleading) as
  // matching keywords; real topic discrimination comes from the nouns.
  "ami", "tumi", "apni", "amar", "tomar", "tader", "amader", "tader",
  "eta", "ei", "oi", "shei", "egulo", "ogulo",
  "keno", "kina", "hoyeche", "hoise", "hobe", "ache", "thakle", "hole",
  "korbo", "korte", "korle", "kori", "korchi", "korar", "kora", "korlam",
  "deya", "dibo", "debo", "dite", "dey", "deoya",
  "neya", "nibo", "nite", "ney",
  "chai", "chan", "chao", "lage", "lagbe", "lagle",
  "jay", "jabe", "jaay", "pabo", "pare", "parbo", "parbe", "pai",
  "niye", "theke", "jonno",
  "kivabe", "kibhabe", "kemne", "kemon",
  "kotha", "kothay", "kobe",
  "kon", "kar", "kake", "kader", "amake", "tomake", "take",
  // Generic English business/office filler nouns — real everywhere, specific
  // to nothing. Left in, these can accidentally "win" a match purely because
  // they're rare in this particular 96-row corpus (e.g. "office" happens to
  // appear in only one entry), not because they're actually topic-specific.
  "office", "system", "employee", "service", "information", "company",
  "department", "staff", "please", "thanks", "thank", "hello", "general", "related",
]);

/** Crude singular/plural normalizer ("policies" -> "policy", "steps" -> "step")
 * so a query using one form still matches a title using the other. */
function stem(token: string): string {
  if (token.length > 5 && token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

/** Lowercases, strips punctuation (keeping Bangla script), and drops short/stop tokens.
 * Exported so lib/assistant/intent-engine.ts can reuse the same tokenizer/stemmer/
 * stopword logic instead of duplicating it for the newer intent-based engine. */
export function tokenize(text: string, minLength = 3): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ঀ-৿\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= minLength && !STOPWORDS.has(t))
    .map(stem);
}

function uniqueTokens(text: string): string[] {
  return [...new Set(tokenize(text))];
}

/** Role names include meaningful 2-letter abbreviations ("HR", "IT") that the
 * general tokenizer's length cutoff would otherwise drop. */
function uniqueRoleTokens(text: string): string[] {
  return [...new Set(tokenize(text, 2))];
}

// Common English/Bangla/Banglish ways of asking each angle of a task. Not
// exhaustive transliteration — a curated list of the phrasings people
// actually type, per intent category.
const INTENT_KEYWORDS = {
  why: ["why", "reason", "keno", "kano", "ken", "কেন", "গুরুত্বপূর্ণ", "importance", "important", "dorkar", "প্রয়োজন", "দরকার"],
  how: ["how", "process", "step", "steps", "procedure", "kivabe", "kibhabe", "kemne", "kemon", "কিভাবে", "কীভাবে", "korbo", "korte", "করব", "করতে হবে"],
  who: ["who", "contact", "kar", "kake", "kader", "কার", "কাকে", "কে", "responsible", "dayitto", "দায়িত্ব", "jogajog", "যোগাযোগ"],
  deadline: ["when", "deadline", "kobe", "কবে", "koto din", "কতদিন", "somoy", "সময়", "last date", "by when"],
  confirm: ["confirm", "done", "mark as done", "somponno", "সম্পন্ন", "complete", "shesh", "শেষ", "bujhbo", "বুঝব"],
} as const;

export type Intent = keyof typeof INTENT_KEYWORDS;

export interface TaskKbGroup {
  taskId: string;
  title: string;
  titleTokens: string[];
  roleTokens: string[];
  answers: Record<Intent | "combined", string>;
}

export function buildTaskKbGroups(tasks: Task[]): TaskKbGroup[] {
  return tasks.map((t) => {
    const stepsText = t.howToSteps.map((s, i) => `${i + 1}. ${s}`).join(" ");
    const confirmQ = t.confirmQuestion || "আপনি কি এই কাজটি সম্পন্ন করেছেন?";
    const whoAnswer = `${t.responsibleRole} এই কাজের জন্য দায়িত্বপ্রাপ্ত। HR Services থেকে ${t.responsibleRole}-এর contact card এ Call/WhatsApp/Message করতে পারেন।`;
    const deadlineAnswer = `নির্ধারিত সময়সীমা: ${t.timeline} (${t.phase} Days phase-এর অংশ)।`;
    const howAnswer = stepsText || "নির্ধারিত দায়িত্বপ্রাপ্ত ব্যক্তির সাথে আলোচনা করে ধাপে ধাপে সম্পন্ন করুন, তারপর Mark as Done চাপুন।";

    return {
      taskId: t.id,
      title: t.title,
      titleTokens: uniqueTokens(t.title),
      roleTokens: uniqueRoleTokens(`${t.responsibleRole} ${t.responsibleKey}`),
      answers: {
        why: t.whyText,
        how: howAnswer,
        who: whoAnswer,
        deadline: deadlineAnswer,
        confirm: `Task Manual-এ সব ধাপ শেষ করার পর "${confirmQ}" প্রশ্নে Yes/Mark as Done চাপলেই এটি সম্পন্ন হিসেবে গণ্য হবে।`,
        combined: `"${t.title}" — ${t.whyText} দায়িত্বে আছেন: ${t.responsibleRole}। সময়সীমা: ${t.timeline}।`,
      },
    };
  });
}

function overlapCount(queryTokens: Set<string>, candidateTokens: string[]): number {
  let count = 0;
  for (const tok of candidateTokens) if (queryTokens.has(tok)) count++;
  return count;
}

/** Exported so lib/assistant/engine.ts can reuse the same why/how/who/deadline/
 * confirm angle detection for onboarding-task-sourced intents (e.g. resolving
 * "keno?" after a task answer to the "why" angle of the same intent). */
export function detectIntent(query: string): Intent | null {
  const low = query.toLowerCase();
  let best: Intent | null = null;
  let bestCount = 0;
  for (const intent of Object.keys(INTENT_KEYWORDS) as Intent[]) {
    const count = INTENT_KEYWORDS[intent].filter((k) => low.includes(k)).length;
    if (count > bestCount) {
      best = intent;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Two-pass local matcher (no LLM): first find which task the question is
 * about via title/role word overlap, then which angle (why/how/who/deadline/
 * confirm) via intent keyword hits. Falls back to a combined summary when a
 * task is identified but no specific angle is detected — this is what lets
 * indirect/paraphrased questions still get a useful answer instead of nothing.
 */
export function matchTaskAnswer(query: string, groups: TaskKbGroup[]): string | null {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return null;

  let bestGroup: TaskKbGroup | null = null;
  let bestScore = 0;
  for (const group of groups) {
    const titleHits = overlapCount(queryTokens, group.titleTokens);
    const roleHits = overlapCount(queryTokens, group.roleTokens);
    if (titleHits === 0) continue;
    // Require either a role-specific hit or at least two distinct title
    // words, so a single common word (e.g. "team") can't win on its own.
    if (roleHits === 0 && titleHits < 2) continue;
    const score = titleHits * 2 + roleHits;
    if (score > bestScore) {
      bestScore = score;
      bestGroup = group;
    }
  }
  if (!bestGroup) return null;

  const intent = detectIntent(query);
  return intent ? bestGroup.answers[intent] : bestGroup.answers.combined;
}

/** Original generic KB matcher (assistant_kb table) — small hand-curated set,
 * substring-based, used as the fallback when no task-specific match is found. */
export function matchGenericKb(kb: KbEntry[], query: string): string | null {
  const low = query.toLowerCase();
  const hit = kb.find((e) => e.keywords.some((k) => low.includes(k)));
  return hit?.response ?? null;
}

export interface PeopleDeskKbRow {
  module: string;
  question_en: string;
  question_bn: string | null;
  question_banglish: string | null;
  answer: string;
}

export interface PeopleDeskEntry {
  keywords: string[];
  answer: string;
}

/** PeopleDesk ERP knowledge base (attendance/leave/movement/expense/grievance/
 * payslip/etc.) — each entry already comes with real English + Bangla +
 * Banglish question text (from the PeopleDesk question bank), so unlike the
 * onboarding-task matcher above, there's no need to synthesize per-angle
 * variants: the three question variants are simply pooled into one keyword
 * bag per entry and matched directly by overlap. */
export function buildPeopleDeskEntries(rows: PeopleDeskKbRow[]): PeopleDeskEntry[] {
  return rows.map((r) => {
    const text = [r.module, r.question_en, r.question_bn ?? "", r.question_banglish ?? ""].join(" ");
    return { keywords: uniqueTokens(text), answer: r.answer };
  });
}

/** How many entries each token appears in — used to weight matches so a rare,
 * topic-specific word (e.g. "food", "grievance") counts for much more than a
 * word that shows up in nearly every entry (which, after stopword filtering,
 * is mostly leftover generic terms like "employee" or "system"). */
function buildDocumentFrequency(entries: PeopleDeskEntry[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const entry of entries) {
    for (const tok of new Set(entry.keywords)) {
      df.set(tok, (df.get(tok) ?? 0) + 1);
    }
  }
  return df;
}

export function matchPeopleDeskAnswer(query: string, entries: PeopleDeskEntry[]): string | null {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0 || entries.length === 0) return null;

  const df = buildDocumentFrequency(entries);
  const n = entries.length;
  // Smoothed IDF: common word (in most entries) -> weight near 1; rare word
  // (in a handful of entries) -> weight several times higher.
  const idf = (tok: string) => Math.log((n + 1) / ((df.get(tok) ?? 0) + 1)) + 1;

  let best: PeopleDeskEntry | null = null;
  let bestScore = 0;
  let bestDensity = 0;
  for (const entry of entries) {
    const keywordSet = new Set(entry.keywords);
    let score = 0;
    for (const tok of queryTokens) {
      if (keywordSet.has(tok)) score += idf(tok);
    }
    if (score === 0) continue;
    // On a near-tied score, prefer the entry where the match makes up a
    // larger share of its own keywords — a broad multi-topic entry (e.g. a
    // general "where do I approve X/Y/Z" FAQ) shouldn't beat a narrowly
    // matching, module-specific one just because it was seeded first.
    const density = score / entry.keywords.length;
    if (score > bestScore || (score === bestScore && density > bestDensity)) {
      bestScore = score;
      bestDensity = density;
      best = entry;
    }
  }
  // A single distinctive word (idf ~2.5+, e.g. "leave", "grievance") clears
  // this; two or more common words are needed otherwise — same intent as the
  // old "at least 2 hits" rule, just weighted instead of flat.
  if (!best || bestScore < 2.5) return null;
  return best.answer;
}

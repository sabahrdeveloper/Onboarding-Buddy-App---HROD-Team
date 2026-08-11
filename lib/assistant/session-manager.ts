import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { ConversationState } from "./state-machine";

export interface AssistantSession {
  id: string;
  profileId: string | null;
  currentTopic: string | null;
  currentIntent: string | null;
  previousIntent: string | null;
  conversationState: ConversationState;
  collectedSlots: Record<string, string>;
  lastAction: string | null;
  confidenceScore: number | null;
}

export interface SessionMessage {
  role: "user" | "assistant";
  messageText: string;
  detectedLanguage?: string | null;
  detectedIntent?: string | null;
  confidenceScore?: number | null;
  entities?: Record<string, unknown>;
}

function toSession(row: {
  id: string;
  profile_id: string | null;
  current_topic: string | null;
  current_intent: string | null;
  previous_intent: string | null;
  conversation_state: string;
  collected_slots: unknown;
  last_action: string | null;
  confidence_score: number | null;
}): AssistantSession {
  return {
    id: row.id,
    profileId: row.profile_id,
    currentTopic: row.current_topic,
    currentIntent: row.current_intent,
    previousIntent: row.previous_intent,
    conversationState: row.conversation_state as ConversationState,
    collectedSlots: (row.collected_slots as Record<string, string>) ?? {},
    lastAction: row.last_action,
    confidenceScore: row.confidence_score,
  };
}

/** Creates a fresh session for the current authenticated user (RLS enforces
 * profile_id = auth.uid() on insert). Returns null when there's no user. */
export async function createSession(): Promise<AssistantSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("assistant_sessions")
    .insert({ profile_id: user.id, conversation_state: "greeting" })
    .select()
    .single();
  if (error || !data) return null;
  return toSession(data);
}

export async function getSession(sessionId: string): Promise<AssistantSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("assistant_sessions").select().eq("id", sessionId).single();
  if (error || !data) return null;
  return toSession(data);
}

export async function updateSession(
  sessionId: string,
  patch: Partial<{
    currentTopic: string | null;
    currentIntent: string | null;
    previousIntent: string | null;
    conversationState: ConversationState;
    collectedSlots: Record<string, string>;
    lastAction: string | null;
    confidenceScore: number | null;
    endedAt: string;
  }>,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("assistant_sessions")
    .update({
      current_topic: patch.currentTopic,
      current_intent: patch.currentIntent,
      previous_intent: patch.previousIntent,
      conversation_state: patch.conversationState,
      collected_slots: patch.collectedSlots,
      last_action: patch.lastAction,
      confidence_score: patch.confidenceScore,
      ended_at: patch.endedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

/** Last N messages (oldest first) — the "5-10 message" context window the
 * Spec asks for before generating a response. */
export async function getRecentMessages(sessionId: string, limit = 10): Promise<SessionMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("role, message_text, detected_language, detected_intent, confidence_score, entities")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data
    .map((r) => ({
      role: r.role as "user" | "assistant",
      messageText: r.message_text,
      detectedLanguage: r.detected_language,
      detectedIntent: r.detected_intent,
      confidenceScore: r.confidence_score,
      entities: (r.entities as Record<string, unknown>) ?? {},
    }))
    .reverse();
}

export async function saveMessage(sessionId: string, message: SessionMessage): Promise<void> {
  const supabase = await createClient();
  await supabase.from("assistant_messages").insert({
    session_id: sessionId,
    role: message.role,
    message_text: message.messageText,
    detected_language: message.detectedLanguage ?? null,
    detected_intent: message.detectedIntent ?? null,
    confidence_score: message.confidenceScore ?? null,
    entities: (message.entities ?? {}) as unknown as Json,
  });
}

export async function logEvent(
  sessionId: string | null,
  eventType: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("assistant_events")
    .insert({ session_id: sessionId, event_type: eventType, detail: detail as unknown as Json });
}

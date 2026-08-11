import { createAdminClient } from "@/lib/supabase/admin";

/** Thin read helpers over the analytics SQL views (assistant_intent_frequency,
 * assistant_unmatched_queries, assistant_conversation_length,
 * assistant_escalation_rate, assistant_satisfaction_events) — cross-user
 * aggregates, so these use the service-role client rather than a per-user one. */

export async function getMostCommonIntents(limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("assistant_intent_frequency").select().limit(limit);
  return data ?? [];
}

export async function getUnmatchedQueries(limit = 50) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("assistant_unmatched_queries").select().limit(limit);
  return data ?? [];
}

export async function getAverageConversationLength(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("assistant_conversation_length").select("message_count");
  if (!data || data.length === 0) return 0;
  const total = data.reduce((sum, row) => sum + (row.message_count ?? 0), 0);
  return total / data.length;
}

export async function getEscalationRate() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("assistant_escalation_rate").select().single();
  return data ?? { escalated_sessions: 0, total_sessions: 0, escalation_rate_pct: 0 };
}

export async function getSatisfactionEvents() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("assistant_satisfaction_events").select();
  return data ?? [];
}

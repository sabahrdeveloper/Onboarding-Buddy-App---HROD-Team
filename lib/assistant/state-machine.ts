/** Conversation state machine — the 12 states from the Spec, with an explicit
 * transition table so state changes are traceable rather than scattered
 * conditionals inside the engine. */

export type ConversationState =
  | "greeting"
  | "general_question"
  | "intent_identified"
  | "collecting_information"
  | "clarification_required"
  | "problem_solving"
  | "waiting_for_user"
  | "follow_up"
  | "confirmation"
  | "completed"
  | "escalation"
  | "conversation_end";

export type StateEvent =
  | "first_message"
  | "high_confidence_match"
  | "medium_confidence_match"
  | "low_confidence_match"
  | "slot_still_missing"
  | "all_slots_filled"
  | "needs_confirmation"
  | "continuation_detected"
  | "topic_shift_detected"
  | "repeated_low_confidence"
  | "escalation_rule_triggered"
  | "user_confirmed"
  | "user_corrected"
  | "answer_delivered";

const TRANSITIONS: Record<ConversationState, Partial<Record<StateEvent, ConversationState>>> = {
  greeting: {
    first_message: "general_question",
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
    low_confidence_match: "general_question",
    slot_still_missing: "collecting_information",
  },
  general_question: {
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
    low_confidence_match: "general_question",
    repeated_low_confidence: "escalation",
    slot_still_missing: "collecting_information",
    answer_delivered: "follow_up",
  },
  intent_identified: {
    slot_still_missing: "collecting_information",
    all_slots_filled: "problem_solving",
    needs_confirmation: "confirmation",
    escalation_rule_triggered: "escalation",
    answer_delivered: "follow_up",
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
  },
  collecting_information: {
    slot_still_missing: "collecting_information",
    all_slots_filled: "problem_solving",
    needs_confirmation: "confirmation",
    // A confident fresh match mid-collection means the user abandoned the
    // slot flow for a new topic (engine's freshOverride path).
    high_confidence_match: "intent_identified",
  },
  clarification_required: {
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
    low_confidence_match: "general_question",
    repeated_low_confidence: "escalation",
    slot_still_missing: "collecting_information",
    answer_delivered: "follow_up",
  },
  problem_solving: {
    answer_delivered: "follow_up",
    escalation_rule_triggered: "escalation",
  },
  follow_up: {
    continuation_detected: "intent_identified",
    topic_shift_detected: "general_question",
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
    low_confidence_match: "general_question",
    slot_still_missing: "collecting_information",
    answer_delivered: "follow_up",
  },
  confirmation: {
    user_confirmed: "completed",
    user_corrected: "collecting_information",
  },
  waiting_for_user: {
    slot_still_missing: "collecting_information",
  },
  completed: {
    continuation_detected: "follow_up",
    topic_shift_detected: "general_question",
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
    low_confidence_match: "general_question",
    slot_still_missing: "collecting_information",
    answer_delivered: "follow_up",
  },
  escalation: {
    answer_delivered: "conversation_end",
    high_confidence_match: "intent_identified",
    slot_still_missing: "collecting_information",
  },
  conversation_end: {
    first_message: "greeting",
    high_confidence_match: "intent_identified",
    medium_confidence_match: "clarification_required",
    low_confidence_match: "general_question",
    slot_still_missing: "collecting_information",
  },
};

export function nextState(current: ConversationState, event: StateEvent): ConversationState {
  return TRANSITIONS[current]?.[event] ?? current;
}

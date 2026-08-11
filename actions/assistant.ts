"use server";

import { createSession } from "@/lib/assistant/session-manager";
import { processMessage } from "@/lib/assistant/engine";

export async function startAssistantSession(): Promise<{ sessionId: string | null }> {
  const session = await createSession();
  return { sessionId: session?.id ?? null };
}

export async function sendAssistantMessage(sessionId: string, text: string) {
  return processMessage(sessionId, text);
}

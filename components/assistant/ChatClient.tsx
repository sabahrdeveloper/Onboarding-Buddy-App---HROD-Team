"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/mascot/Mascot";
import { Icon } from "@/components/icons/Icon";
import { startAssistantSession, sendAssistantMessage } from "@/actions/assistant";

const QUICK: [string, string][] = [
  ["Role / JD", "role"],
  ["System Access", "email"],
  ["Policy", "policy"],
  ["Buddy", "buddy"],
  ["KPI", "kpi"],
  ["30 Days", "30"],
  ["60 Days", "60"],
  ["90 Days", "90"],
  ["180 Days", "180"],
  ["Help", "help"],
];

// Sales Onboarding only — same underlying KB keys, Bangla display labels.
const QUICK_BN: [string, string][] = [
  ["রোল / JD", "role"],
  ["সিস্টেম অ্যাক্সেস", "email"],
  ["পলিসি", "policy"],
  ["বাডি", "buddy"],
  ["KPI", "kpi"],
  ["৩০ দিন", "30"],
  ["৬০ দিন", "60"],
  ["৯০ দিন", "90"],
  ["১৮০ দিন", "180"],
  ["সাহায্য", "help"],
];

const SESSION_STORAGE_KEY = "ob_assistant_session_id";

interface ChatMessage {
  id: number;
  from: "me" | "bot";
  text: string;
}

let nextId = 1;

export function ChatClient({ bn: isBn }: { bn?: boolean }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId++,
      from: "bot",
      text: isBn
        ? "আসসালামু আলাইকুম! Onboarding নিয়ে যেকোনো প্রশ্ন লিখুন — রোল, সিস্টেম অ্যাক্সেস, পলিসি, বাডি, KPI, ৩০/৬০/৯০/১৮০ দিন। নিচ থেকেও বেছে নিতে পারেন।"
        : "আসসালামু আলাইকুম! Onboarding নিয়ে যেকোনো প্রশ্ন লিখুন — Role, System Access, Policy, Buddy, KPI, 30/60/90/180 Days। নিচ থেকেও বেছে নিতে পারেন।",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null,
  );
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) return;
    startAssistantSession().then((res) => {
      if (res.sessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, res.sessionId);
        setSessionId(res.sessionId);
      }
    });
  }, [sessionId]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function pushMe(text: string) {
    setMessages((m) => [...m, { id: nextId++, from: "me", text }]);
  }

  async function ask(text: string, activeSessionId: string) {
    setTyping(true);
    const result = await sendAssistantMessage(activeSessionId, text);
    setTyping(false);
    const combined = result.followUpQuestion ? `${result.text}\n\n${result.followUpQuestion}` : result.text;
    setMessages((m) => [...m, { id: nextId++, from: "bot", text: combined }]);
  }

  function handleSend() {
    const text = input.trim();
    if (!text || !sessionId) return;
    pushMe(text);
    setInput("");
    void ask(text, sessionId);
  }

  function handleQuickAsk(label: string, key: string) {
    if (!sessionId) return;
    pushMe(`${label} সম্পর্কে জানতে চাই`);
    void ask(key, sessionId);
  }

  return (
    <>
      <div className="mb-3.5 flex items-center gap-3 border-b border-line pb-3 pt-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <div className="h-11 w-11 shrink-0">
          <Mascot variant="color" mood="happy" />
        </div>
        <div>
          <div className="font-en text-base font-extrabold text-text">OnboardingBuddy Assistant</div>
          <div className="text-xs font-semibold text-green-dark">
            {isBn ? "অনবোর্ডিং সাপোর্ট · অনলাইন" : "Onboarding Support · অনলাইন"}
          </div>
        </div>
      </div>

      <div className="mb-3.5 flex items-start gap-2 rounded-card border border-[#f0d08a] bg-warn-bg p-3 shadow-card">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-warn-tx" />
        <p className="text-[12.5px] font-semibold leading-snug text-warn-tx">
          {isBn ? "AI সহকারী এখনো developing পর্যায়ে আছে।" : "AI Assistant is still under development."}
        </p>
      </div>

      <div ref={feedRef} className="flex flex-col gap-2.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] whitespace-pre-line px-3.5 py-[11px] text-sm font-medium leading-[1.5] ${
              m.from === "me"
                ? "self-end rounded-[16px_16px_4px_16px] bg-green text-white"
                : "self-start rounded-[4px_16px_16px_16px] border border-line bg-card text-text shadow-card"
            }`}
          >
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="self-start rounded-[4px_16px_16px_16px] border border-line bg-card px-4 py-3.5 shadow-card">
            <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#c4cbb9]" />
            <span className="mx-1 inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#c4cbb9] [animation-delay:0.2s]" />
            <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#c4cbb9] [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      <div className="mb-3 mt-4 font-en text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
        {isBn ? "সহজ প্রশ্ন" : "Quick Questions"}
      </div>
      <div className="mb-24 flex flex-wrap gap-2">
        {(isBn ? QUICK_BN : QUICK).map(([label, key]) => (
          <button
            key={key}
            onClick={() => handleQuickAsk(label, key)}
            className="rounded-2xl border border-line bg-card px-3.5 py-2.5 font-en text-[13px] font-semibold text-text shadow-card transition-transform active:scale-[0.97]"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-[9px] border-t border-line bg-card px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="আপনার onboarding প্রশ্ন লিখুন…"
          className="flex-1 rounded-input border border-line bg-bg px-3.5 py-3 font-bn text-sm text-text outline-none focus:border-green"
        />
        <button
          onClick={handleSend}
          aria-label="Send"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-input bg-green text-white transition-transform active:scale-95"
        >
          <Icon name="arrowRight" size={20} strokeWidth={2} />
        </button>
      </div>
    </>
  );
}

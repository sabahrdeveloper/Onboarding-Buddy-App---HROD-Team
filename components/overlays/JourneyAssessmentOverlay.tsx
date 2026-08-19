"use client";

import { useState } from "react";
import { OverlayShell } from "@/components/overlays/OverlayShell";

export interface AssessmentQuestion {
  id: string;
  type: "mcq" | "open";
  question_text: string;
  options: { key: string; text: string }[] | null;
  marks: number;
}

interface JourneyAssessmentOverlayProps {
  journeyName: string;
  questions: AssessmentQuestion[];
  onBack: () => void;
  onSubmit: (answers: Record<string, string>) => void;
  pending: boolean;
  bn?: boolean;
}

export function JourneyAssessmentOverlay({
  journeyName,
  questions,
  onBack,
  onSubmit,
  pending,
  bn: isBn,
}: JourneyAssessmentOverlayProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  return (
    <OverlayShell title={isBn ? "অ্যাসেসমেন্ট" : "Assessment"} subtitle={journeyName} onBack={onBack}>
      <div className="mb-3.5 rounded-xl border border-[#f0d08a] bg-warn-bg p-3 text-[12.5px] font-semibold text-warn-tx">
        {isBn
          ? "এই অ্যাসেসমেন্ট একবারই জমা দেওয়া যাবে — পরে আর পরিবর্তন করা যাবে না।"
          : "This assessment can only be submitted once — it cannot be retaken."}
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="mb-3.5 rounded-card border border-line bg-card p-3.5 shadow-card">
          <div className="mb-2 text-[13.5px] font-bold text-text">
            {i + 1}. {q.question_text}
          </div>
          {q.type === "mcq" ? (
            <div className="flex flex-col gap-1.5">
              {(q.options ?? []).map((o) => (
                <label key={o.key} className="flex items-center gap-2 text-[13px] font-medium text-text">
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={o.key}
                    checked={answers[q.id] === o.key}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))}
                    className="h-4 w-4 accent-green"
                  />
                  {o.key}) {o.text}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              rows={3}
              className="w-full rounded-input border border-line bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-green"
            />
          )}
        </div>
      ))}

      <button
        onClick={() => onSubmit(answers)}
        disabled={pending || !allAnswered}
        className="mt-1 w-full rounded-button bg-green px-4 py-3.5 font-en text-sm font-bold text-white disabled:opacity-60"
      >
        {isBn ? "জমা দিন" : "Submit"}
      </button>
    </OverlayShell>
  );
}

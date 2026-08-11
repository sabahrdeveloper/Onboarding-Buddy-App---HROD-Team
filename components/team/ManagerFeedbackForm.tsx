"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons/Icon";
import { submitManagerFeedback } from "@/actions/manager";

interface ManagerFeedbackFormProps {
  enrollNumber: string;
  assessmentKey: string;
  initialFeedback: string;
}

export function ManagerFeedbackForm({ enrollNumber, assessmentKey, initialFeedback }: ManagerFeedbackFormProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await submitManagerFeedback({ enrollNumber, assessmentKey, feedback });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="mt-2.5">
      <textarea
        value={feedback}
        onChange={(e) => {
          setFeedback(e.target.value);
          setSaved(false);
        }}
        placeholder="এই assessment নিয়ে আপনার মন্তব্য লিখুন — subordinate এটি দেখতে পাবে।"
        rows={3}
        className="w-full resize-none rounded-input border border-line bg-bg px-3.5 py-3 font-bn text-sm text-text outline-none focus:border-green"
      />
      {error && <p className="mt-1 text-xs font-semibold text-err-tx">{error}</p>}
      <button
        onClick={handleSave}
        disabled={isPending || saved}
        className="mt-2 flex items-center gap-1.5 rounded-input bg-green px-3.5 py-2 font-en text-xs font-bold text-white transition-transform active:scale-[0.97] disabled:opacity-50"
      >
        <Icon name="check" size={14} />
        {saved ? "Saved" : isPending ? "Saving…" : "Save Feedback"}
      </button>
    </div>
  );
}

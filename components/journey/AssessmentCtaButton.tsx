"use client";

import { useOverlay } from "@/components/journey/OverlayProvider";

interface AssessmentCtaButtonProps {
  state: "locked" | "ready" | "done";
  journeyId: string;
  score: number | null;
  bn?: boolean;
}

export function AssessmentCtaButton({ state, journeyId, score, bn: isBn }: AssessmentCtaButtonProps) {
  const { openJourneyAssessment } = useOverlay();

  if (state === "locked") {
    return (
      <div className="mt-3 rounded-button border border-line bg-card px-4 py-3.5 text-center font-en text-sm font-semibold text-muted">
        {isBn ? "অ্যাসেসমেন্ট জমা দিতে প্রথমে আপনার সব কাজ সম্পন্ন করুন" : "Complete all your tasks to submit the assessment"}
      </div>
    );
  }

  if (state === "ready") {
    return (
      <button
        onClick={() => openJourneyAssessment(journeyId)}
        className="mt-3 w-full rounded-button bg-green px-4 py-3.5 text-center font-en text-sm font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98]"
      >
        {isBn ? "তাড়াতাড়ি করুন! অ্যাসেসমেন্ট দিন" : "Hurry! Take the assessment"}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-button border border-[#cde9d5] bg-green-light px-4 py-3.5 text-center font-en text-sm font-bold text-green-dark">
      {isBn
        ? `অভিনন্দন! আপনি ইতিমধ্যে অ্যাসেসমেন্ট সম্পন্ন করেছেন এবং আপনার স্কোর '${score}'!`
        : `Congratulations! You have completed your assessment already and your score is '${score}'!`}
    </div>
  );
}

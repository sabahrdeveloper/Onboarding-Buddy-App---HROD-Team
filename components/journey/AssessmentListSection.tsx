"use client";

import { useOverlay } from "@/components/journey/OverlayProvider";
import type { AssessmentKey } from "@/lib/types";

export interface AssessmentListItem {
  key: AssessmentKey;
  title: string;
  state: "locked" | "ready" | "done";
}

export function AssessmentListSection({ items, bn: isBn }: { items: AssessmentListItem[]; bn?: boolean }) {
  const { openAssessment } = useOverlay();

  return (
    <>
      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">
        {isBn ? "অ্যাসেসমেন্ট" : "Assessments"}
      </div>
      <div className="mb-4 flex flex-col gap-2.5">
        {items.map((item) => {
          if (item.state === "locked") {
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-card border border-line bg-card p-3.5 shadow-card"
              >
                <span className="font-en text-[13.5px] font-semibold text-muted">{item.title}</span>
                <span className="font-en text-[11.5px] font-semibold text-muted">
                  {isBn ? "কাজ সম্পন্ন করুন প্রথমে" : "Complete tasks first"}
                </span>
              </div>
            );
          }
          if (item.state === "done") {
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-card border border-[#cde9d5] bg-green-light p-3.5 shadow-card"
              >
                <span className="font-en text-[13.5px] font-bold text-green-dark">{item.title}</span>
                <span className="font-en text-[11.5px] font-bold text-green-dark">
                  {isBn ? "জমা দেওয়া হয়েছে" : "Submitted"}
                </span>
              </div>
            );
          }
          return (
            <button
              key={item.key}
              onClick={() => openAssessment(item.key)}
              className="flex items-center justify-between rounded-card border border-line bg-card p-3.5 text-left shadow-card transition-transform active:scale-[0.98]"
            >
              <span className="font-en text-[13.5px] font-bold text-text">{item.title}</span>
              <span className="rounded-lg bg-green px-3 py-1.5 font-en text-[11.5px] font-bold text-white">
                {isBn ? "শুরু করুন" : "Start"}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

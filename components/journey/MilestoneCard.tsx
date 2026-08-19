"use client";

import { Icon } from "@/components/icons/Icon";
import { useOverlay } from "@/components/journey/OverlayProvider";
import { bn } from "@/lib/bn";
import type { GrowthPhase, JourneyPhase } from "@/lib/types";

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "done" | "prog" | "lock" }) {
  const toneClass =
    tone === "done"
      ? "bg-ok-bg text-ok-tx"
      : tone === "prog"
        ? "bg-info-bg text-info-tx"
        : "bg-[#F0F1F3] text-muted";
  return (
    <span className={`rounded-[10px] px-2.5 py-[5px] font-en text-[11px] font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

export function MilestoneCard({ phase, bn: isBn }: { phase: JourneyPhase; bn?: boolean }) {
  const { openPhase } = useOverlay();
  const pending = phase.totalTasks - phase.doneTasks;
  const pct = Math.round((phase.doneTasks / phase.totalTasks) * 100);
  const complete = phase.doneTasks === phase.totalTasks;
  const inProgress = phase.doneTasks > 0 && !complete;

  return (
    <div
      className={`relative mb-3 rounded-card border p-4 shadow-card ${
        complete ? "border-[#cde9d5] bg-[#fafdf9]" : "border-line bg-card"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] font-en text-sm font-extrabold text-white"
          style={{ background: phase.color }}
        >
          {phase.short}
        </div>
        <div>
          <div className="font-en text-base font-bold text-text">{phase.title}</div>
          <div className="mt-0.5 text-xs font-medium text-muted">{phase.sub}</div>
        </div>
      </div>

      <div className="mb-2.5 mt-0.5 flex gap-[22px]">
        <div className="text-xs font-semibold text-muted">
          <b className="block font-en text-base font-extrabold leading-tight text-text">{bn(phase.totalTasks)}</b>
          {isBn ? "মোট" : "Total"}
        </div>
        <div className="text-xs font-semibold text-muted">
          <b className="block font-en text-base font-extrabold leading-tight text-green-dark">{bn(phase.doneTasks)}</b>
          {isBn ? "সম্পন্ন" : "Completed"}
        </div>
        <div className="text-xs font-semibold text-muted">
          <b className="block font-en text-base font-extrabold leading-tight text-warn-tx">{bn(pending)}</b>
          {isBn ? "বাকি" : "Pending"}
        </div>
      </div>

      <div className="my-[9px] h-2.5 overflow-hidden rounded-lg bg-[#edeff2]">
        <div className="h-full rounded-lg bg-green transition-[width]" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2.5">
        {complete ? (
          <StatusPill tone="done">{isBn ? "সম্পন্ন" : "Completed"}</StatusPill>
        ) : inProgress ? (
          <StatusPill tone="prog">{isBn ? "চলমান" : "In Progress"}</StatusPill>
        ) : (
          <StatusPill tone="lock">{isBn ? "শুরু হয়নি" : "Not started"}</StatusPill>
        )}
        <button
          onClick={() => openPhase(phase.key)}
          className="flex items-center gap-1.5 rounded-xl bg-green px-[18px] py-[11px] font-en text-[13px] font-bold text-white transition-transform active:scale-[0.98]"
        >
          {inProgress ? (isBn ? "চালিয়ে যান" : "Continue") : complete ? (isBn ? "রিভিউ" : "Review") : isBn ? "শুরু করুন" : "Start"}
          <Icon name="arrowRight" size={15} />
        </button>
      </div>
    </div>
  );
}

export function GrowthMilestoneCard({ phase, bn: isBn }: { phase: GrowthPhase; bn?: boolean }) {
  const { openGrowth } = useOverlay();
  return (
    <div
      className={`relative mb-3 rounded-card border p-4 shadow-card ${
        phase.unlocked ? "border-[#cbddfb] bg-[#f7faff]" : "border-[#cbddfb] bg-[#f7faff] opacity-75"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] bg-blue font-en text-sm font-extrabold text-white">
          180D
        </div>
        <div>
          <div className="font-en text-base font-bold text-text">{phase.title}</div>
          <div className="mt-0.5 text-xs font-medium text-muted">{phase.sub}</div>
        </div>
      </div>

      <div className="mb-1 text-[12.5px] font-medium text-muted">
        {isBn ? `${bn(phase.reviewItemCount)}টি প্রশ্ন · ৯০ দিনের পর শুরু` : `${phase.reviewItemCount} growth review items · unlocks after 90 days`}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2.5">
        <StatusPill tone={phase.unlocked ? "prog" : "lock"}>
          {phase.unlocked ? (isBn ? "আনলকড" : "Unlocked") : isBn ? "লকড" : "Locked"}
        </StatusPill>
        <button
          onClick={openGrowth}
          className={`flex items-center gap-1.5 rounded-xl px-[18px] py-[11px] font-en text-[13px] font-bold text-white transition-transform active:scale-[0.98] ${
            phase.unlocked ? "bg-green" : "bg-[#9aa1ab]"
          }`}
        >
          {phase.unlocked ? (isBn ? "রিভিউ শুরু করুন" : "Start Review") : isBn ? "প্রিভিউ" : "Preview"}
          <Icon name="arrowRight" size={15} />
        </button>
      </div>
    </div>
  );
}

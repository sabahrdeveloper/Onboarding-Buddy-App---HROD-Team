"use client";

import { Icon } from "@/components/icons/Icon";
import { useOverlay } from "@/components/journey/OverlayProvider";
import { bn } from "@/lib/bn";

export function ViewWorkListButton({
  variant = "secondary",
  bn: isBn,
}: {
  variant?: "primary" | "secondary";
  bn?: boolean;
}) {
  // Reads the live task list already loaded into OverlayProvider (same
  // source the "50 Work List" overlay itself opens) rather than a prop, so
  // the count can never drift from what's actually shown when opened —
  // and stays correct as HR admin adds/removes tasks for a variant instead
  // of the old hardcoded "50".
  const { openList, taskCount } = useOverlay();

  const className =
    variant === "primary"
      ? "mt-2.5 flex w-full items-center justify-center gap-2 rounded-button border border-line bg-card px-4 py-3.5 font-en text-sm font-bold text-text shadow-card transition-transform active:scale-[0.98]"
      : "mb-2 flex w-full items-center justify-center gap-2 rounded-button border border-line bg-card px-4 py-3.5 font-en text-sm font-bold text-text shadow-card transition-transform active:scale-[0.98]";

  return (
    <button onClick={openList} className={className}>
      <Icon name="list" size={18} />
      {isBn ? `সম্পূর্ণ ${bn(taskCount)}টি কাজের তালিকা দেখুন` : `View Full ${taskCount} Work List`}
    </button>
  );
}

"use client";

import { Icon } from "@/components/icons/Icon";
import { useOverlay } from "@/components/journey/OverlayProvider";
import type { PhaseKey } from "@/lib/types";

export function ContinueJourneyButton({ currentPhase }: { currentPhase: PhaseKey | "180" }) {
  const { openPhase, openGrowth } = useOverlay();

  return (
    <button
      onClick={() => (currentPhase === "180" ? openGrowth() : openPhase(currentPhase))}
      className="mt-3 flex w-full items-center justify-center gap-[9px] rounded-button bg-green px-4 py-[15px] font-en text-[15px] font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98]"
    >
      <Icon name="arrowRight" size={18} />
      আমার জার্নি চালিয়ে যান
    </button>
  );
}

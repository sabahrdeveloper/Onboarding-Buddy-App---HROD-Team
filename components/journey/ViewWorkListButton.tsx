"use client";

import { Icon } from "@/components/icons/Icon";
import { useOverlay } from "@/components/journey/OverlayProvider";

export function ViewWorkListButton({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const { openList } = useOverlay();

  if (variant === "primary") {
    return (
      <button
        onClick={openList}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-button border border-line bg-card px-4 py-3.5 font-en text-sm font-bold text-text shadow-card transition-transform active:scale-[0.98]"
      >
        <Icon name="list" size={18} />
        View Full 50 Work List
      </button>
    );
  }

  return (
    <button
      onClick={openList}
      className="mb-2 flex w-full items-center justify-center gap-2 rounded-button border border-line bg-card px-4 py-3.5 font-en text-sm font-bold text-text shadow-card transition-transform active:scale-[0.98]"
    >
      <Icon name="list" size={18} />
      View Full 50 Work List
    </button>
  );
}

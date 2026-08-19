"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";

/**
 * Goes back to whatever page actually linked here (e.g. /notifications is
 * opened from both /home and /select-onboarding's bell icon) instead of a
 * single hardcoded destination — a fixed href silently sends a Light
 * Engineering employee on the Sales track back to /home instead of
 * /select-onboarding. Falls back to `fallbackHref` only when there's no
 * in-app history to go back to (e.g. opened directly via URL/bookmark).
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
    >
      <Icon name="chevronLeft" size={18} />
    </button>
  );
}

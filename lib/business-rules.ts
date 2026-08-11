import type { PhaseKey } from "@/lib/types";

const TOTAL_TASKS = 50;
const PHASE_ORDER: PhaseKey[] = ["30", "60", "90"];

/** BRU-03: overall onboarding progress = completed works / 50 total works. */
export function progressPercent(completed: number): number {
  return Math.round((completed / TOTAL_TASKS) * 100);
}

/** BRU-04: current phase is the earliest incomplete phase among 30/60/90; "180" once all three are done. */
export function currentPhase(doneByPhase: Record<PhaseKey, { done: number; total: number }>): PhaseKey | "180" {
  for (const phase of PHASE_ORDER) {
    const counts = doneByPhase[phase];
    if (!counts || counts.done < counts.total) return phase;
  }
  return "180";
}

/** BRU-09: 180 Days Growth Review stays locked until all 50 works + the 30/60/90 assessments are done. */
export function growthReviewUnlocked(allTasksDone: boolean, assessmentsSubmitted: Record<"30" | "60" | "90", boolean>): boolean {
  return allTasksDone && assessmentsSubmitted["30"] && assessmentsSubmitted["60"] && assessmentsSubmitted["90"];
}

/** BRU-07 (revised): an assessment can't be submitted until every item is rated. Final Status was removed from the Rating tab. */
export function canSubmitAssessment(ratings: Record<string, unknown>, items: string[]): boolean {
  return items.every((item) => ratings[item] !== undefined && ratings[item] !== null);
}

/** Home page Reminder field: days left in the current phase's window, counted from joining date. */
export function daysRemainingInPhase(phase: PhaseKey, joiningDate: string | null): number {
  const target = Number(phase);
  if (!joiningDate) return target;
  const elapsedMs = Date.now() - new Date(joiningDate).getTime();
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  return Math.max(0, target - elapsedDays);
}

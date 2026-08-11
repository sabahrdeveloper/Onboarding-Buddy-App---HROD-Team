/** Employee KPI — the manually-submitted, manager-approved monthly KPI
 * feature. Distinct from the automatic task-completion KPI 1-4 dashboard
 * (lib/kpi.ts): those are derived from onboarding-task data; these are
 * numbers the employee proposes and the manager approves each month. */

export type SubmissionStatus = "pending" | "approved" | "rejected";
export type KpiItemPace = "on_track" | "at_risk";

export interface KpiItemLike {
  target: number;
  achievement: number;
}

/** Current calendar month as 'YYYY-MM' — the natural key for one submission
 * per employee per month. */
export function currentPeriodMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Achievement as a percentage of target, clamped to [0, 100] for display —
 * a target of 0 (shouldn't happen; forms require > 0) reads as 0% rather
 * than dividing by zero. */
export function itemPct(item: KpiItemLike): number {
  if (item.target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((item.achievement / item.target) * 100)));
}

/**
 * On-track vs at-risk: compares the item's achievement % against the
 * expected pace for how far the current month has progressed (day 15 of a
 * 30-day month → 50% expected). This is a simple, transparent pacing rule —
 * flagged as an assumption since the source spec didn't define one.
 */
export function itemPace(item: KpiItemLike, now: Date = new Date()): KpiItemPace {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedPct = (now.getDate() / daysInMonth) * 100;
  return itemPct(item) >= expectedPct - 10 ? "on_track" : "at_risk";
}

export function overallPct(items: KpiItemLike[]): number {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, i) => sum + itemPct(i), 0) / items.length);
}

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const STATUS_PILL_CLASS: Record<SubmissionStatus, string> = {
  pending: "bg-warn-bg text-warn-tx",
  approved: "bg-ok-bg text-ok-tx",
  rejected: "bg-err-bg text-err-tx",
};

export function formatMonthDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

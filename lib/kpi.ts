import type { IconName } from "@/components/icons/Icon";

/**
 * KPI model for the OnboardingBuddy KPI tab.
 *
 * Every score derives from onboarding-task completion (no survey/engagement
 * data source exists — confirmed with product):
 *   - KPI 1 (Employee): the employee's own completion % of their 50 tasks.
 *   - KPI 2 (Manager):  average of the manager's subordinates' completion %.
 *   - KPI 3 (HR):       average completion % across all currently-onboarding
 *                       employees (HR oversees the whole onboarding population).
 *   - KPI 4 (IT):       average, across onboarding employees, of their
 *                       IT-service task completion % (tasks whose assignee set
 *                       includes the 'it' key).
 *
 * ASSUMPTIONS (flagged to product):
 *   - Onboarding window = 200 days, starting 3 days after the employee's
 *     joining_date (the app's existing business anchor). If joining_date is
 *     null we treat the employee as in-window rather than excluding them.
 *   - "Currently onboarding" (for KPI 2/3/4 aggregates) = the employee has
 *     started (has task-status rows), is < 100% complete, and is within the
 *     200-day window. Finished or not-yet-started employees are excluded.
 */

export const TOTAL_TASKS = 50;
export const ONBOARDING_WINDOW_DAYS = 200;
export const ONBOARDING_START_OFFSET_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type KpiId = "employee" | "manager" | "hr" | "it";

export interface KpiMeta {
  id: KpiId;
  number: number;
  title: string;
  subtitle: string;
  icon: IconName;
}

export const KPI_META: Record<KpiId, KpiMeta> = {
  employee: {
    id: "employee",
    number: 1,
    title: "30/60/90 Achievement",
    subtitle: "আপনার onboarding task সম্পন্নের হার",
    icon: "target",
  },
  manager: {
    id: "manager",
    number: 2,
    title: "Manager KPI",
    subtitle: "আপনার team member-দের onboarding অগ্রগতির গড়",
    icon: "users",
  },
  hr: {
    id: "hr",
    number: 3,
    title: "HR KPI",
    subtitle: "onboarding-এ থাকা সকল কর্মীর অগ্রগতির গড়",
    icon: "award",
  },
  it: {
    id: "it",
    number: 4,
    title: "IT Service Satisfaction",
    subtitle: "IT-service task সম্পন্নের গড় হার",
    icon: "monitor",
  },
};

/** A task counts toward the IT Service KPI when IT is one of its assignees. */
export function isItTask(responsibleKeys: string[]): boolean {
  return responsibleKeys.includes("it");
}

/** A task counts toward learning-effectiveness when Training is an assignee. */
export function isLearningTask(responsibleKeys: string[]): boolean {
  return responsibleKeys.includes("training");
}

/** Rounded completion percentage; 0 when there are no applicable tasks. */
export function completionPct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

/** Average of per-employee percentages; 0 for an empty population. */
export function averagePct(pcts: number[]): number {
  if (pcts.length === 0) return 0;
  return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length);
}

/** [start, end] of the onboarding window: joining + 3 days, running 200 days. */
export function onboardingWindow(joiningDate: string | null): { start: Date; end: Date } | null {
  if (!joiningDate) return null;
  const joined = new Date(joiningDate).getTime();
  if (Number.isNaN(joined)) return null;
  const start = new Date(joined + ONBOARDING_START_OFFSET_DAYS * DAY_MS);
  const end = new Date(start.getTime() + ONBOARDING_WINDOW_DAYS * DAY_MS);
  return { start, end };
}

/** Within the 200-day window? Unknown joining date is treated as in-window. */
export function isWithinWindow(joiningDate: string | null, now: number = Date.now()): boolean {
  const window = onboardingWindow(joiningDate);
  if (!window) return true;
  return now <= window.end.getTime();
}

export interface EmployeeCompletion {
  enrollNumber: string;
  name: string;
  doneCount: number;
  itDoneCount: number;
  itTotal: number;
  hasStarted: boolean;
  joiningDate: string | null;
}

/** KPI 1 for an individual — overall onboarding completion %. */
export function employeeKpiPct(ec: EmployeeCompletion): number {
  return completionPct(ec.doneCount, TOTAL_TASKS);
}

/** IT-service completion % for a single employee (used by the KPI 4 average). */
export function employeeItPct(ec: EmployeeCompletion): number {
  return completionPct(ec.itDoneCount, ec.itTotal);
}

/** All onboarding tasks done, and finished within the 200-day window. */
export function achievedOnTime(ec: EmployeeCompletion): boolean {
  return ec.doneCount >= TOTAL_TASKS && isWithinWindow(ec.joiningDate);
}

/** Restricts an employee population to those actively in onboarding. */
export function currentlyOnboarding(list: EmployeeCompletion[], now: number = Date.now()): EmployeeCompletion[] {
  return list.filter(
    (ec) => ec.hasStarted && ec.doneCount < TOTAL_TASKS && isWithinWindow(ec.joiningDate, now),
  );
}

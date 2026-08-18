import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getEmployee,
  getEmployeeVariant,
  getSubordinates,
  getTaskStatuses,
  getTasks,
  getUnreadKpiNotificationCount,
} from "@/lib/data/queries";
import type { Database } from "@/lib/supabase/types";
import { Icon } from "@/components/icons/Icon";
import { KpiHeadlineCard } from "@/components/kpi/KpiHeadlineCard";
import { StatusIcon } from "@/components/kpi/StatusIcon";
import { TaskStatusList, type TaskStatusRow } from "@/components/kpi/TaskStatusList";
import { EmployeeKpiOverviewCard, type EmployeeKpiOverviewSubmission } from "@/components/employee-kpi/EmployeeKpiOverviewCard";
import { StatusPill } from "@/components/employee-kpi/StatusPill";
import { NotificationBell } from "@/components/employee-kpi/NotificationBell";
import { KpiSectionTabs } from "@/components/kpi/KpiSectionTabs";
import { currentPeriodMonth, overallPct, periodLabel, type SubmissionStatus } from "@/lib/employee-kpi";
import type { PhaseKey } from "@/lib/types";
import {
  TOTAL_TASKS,
  averagePct,
  completionPct,
  currentlyOnboarding,
  employeeItPct,
  employeeKpiPct,
  isItTask,
  type EmployeeCompletion,
} from "@/lib/kpi";

interface RosterEmployee {
  enroll_number: string;
  name: string;
  joining_date: string | null;
}

/** Reads task statuses for a set of employees (RLS scopes what's visible) and
 * folds them into per-employee completion records for the KPI aggregates. */
async function buildCompletions(
  supabase: SupabaseClient<Database>,
  employees: RosterEmployee[],
  itTaskIds: Set<string>,
  itTotal: number,
): Promise<EmployeeCompletion[]> {
  const enrolls = employees.map((e) => e.enroll_number);
  if (enrolls.length === 0) return [];

  const { data: statuses } = await supabase
    .from("employee_task_status")
    .select("employee_enroll_number, task_id, done")
    .in("employee_enroll_number", enrolls);

  const byEmp = new Map<string, { done: number; itDone: number; started: number }>();
  for (const s of statuses ?? []) {
    const rec = byEmp.get(s.employee_enroll_number) ?? { done: 0, itDone: 0, started: 0 };
    rec.started++;
    if (s.done) {
      rec.done++;
      if (itTaskIds.has(s.task_id)) rec.itDone++;
    }
    byEmp.set(s.employee_enroll_number, rec);
  }

  return employees.map((e) => {
    const rec = byEmp.get(e.enroll_number);
    return {
      enrollNumber: e.enroll_number,
      name: e.name,
      doneCount: rec?.done ?? 0,
      itDoneCount: rec?.itDone ?? 0,
      itTotal,
      hasStarted: (rec?.started ?? 0) > 0,
      joiningDate: e.joining_date,
    };
  });
}

export default async function KpiPage() {
  // KPI is not a feature of resources-mode variants (Akij Light Engineering) —
  // direct URL access redirects to their actual third tab instead.
  const variant = await getEmployeeVariant();
  if (variant.navMode === "resources") redirect("/resources");

  const supabase = await createClient();
  const [{ data: employee }, { data: rawTasks }, { data: selfStatuses }, isManagerRes, isHrRes, isItRes] = await Promise.all([
    getEmployee(),
    getTasks(),
    getTaskStatuses(),
    supabase.rpc("is_manager"),
    supabase.rpc("is_hr_admin"),
    supabase.rpc("is_it_admin"),
  ]);

  const tasks = rawTasks ?? [];
  const itTaskIds = new Set(tasks.filter((t) => isItTask(t.responsible_keys)).map((t) => t.id));
  const itTotal = itTaskIds.size;

  const isManager = Boolean(isManagerRes.data);
  const isHr = Boolean(isHrRes.data);
  const isIt = Boolean(isItRes.data);

  // ---- KPI 1: the viewer's own onboarding completion ----
  const selfHasTasks = (selfStatuses ?? []).length > 0;
  const selfDoneByTaskId = new Map((selfStatuses ?? []).map((s) => [s.task_id, s.done]));
  const selfDone = (selfStatuses ?? []).filter((s) => s.done).length;
  const selfPct = completionPct(selfDone, TOTAL_TASKS);
  const selfTaskRows: TaskStatusRow[] = tasks.map((t) => ({
    id: t.id,
    workNumber: t.work_number,
    phase: t.phase as PhaseKey,
    title: t.title,
    done: Boolean(selfDoneByTaskId.get(t.id)),
  }));

  const period = currentPeriodMonth();

  // ---- Everything below is independent per-section data — run all of it
  // concurrently instead of one long sequential await chain (this was the
  // main cause of the slow /kpi load: manager, self-submission, and HR/IT
  // roster queries don't depend on each other, but previously ran one after
  // another). ----

  async function loadManagerBlock() {
    if (!isManager) return { managerBlock: null, subordinatesForKpiDash: [] as { enroll_number: string; name: string }[] };
    const { data: subordinates } = await getSubordinates();
    const subordinatesForKpiDash = (subordinates ?? []).map((s) => ({ enroll_number: s.enroll_number, name: s.name }));
    const completions = await buildCompletions(supabase, (subordinates ?? []) as RosterEmployee[], itTaskIds, itTotal);
    const onboarding = currentlyOnboarding(completions);
    return {
      managerBlock: { pct: averagePct(onboarding.map(employeeKpiPct)), onboardingCount: onboarding.length, rows: completions },
      subordinatesForKpiDash,
    };
  }

  async function loadSelfSubmission(): Promise<EmployeeKpiOverviewSubmission | null> {
    // Single query embedding the reviewer's name via the explicit FK alias —
    // avoids a second round-trip that a separate nameFor() lookup required.
    const { data: row } = await supabase
      .from("kpi_submissions")
      .select(
        "id, period_month, status, submitted_at, reviewed_at, manager_comment, reviewer:employees!kpi_submissions_reviewed_by_enroll_number_fkey(name)",
      )
      .eq("employee_enroll_number", employee?.enroll_number ?? "")
      .eq("period_month", period)
      .maybeSingle();
    if (!row) return null;

    const { data: items } = await supabase
      .from("kpi_items")
      .select("id, name, target, unit, achievement, added_by_manager")
      .eq("submission_id", row.id)
      .order("created_at");

    return {
      period: row.period_month,
      status: row.status as SubmissionStatus,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      reviewedByName: row.reviewer?.name ?? null,
      managerComment: row.manager_comment,
      items: (items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        target: i.target,
        unit: i.unit,
        achievement: i.achievement,
        addedByManager: i.added_by_manager,
      })),
    };
  }

  async function loadRoster(): Promise<EmployeeCompletion[] | null> {
    if (!isHr && !isIt) return null;
    const { data: allEmployees } = await supabase.from("employees").select("enroll_number, name, joining_date");
    return buildCompletions(supabase, (allEmployees ?? []) as RosterEmployee[], itTaskIds, itTotal);
  }

  const [managerResult, selfSubmission, roster, unreadCount] = await Promise.all([
    loadManagerBlock(),
    loadSelfSubmission(),
    loadRoster(),
    getUnreadKpiNotificationCount(),
  ]);
  const { managerBlock, subordinatesForKpiDash } = managerResult;

  // ---- Employee KPI — manager dashboard: this period's submissions across the team ----
  let managerKpiDash: {
    pending: number;
    rejected: number;
    approved: number;
    avgTeamProgress: number;
    rows: { enrollNumber: string; name: string; status: SubmissionStatus | "not_submitted"; itemCount: number }[];
  } | null = null;
  if (isManager && subordinatesForKpiDash.length > 0) {
    const enrolls = subordinatesForKpiDash.map((s) => s.enroll_number);
    const { data: teamSubmissions } = await supabase
      .from("kpi_submissions")
      .select("id, employee_enroll_number, status, kpi_items(target, achievement)")
      .in("employee_enroll_number", enrolls)
      .eq("period_month", period);

    const byEmp = new Map((teamSubmissions ?? []).map((s) => [s.employee_enroll_number, s]));
    const approvedPcts = (teamSubmissions ?? []).filter((s) => s.status === "approved").map((s) => overallPct(s.kpi_items));

    managerKpiDash = {
      pending: (teamSubmissions ?? []).filter((s) => s.status === "pending").length,
      rejected: (teamSubmissions ?? []).filter((s) => s.status === "rejected").length,
      approved: (teamSubmissions ?? []).filter((s) => s.status === "approved").length,
      avgTeamProgress: approvedPcts.length > 0 ? Math.round(approvedPcts.reduce((a, b) => a + b, 0) / approvedPcts.length) : 0,
      rows: subordinatesForKpiDash.map((s) => {
        const sub = byEmp.get(s.enroll_number);
        return {
          enrollNumber: s.enroll_number,
          name: s.name,
          status: (sub?.status as SubmissionStatus) ?? "not_submitted",
          itemCount: sub?.kpi_items.length ?? 0,
        };
      }),
    };
  }

  const onboardingRoster = roster ? currentlyOnboarding(roster) : [];
  const hrPct = averagePct(onboardingRoster.map(employeeKpiPct));
  const itPct = averagePct(onboardingRoster.map(employeeItPct));

  const showAnything = selfHasTasks || isManager || isHr || isIt;

  const onboardingContent = (
    <>
      {!showAnything && (
        <div className="rounded-card border border-line bg-card p-5 text-center shadow-card">
          <p className="text-sm font-medium text-muted">এখনো দেখানোর মতো কোনো KPI নেই।</p>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {/* KPI 1 — employee's own achievement, tasks grouped by phase */}
        {selfHasTasks && (
          <div className="flex flex-col gap-2.5">
            <KpiHeadlineCard kpiId="employee" pct={selfPct} caption={`${selfDone}/${TOTAL_TASKS} task সম্পন্ন`} />
            <TaskStatusList tasks={selfTaskRows} />
          </div>
        )}

        {/* KPI 2 — manager */}
        {managerBlock && (
          <div className="flex flex-col gap-2.5">
            <KpiHeadlineCard
              kpiId="manager"
              pct={managerBlock.pct}
              caption={`${managerBlock.onboardingCount} জন এখন onboarding-এ`}
            />
            {managerBlock.rows.length > 0 && (
              <div className="rounded-card border border-line bg-card p-1.5 shadow-card">
                {managerBlock.rows.map((r) => {
                  const pct = employeeKpiPct(r);
                  return (
                    <Link
                      key={r.enrollNumber}
                      href={`/team/${r.enrollNumber}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors active:bg-bg"
                    >
                      <StatusIcon done={r.doneCount >= TOTAL_TASKS} size={18} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-en text-[13px] font-bold text-text">{r.name}</div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-lg bg-[#edeff2]">
                          <div className="h-full rounded-lg bg-green" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="shrink-0 font-en text-[13px] font-extrabold text-green-dark">{pct}%</span>
                      <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KPI 3 — HR */}
        {isHr && (
          <KpiHeadlineCard kpiId="hr" pct={hrPct} caption={`${onboardingRoster.length} জন কর্মী onboarding-এ`} />
        )}

        {/* KPI 4 — IT */}
        {isIt && (
          <KpiHeadlineCard
            kpiId="it"
            pct={itPct}
            caption={`${itTotal}টি IT-service task · ${onboardingRoster.length} জন কর্মী`}
          />
        )}
      </div>
    </>
  );

  const employeeContent = (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-en text-base font-extrabold text-text">Employee KPI</div>
          <div className="text-[12px] font-medium text-muted">Monthly target · manager approval</div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      <EmployeeKpiOverviewCard submission={selfSubmission} />

          {managerKpiDash && (
            <div className="rounded-card border border-line bg-card p-4 shadow-card">
              <div className="mb-3 font-en text-[15px] font-extrabold text-text">
                Employee KPI — Team ({periodLabel(period)})
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-bg px-2 py-3">
                  <div className="font-en text-lg font-extrabold text-warn-tx">{managerKpiDash.pending}</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-muted">Pending Approval</div>
                </div>
                <div className="rounded-xl bg-bg px-2 py-3">
                  <div className="font-en text-lg font-extrabold text-err-tx">{managerKpiDash.rejected}</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-muted">Need Revision</div>
                </div>
                <div className="rounded-xl bg-bg px-2 py-3">
                  <div className="font-en text-lg font-extrabold text-ok-tx">{managerKpiDash.approved}</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-muted">Approved</div>
                </div>
                <div className="rounded-xl bg-bg px-2 py-3">
                  <div className="font-en text-lg font-extrabold text-green-dark">{managerKpiDash.avgTeamProgress}%</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-muted">Average Team Progress</div>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="font-en text-[12px] font-bold text-muted">Team Overview</span>
                <Link href="/employee-kpi/pending" className="font-en text-[11.5px] font-bold text-green-dark">
                  View All
                </Link>
              </div>
              <div className="flex flex-col gap-1.5">
                {managerKpiDash.rows.map((r) => (
                  <Link
                    key={r.enrollNumber}
                    href={`/team/${r.enrollNumber}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors active:bg-bg"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-light font-en text-xs font-extrabold text-green-dark">
                      {r.name.trim().charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="min-w-0 flex-1 truncate font-en text-[12.5px] font-bold text-text">{r.name}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.status === "not_submitted" ? (
                        <span className="rounded-full bg-[#f0f1f3] px-2.5 py-1 font-en text-[10.5px] font-bold text-muted">
                          Not submitted
                        </span>
                      ) : (
                        <StatusPill status={r.status} />
                      )}
                      <span className="font-en text-[11px] font-semibold text-muted">{r.itemCount} KPI</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
    </div>
  );

  return (
    <div>
      <div className="mb-1 mt-0.5 font-en text-xl font-bold text-text">KPI</div>
      <div className="mb-4 text-sm font-medium text-muted">Onboarding অগ্রগতির পরিমাপ</div>

      <KpiSectionTabs onboarding={onboardingContent} employee={employee ? employeeContent : <></>} />
    </div>
  );
}

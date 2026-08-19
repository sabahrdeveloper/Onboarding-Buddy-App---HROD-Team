import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasksForVariant, getOnboardingVariants, getIsSuperAdmin, getEmployeeVariant } from "@/lib/data/queries";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";
import { Icon } from "@/components/icons/Icon";
import { ManagerFeedbackForm } from "@/components/team/ManagerFeedbackForm";
import { BuddyAssignForm } from "@/components/team/BuddyAssignForm";
import { assignBuddy } from "@/actions/manager";
import { SubordinateDetailPanel, type HelpRequestRow } from "@/components/team/SubordinateDetailPanel";
import type { TaskStatusRow } from "@/components/kpi/TaskStatusList";
import { ManagerReviewPanel, type CommentRow, type ReviewSubmission } from "@/components/employee-kpi/ManagerReviewPanel";
import { currentPeriodMonth } from "@/lib/employee-kpi";
import { progressPercent } from "@/lib/business-rules";
import type { PhaseKey } from "@/lib/types";

const ASSESSMENT_LABELS: Record<string, string> = {
  "30": "30 Days Assessment",
  "60": "60 Days Assessment",
  "90": "90 Days Assessment",
  "180": "180 Days Growth Review",
};

const ASSESSMENT_LABELS_BN: Record<string, string> = {
  "30": "৩০ দিনের অ্যাসেসমেন্ট",
  "60": "৬০ দিনের অ্যাসেসমেন্ট",
  "90": "৯০ দিনের অ্যাসেসমেন্ট",
  "180": "১৮০ দিনের গ্রোথ রিভিউ",
};

export default async function SubordinateDetailPage({ params }: { params: Promise<{ enrollNumber: string }> }) {
  const { enrollNumber } = await params;
  const supabase = await createClient();

  // Employee KPI (manual, monthly, approval-based) — this month's submission
  // for the subordinate, if any, plus its review comment history.
  const period = currentPeriodMonth();

  // Fetched up front (not inside the batch below) because scoping the
  // subordinate's task list to the right variant needs their sbu first —
  // using the viewing manager's own variant here would be wrong whenever a
  // manager's direct report belongs to a different onboarding variant.
  const { data: subordinate } = await supabase.from("employees").select("*").eq("enroll_number", enrollNumber).single();
  // RLS (is_manager_of) already blocks this for anyone who isn't the actual
  // reporting manager — a null row here means either a bad enroll number or
  // an unauthorized access attempt, both of which should 404 the same way.
  if (!subordinate) notFound();

  const { data: variants } = await getOnboardingVariants();
  const variant = resolveVariantForSbu(subordinate.sbu, (variants ?? []).map(mapOnboardingVariant));
  // Language follows the *viewing manager's* own effective variant, not the
  // subordinate's — Bangla chrome is a Sales-track thing for the person
  // looking at the screen, independent of which variant the subordinate
  // themselves belongs to.
  const viewerVariant = await getEmployeeVariant();
  const isBn = viewerVariant.navMode === "resources";

  const [
    { data: tasks },
    { data: statuses },
    { data: templates },
    { data: assessments },
    { data: helpRequestRows },
    isSuperAdmin,
    { data: kpiSubmissionRow },
  ] = await Promise.all([
    getTasksForVariant(variant.id),
    supabase.from("employee_task_status").select("task_id, done").eq("employee_enroll_number", enrollNumber),
    supabase.from("assessment_templates").select("*"),
    supabase.from("employee_assessments").select("*").eq("employee_enroll_number", enrollNumber),
    supabase
      .from("help_requests")
      .select("id, ticket_id, related_task_id, issue_type, description, status, created_at")
      .eq("employee_enroll_number", enrollNumber)
      .order("created_at", { ascending: false }),
    getIsSuperAdmin(),
    // Doesn't depend on anything else fetched here — folded into the same
    // batch instead of running as a separate round trip afterward.
    supabase
      .from("kpi_submissions")
      .select("id, period_month, status, employee_note, manager_comment, submitted_at, reviewed_at")
      .eq("employee_enroll_number", enrollNumber)
      .eq("period_month", period)
      .maybeSingle(),
  ]);

  let kpiSubmission: ReviewSubmission | null = null;
  let kpiComments: CommentRow[] = [];
  if (kpiSubmissionRow) {
    const [{ data: kpiItemRows }, { data: kpiCommentRows }] = await Promise.all([
      supabase
        .from("kpi_items")
        .select("id, name, target, unit, achievement, added_by_manager")
        .eq("submission_id", kpiSubmissionRow.id)
        .order("created_at"),
      supabase
        .from("kpi_comments")
        .select("id, author_role, comment, created_at")
        .eq("submission_id", kpiSubmissionRow.id)
        .order("created_at", { ascending: false }),
    ]);
    kpiSubmission = {
      id: kpiSubmissionRow.id,
      period: kpiSubmissionRow.period_month,
      status: kpiSubmissionRow.status as ReviewSubmission["status"],
      employeeNote: kpiSubmissionRow.employee_note,
      managerComment: kpiSubmissionRow.manager_comment,
      submittedAt: kpiSubmissionRow.submitted_at,
      reviewedAt: kpiSubmissionRow.reviewed_at,
      items: (kpiItemRows ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        target: i.target,
        unit: i.unit,
        achievement: i.achievement,
        addedByManager: i.added_by_manager,
      })),
    };
    kpiComments = (kpiCommentRows ?? []).map((c) => ({
      id: c.id,
      authorRole: c.author_role as CommentRow["authorRole"],
      comment: c.comment,
      createdAt: c.created_at,
    }));
  }

  const phaseById = new Map((tasks ?? []).map((t) => [t.id, t.phase as PhaseKey]));
  const doneTaskIds = new Set((statuses ?? []).filter((s) => s.done).map((s) => s.task_id));
  const doneByPhase: Record<PhaseKey, { done: number; total: number }> = {
    "30": { done: 0, total: 0 },
    "60": { done: 0, total: 0 },
    "90": { done: 0, total: 0 },
  };
  let completed = 0;
  for (const t of tasks ?? []) {
    const phase = phaseById.get(t.id);
    if (!phase) continue;
    doneByPhase[phase].total++;
    if (doneTaskIds.has(t.id)) {
      doneByPhase[phase].done++;
      completed++;
    }
  }
  const total = tasks?.length ?? 50;
  const pct = progressPercent(completed);

  const assessmentByKey = new Map((assessments ?? []).map((a) => [a.assessment_key, a]));

  const taskById = new Map((tasks ?? []).map((t) => [t.id, t]));
  const taskStatusRows: TaskStatusRow[] = (tasks ?? []).map((t) => ({
    id: t.id,
    workNumber: t.work_number,
    phase: t.phase as PhaseKey,
    title: t.title,
    done: doneTaskIds.has(t.id),
  }));
  const helpRequests: HelpRequestRow[] = (helpRequestRows ?? []).map((h) => ({
    id: h.id,
    ticketId: h.ticket_id,
    relatedTaskId: h.related_task_id,
    taskTitle: h.related_task_id ? (taskById.get(h.related_task_id)?.title ?? null) : null,
    issueType: h.issue_type,
    description: h.description,
    status: h.status,
    createdAt: h.created_at,
  }));

  return (
    <div>
      <div className="mb-4 mt-0.5 flex items-center gap-3">
        <Link
          href="/team"
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
        >
          <Icon name="chevronLeft" size={18} />
        </Link>
        <div className="min-w-0">
          <div className="truncate font-en text-lg font-extrabold text-text">{subordinate.name}</div>
          <div className="truncate text-xs font-medium text-muted">
            {[subordinate.designation, subordinate.department].filter(Boolean).join(" · ") || subordinate.enroll_number}
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-card border border-line bg-card p-4 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="font-en text-[15px] font-semibold text-text">
            {isBn ? "অনবোর্ডিং অগ্রগতি" : "Onboarding Progress"}
          </span>
          <span className="font-en text-xl font-extrabold text-green-dark">{pct}%</span>
        </div>
        <div className="my-3 h-2.5 overflow-hidden rounded-lg bg-[#edeff2]">
          <div className="h-full rounded-lg bg-green transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(["30", "60", "90"] as PhaseKey[]).map((phase) => (
            <div key={phase} className="rounded-xl bg-bg px-2 py-2.5">
              <div className="font-en text-sm font-extrabold text-text">
                {doneByPhase[phase].done}/{doneByPhase[phase].total}
              </div>
              <div className="mt-0.5 text-[10.5px] font-semibold text-muted">
                {isBn ? `${phase} দিন` : `${phase} Days`}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[12.5px] font-medium text-muted">
          {isBn ? `মোট: ${completed}/${total} কাজ সম্পন্ন` : `Total: ${completed}/${total} works completed`}
        </div>
      </div>

      <SubordinateDetailPanel
        tasks={taskStatusRows}
        helpRequests={helpRequests}
        isSuperAdmin={isSuperAdmin}
        employeeEnrollNumber={enrollNumber}
      />

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">{isBn ? "কর্মী KPI" : "Employee KPI"}</div>
      <ManagerReviewPanel
        submission={kpiSubmission}
        employeeEnrollNumber={enrollNumber}
        comments={kpiComments}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">
        {isBn ? "বাডি নির্ধারণ" : "Buddy Assignment"}
      </div>
      <div className="mb-4 rounded-card border border-line bg-card p-4 shadow-card">
        {subordinate.buddy && (
          <div className="mb-3 rounded-xl bg-green-light px-3.5 py-2.5 text-[12.5px] font-semibold text-green-dark">
            {isBn ? `বর্তমানে নির্ধারিত: ${subordinate.buddy}` : `Currently assigned: ${subordinate.buddy}`}
          </div>
        )}
        <BuddyAssignForm
          enrollNumber={subordinate.enroll_number}
          initialBuddy={subordinate.buddy ?? ""}
          initialPhone={subordinate.buddy_phone ?? ""}
          initialEmail={subordinate.buddy_email ?? ""}
          action={assignBuddy}
        />
      </div>

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">
        {isBn ? "অ্যাসেসমেন্ট ফলাফল" : "Assessment Results"}
      </div>
      <div className="flex flex-col gap-2.5">
        {(templates ?? []).map((template) => {
          const assessment = assessmentByKey.get(template.assessment_key);
          const label =
            (isBn ? ASSESSMENT_LABELS_BN : ASSESSMENT_LABELS)[template.assessment_key] ?? template.title;
          return (
            <div key={template.assessment_key} className="rounded-card border border-line bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-en text-sm font-bold text-text">{label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 font-en text-[10.5px] font-bold ${
                    assessment?.submitted_at ? "bg-ok-bg text-ok-tx" : "bg-[#f0f1f3] text-muted"
                  }`}
                >
                  {assessment?.submitted_at ? (isBn ? "জমা হয়েছে" : "Submitted") : isBn ? "জমা হয়নি" : "Not submitted"}
                </span>
              </div>

              {assessment?.submitted_at && (
                <>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {template.items.map((item) => {
                      const rating = (assessment.ratings as Record<string, number> | null)?.[item];
                      return (
                        <span
                          key={item}
                          className="rounded-lg border border-line bg-bg px-2 py-1 text-[11px] font-medium text-text"
                        >
                          {item}: <b className="font-en font-bold text-green-dark">{rating ?? "—"}</b>
                        </span>
                      );
                    })}
                  </div>
                  {assessment.employee_comment && (
                    <div className="mt-2.5 rounded-xl bg-bg px-3.5 py-2.5 text-[12.5px] font-medium leading-snug text-text">
                      <span className="mb-1 block font-en text-[10.5px] font-bold uppercase tracking-[0.03em] text-muted">
                        {isBn ? "কর্মীর মন্তব্য" : "Employee Comment"}
                      </span>
                      {assessment.employee_comment}
                    </div>
                  )}
                  <ManagerFeedbackForm
                    enrollNumber={subordinate.enroll_number}
                    assessmentKey={template.assessment_key}
                    initialFeedback={assessment.manager_feedback ?? ""}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getIsSuperAdmin } from "@/lib/data/queries";
import { ManagerReviewWizard, type WizardSubmission } from "@/components/employee-kpi/ManagerReviewWizard";
import { currentPeriodMonth } from "@/lib/employee-kpi";

export default async function ManagerKpiReviewPage({ params }: { params: Promise<{ enrollNumber: string }> }) {
  const { enrollNumber } = await params;
  const supabase = await createClient();

  // The employees RLS self-clause means this row is still readable when
  // enrollNumber is the viewer's own — explicitly reject that case rather
  // than relying on RLS alone to keep an employee off their own review page
  // (the write-side of this is separately enforced in actions/employee-kpi.ts).
  const { data: viewer } = await getEmployee();
  if (viewer?.enroll_number === enrollNumber) notFound();

  // RLS (is_manager_of) already blocks this for anyone who isn't the actual
  // reporting manager — a null row means bad enroll number or unauthorized
  // access, both 404 the same way (mirrors /team/[enrollNumber]).
  const { data: subordinate } = await supabase.from("employees").select("name").eq("enroll_number", enrollNumber).single();
  if (!subordinate) notFound();

  const { data: submissionRow } = await supabase
    .from("kpi_submissions")
    .select("id, status, employee_note")
    .eq("employee_enroll_number", enrollNumber)
    .eq("period_month", currentPeriodMonth())
    .maybeSingle();

  // This wizard only makes sense for a pending submission — anything else
  // (none / approved / rejected) belongs on the subordinate detail page.
  if (!submissionRow || submissionRow.status !== "pending") redirect(`/team/${enrollNumber}`);

  const { data: items } = await supabase
    .from("kpi_items")
    .select("id, name, target, unit, achievement, added_by_manager")
    .eq("submission_id", submissionRow.id)
    .order("created_at");

  const submission: WizardSubmission = {
    id: submissionRow.id,
    employeeNote: submissionRow.employee_note,
    items: (items ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      target: i.target,
      unit: i.unit,
      achievement: i.achievement,
      addedByManager: i.added_by_manager,
    })),
  };

  const isSuperAdmin = await getIsSuperAdmin();

  return (
    <ManagerReviewWizard
      submission={submission}
      employeeEnrollNumber={enrollNumber}
      employeeName={subordinate.name}
      isSuperAdmin={isSuperAdmin}
    />
  );
}

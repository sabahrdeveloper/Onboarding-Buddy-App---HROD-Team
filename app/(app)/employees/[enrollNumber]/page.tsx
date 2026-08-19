import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminVariantId, getOnboardingVariants, getTasksForVariant } from "@/lib/data/queries";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";
import { Icon } from "@/components/icons/Icon";
import { BuddyAssignForm } from "@/components/team/BuddyAssignForm";
import { assignBuddyAsHrAdmin } from "@/actions/admin-employees";
import { progressPercent } from "@/lib/business-rules";
import type { PhaseKey } from "@/lib/types";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ enrollNumber: string }> }) {
  const { enrollNumber } = await params;
  const adminVariantId = await getAdminVariantId();
  if (!adminVariantId) redirect("/home");

  const supabase = await createClient();
  const [{ data: employee }, { data: variantsData }] = await Promise.all([
    supabase.from("employees").select("*").eq("enroll_number", enrollNumber).single(),
    getOnboardingVariants(),
  ]);
  if (!employee) notFound();

  // Defense against a variant-scoped HR admin guessing another variant's
  // enroll number by URL — RLS alone would let this read through (is_hr_admin
  // grants company-wide SELECT), so this app-layer check is what actually
  // keeps variants apart here.
  const variants = (variantsData ?? []).map(mapOnboardingVariant);
  const employeeVariant = resolveVariantForSbu(employee.sbu, variants);
  if (employeeVariant.id !== adminVariantId) notFound();
  const isBn = employeeVariant.navMode === "resources";

  const [{ data: tasks }, { data: statuses }, { data: tickets }] = await Promise.all([
    getTasksForVariant(adminVariantId),
    supabase.from("employee_task_status").select("task_id, done").eq("employee_enroll_number", enrollNumber),
    supabase
      .from("help_requests")
      .select("ticket_id, issue_type, status, created_at")
      .eq("employee_enroll_number", enrollNumber)
      .order("created_at", { ascending: false }),
  ]);

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
  const total = tasks?.length ?? 0;
  const pct = progressPercent(completed);

  return (
    <div>
      <div className="mb-4 mt-0.5 flex items-center gap-3">
        <Link
          href="/employees"
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
        >
          <Icon name="chevronLeft" size={18} />
        </Link>
        <div className="min-w-0">
          <div className="truncate font-en text-lg font-extrabold text-text">{employee.name}</div>
          <div className="truncate text-xs font-medium text-muted">
            {[employee.designation, employee.department].filter(Boolean).join(" · ") || employee.enroll_number}
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

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">
        {isBn ? "বাডি নির্ধারণ" : "Buddy Assignment"}
      </div>
      <div className="mb-4 rounded-card border border-line bg-card p-4 shadow-card">
        {employee.buddy && (
          <div className="mb-3 rounded-xl bg-green-light px-3.5 py-2.5 text-[12.5px] font-semibold text-green-dark">
            {isBn ? `বর্তমানে নির্ধারিত: ${employee.buddy}` : `Currently assigned: ${employee.buddy}`}
          </div>
        )}
        <BuddyAssignForm
          enrollNumber={employee.enroll_number}
          initialBuddy={employee.buddy ?? ""}
          initialPhone={employee.buddy_phone ?? ""}
          initialEmail={employee.buddy_email ?? ""}
          action={assignBuddyAsHrAdmin}
        />
      </div>

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">
        {isBn ? "জমা দেওয়া টিকেট" : "Submitted Tickets"}
      </div>
      <div className="flex flex-col gap-2">
        {(tickets ?? []).map((t) => (
          <div key={t.ticket_id} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="font-en text-[12.5px] font-bold text-text">{t.ticket_id}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-en text-[10.5px] font-bold ${
                  t.status === "open" ? "bg-warn-bg text-warn-tx" : "bg-ok-bg text-ok-tx"
                }`}
              >
                {t.status}
              </span>
            </div>
            <div className="mt-1 text-[12.5px] font-medium text-muted">
              {t.issue_type} · {new Date(t.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        {(tickets ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            {isBn ? "কোনো টিকেট জমা দেওয়া হয়নি।" : "No tickets submitted."}
          </div>
        )}
      </div>
    </div>
  );
}

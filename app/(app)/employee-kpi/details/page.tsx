import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getUnreadKpiNotificationCount } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { NotificationBell } from "@/components/employee-kpi/NotificationBell";
import { currentPeriodMonth, formatMonthDate, periodLabel } from "@/lib/employee-kpi";

export default async function SubmissionDetailsPage() {
  const { data: employee } = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const period = currentPeriodMonth();
  const { data: submission } = await supabase
    .from("kpi_submissions")
    .select("id, status, employee_note, submitted_at")
    .eq("employee_enroll_number", employee.enroll_number)
    .eq("period_month", period)
    .maybeSingle();

  if (!submission) redirect("/kpi");

  const { data: items } = await supabase
    .from("kpi_items")
    .select("id, name, target, unit, added_by_manager")
    .eq("submission_id", submission.id)
    .order("created_at");

  const unreadCount = await getUnreadKpiNotificationCount();

  return (
    <div>
      <div className="mb-4 mt-0.5 flex items-center gap-3">
        <Link
          href="/kpi?tab=employee"
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
        >
          <Icon name="chevronLeft" size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-en text-lg font-extrabold text-text">Submission Details</div>
          <div className="text-xs font-medium text-muted">{periodLabel(period)}</div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      <div className="mb-4 rounded-card border border-line bg-card p-4 shadow-card">
        <div className="text-[12px] font-medium text-muted">Submitted on</div>
        <div className="font-en text-sm font-bold text-text">{formatMonthDate(submission.submitted_at)}</div>
      </div>

      <div className="mb-3 font-en text-[13px] font-bold text-text">Submitted KPI</div>
      <div className="mb-4 flex flex-col gap-2">
        {(items ?? []).map((item, i) => (
          <div key={item.id} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="font-en text-[13px] font-bold text-text">
              {i + 1}. {item.name}
              {item.added_by_manager && (
                <span className="ml-1.5 rounded-md bg-blue-light px-1.5 py-0.5 font-en text-[9px] font-bold text-blue-dark">
                  Added by Manager
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11.5px] font-medium text-muted">
              Target: {item.target} {item.unit ?? ""}
            </div>
          </div>
        ))}
      </div>

      {submission.employee_note && (
        <>
          <div className="mb-1.5 font-en text-[12px] font-bold text-text">Manager Note</div>
          <div className="rounded-card border border-line bg-card p-3.5 text-[12.5px] font-medium leading-snug text-text shadow-card">
            {submission.employee_note}
          </div>
        </>
      )}
    </div>
  );
}

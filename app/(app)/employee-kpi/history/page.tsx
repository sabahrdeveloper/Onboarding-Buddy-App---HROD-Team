import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getUnreadKpiNotificationCount } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { StatusPill } from "@/components/employee-kpi/StatusPill";
import { NotificationBell } from "@/components/employee-kpi/NotificationBell";
import { overallPct, periodLabel, type SubmissionStatus } from "@/lib/employee-kpi";

export default async function KpiHistoryPage() {
  const { data: employee } = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("kpi_submissions")
    .select("id, period_month, status, kpi_items(target, achievement)")
    .eq("employee_enroll_number", employee.enroll_number)
    .order("period_month", { ascending: false });

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
        <div className="min-w-0 flex-1 font-en text-lg font-extrabold text-text">KPI History</div>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center text-[12.5px] font-medium text-muted shadow-card">
          এখনো কোনো KPI submission নেই।
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-card border border-line bg-card p-3.5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="font-en text-[13px] font-bold text-text">{periodLabel(s.period_month)}</span>
                <StatusPill status={s.status as SubmissionStatus} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-en text-sm font-extrabold text-text">
                  {s.status === "approved" ? `${overallPct(s.kpi_items)}%` : "--"}
                </span>
                <Icon name="chevronRight" size={16} className="text-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

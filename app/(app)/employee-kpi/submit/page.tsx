import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getUnreadKpiNotificationCount } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { SubmitKpiForm } from "@/components/employee-kpi/SubmitKpiForm";
import { NotificationBell } from "@/components/employee-kpi/NotificationBell";
import { currentPeriodMonth, periodLabel } from "@/lib/employee-kpi";

export default async function SubmitKpiPage() {
  const { data: employee } = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const period = currentPeriodMonth();
  const { data: submission } = await supabase
    .from("kpi_submissions")
    .select("id, status, employee_note")
    .eq("employee_enroll_number", employee.enroll_number)
    .eq("period_month", period)
    .maybeSingle();

  const alreadyApproved = submission?.status === "approved";

  const { data: items } = submission && !alreadyApproved
    ? await supabase
        .from("kpi_items")
        .select("name, target, unit, frequency")
        .eq("submission_id", submission.id)
        .eq("added_by_manager", false)
    : { data: [] };

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
          <div className="font-en text-lg font-extrabold text-text">Submit KPI</div>
          <div className="text-xs font-medium text-muted">{periodLabel(period)}</div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      {alreadyApproved ? (
        <div className="rounded-card border border-line bg-card p-5 text-center text-[12.5px] font-medium text-muted shadow-card">
          এই মাসের KPI ইতিমধ্যে approved। পরবর্তী মাস শুরু হলে নতুন KPI submit করতে পারবেন।
        </div>
      ) : (
        <SubmitKpiForm
          initialItems={(items ?? []).map((i) => ({
            name: i.name,
            target: i.target,
            unit: i.unit ?? "",
            frequency: (i.frequency as "daily" | "weekly" | "monthly") ?? "monthly",
          }))}
          initialNote={submission?.employee_note ?? ""}
        />
      )}
    </div>
  );
}

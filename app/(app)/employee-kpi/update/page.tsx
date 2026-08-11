import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getUnreadKpiNotificationCount } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { UpdateAchievementList } from "@/components/employee-kpi/UpdateAchievementList";
import { NotificationBell } from "@/components/employee-kpi/NotificationBell";
import { currentPeriodMonth, periodLabel } from "@/lib/employee-kpi";

export default async function UpdateAchievementPage() {
  const { data: employee } = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const period = currentPeriodMonth();
  const { data: submission } = await supabase
    .from("kpi_submissions")
    .select("id, status")
    .eq("employee_enroll_number", employee.enroll_number)
    .eq("period_month", period)
    .maybeSingle();

  const items =
    submission?.status === "approved"
      ? (
          await supabase
            .from("kpi_items")
            .select("id, name, target, unit, achievement")
            .eq("submission_id", submission.id)
            .order("created_at")
        ).data
      : [];

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
          <div className="font-en text-lg font-extrabold text-text">Update Achievement</div>
          <div className="text-xs font-medium text-muted">{periodLabel(period)}</div>
        </div>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      {!items || items.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center text-[12.5px] font-medium text-muted shadow-card">
          এই মাসের approved KPI নেই — achievement update করার আগে আপনার KPI approve হতে হবে।
        </div>
      ) : (
        <UpdateAchievementList items={items} />
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getSubordinates } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { NotificationsList, type NotificationRow } from "@/components/employee-kpi/NotificationsList";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/employee-kpi";
import { currentPeriodMonth, periodLabel } from "@/lib/employee-kpi";

export default async function KpiNotificationsPage() {
  const { data: employee } = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const [{ data: notifications }, isManagerRes] = await Promise.all([
    supabase
      .from("kpi_notifications")
      .select("id, type, title, body, is_read, created_at")
      .eq("recipient_enroll_number", employee.enroll_number)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("is_manager"),
  ]);

  const rows: NotificationRow[] = (notifications ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));

  // "N employees haven't submitted" is computed live rather than stored —
  // this app has no scheduled-job infrastructure to fire it as a real event,
  // so it's derived here each time a manager opens their notifications
  // instead (always shown, not persisted/counted as unread).
  if (isManagerRes.data) {
    const { data: subordinates } = await getSubordinates();
    const enrolls = (subordinates ?? []).map((s) => s.enroll_number);
    if (enrolls.length > 0) {
      const period = currentPeriodMonth();
      const { data: submitted } = await supabase
        .from("kpi_submissions")
        .select("employee_enroll_number")
        .in("employee_enroll_number", enrolls)
        .eq("period_month", period);
      const submittedSet = new Set((submitted ?? []).map((s) => s.employee_enroll_number));
      const notSubmittedCount = enrolls.filter((e) => !submittedSet.has(e)).length;
      if (notSubmittedCount > 0) {
        rows.unshift({
          id: "rollup-not-submitted",
          type: "not_submitted_reminder",
          title: "Reminder",
          body: `${notSubmittedCount} employees have not submitted KPI for ${periodLabel(period)}.`,
          isRead: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

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
        <div className="font-en text-lg font-extrabold text-text">Notifications</div>
      </div>

      <NotificationsList notifications={rows} markOneAction={markNotificationRead} markAllAction={markAllNotificationsRead} />
    </div>
  );
}

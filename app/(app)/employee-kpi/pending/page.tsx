import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSubordinates, getUnreadKpiNotificationCount } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { PendingRequestsList, type PendingRequestRow } from "@/components/employee-kpi/PendingRequestsList";
import { NotificationBell } from "@/components/employee-kpi/NotificationBell";
import { currentPeriodMonth } from "@/lib/employee-kpi";

export default async function PendingKpiRequestsPage() {
  const supabase = await createClient();
  const { data: subordinates } = await getSubordinates();
  const nameByEnroll = new Map((subordinates ?? []).map((s) => [s.enroll_number, s.name]));
  const enrolls = (subordinates ?? []).map((s) => s.enroll_number);

  let requests: PendingRequestRow[] = [];
  if (enrolls.length > 0) {
    const { data } = await supabase
      .from("kpi_submissions")
      .select("employee_enroll_number, submitted_at, kpi_items(name)")
      .in("employee_enroll_number", enrolls)
      .eq("period_month", currentPeriodMonth())
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    requests = (data ?? []).map((r) => ({
      enrollNumber: r.employee_enroll_number,
      name: nameByEnroll.get(r.employee_enroll_number) ?? r.employee_enroll_number,
      submittedAt: r.submitted_at,
      itemCount: r.kpi_items.length,
    }));
  }

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
        <div className="min-w-0 flex-1 font-en text-lg font-extrabold text-text">Pending Requests</div>
        <NotificationBell unreadCount={unreadCount} />
      </div>

      <PendingRequestsList requests={requests} />
    </div>
  );
}

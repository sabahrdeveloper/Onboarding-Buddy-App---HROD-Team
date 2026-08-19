import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/data/queries";
import { BackButton } from "@/components/ui/BackButton";
import { NotificationsList, type NotificationRow } from "@/components/employee-kpi/NotificationsList";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";

export default async function NotificationsPage() {
  const { data: employee } = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, created_at")
    .eq("recipient_enroll_number", employee.enroll_number)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: NotificationRow[] = (notifications ?? []).map((n) => ({
    id: n.id,
    type: "notification",
    title: n.title,
    body: n.body,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));

  return (
    <div>
      <div className="mb-4 mt-0.5 flex items-center gap-3">
        <BackButton fallbackHref="/home" />
        <div className="font-en text-lg font-extrabold text-text">Notifications</div>
      </div>

      <NotificationsList notifications={rows} markOneAction={markNotificationRead} markAllAction={markAllNotificationsRead} />
    </div>
  );
}

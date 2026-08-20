"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/data/queries";

/** Called directly from the client (not through the server-rendered layout)
 * so the bell's badge is never stuck behind the Router Cache's staleTimes
 * window — a notification sent while the recipient is already navigating
 * around the app wouldn't show up for up to 30s otherwise. */
export async function getMyUnreadCount(): Promise<number> {
  const { data: employee } = await getEmployee();
  if (!employee) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_enroll_number", employee.enroll_number)
    .eq("is_read", false);
  return count ?? 0;
}

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  if (error) return { error: "Update করা যায়নি।" };
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { data: employee } = await getEmployee();
  if (!employee) return { error: "লগইন করা নেই।" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_enroll_number", employee.enroll_number)
    .eq("is_read", false);
  if (error) return { error: "Update করা যায়নি।" };
  revalidatePath("/notifications");
  return { success: true };
}

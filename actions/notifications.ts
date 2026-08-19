"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/data/queries";

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

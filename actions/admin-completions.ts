"use server";

import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markCompletionRead(notificationId: string) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("hr_journey_completion_notifications")
    .select("variant_id")
    .eq("id", notificationId)
    .single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("hr_journey_completion_notifications").update({ is_read: true }).eq("id", notificationId);
  if (error) return { error: error.message };

  revalidatePath("/admin/completions");
  return { success: true };
}

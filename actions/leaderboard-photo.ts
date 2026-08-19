"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployee, getEmployeeVariant } from "@/lib/data/queries";
import { getLeaderboard } from "@/lib/leaderboard";

interface UploadResult {
  error?: string;
  success?: boolean;
}

export async function uploadLeaderboardPhoto(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "লগইন করা নেই।" };

  const { data: employee } = await getEmployee();
  if (!employee) return { error: "প্রোফাইল পাওয়া যায়নি।" };

  const variant = await getEmployeeVariant();
  if (variant.isDefault) return { error: "Not available." };

  // Only a current top-3 employee may upload — re-checked server-side since
  // rank shifts and the notification link is otherwise just a URL.
  const entries = await getLeaderboard(variant.id);
  const myEntry = entries.find((e) => e.enrollNumber === employee.enroll_number);
  if (!myEntry || myEntry.rank > 3) return { error: "আপনি বর্তমানে টপ ৩-এ নেই।" };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "একটি ছবি নির্বাচন করুন।" };
  if (!["image/jpeg", "image/png"].includes(file.type)) return { error: "শুধুমাত্র JPG বা PNG ছবি গ্রহণযোগ্য।" };

  const admin = createAdminClient();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${variant.id}/${employee.enroll_number}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("leaderboard-photos")
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await admin
    .from("leaderboard_photos")
    .upsert({ employee_enroll_number: employee.enroll_number, variant_id: variant.id, storage_path: path, updated_at: new Date().toISOString() });
  if (dbError) return { error: dbError.message };

  // The upload-invite notification has served its purpose — mark it read.
  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_enroll_number", employee.enroll_number)
    .eq("action_url", "/leaderboard/upload-photo");

  revalidatePath("/leaderboard");
  return { success: true };
}

"use server";

import { deriveSyntheticEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth/credentials";
import { getPeopleDeskEmployee, normalizeName } from "@/lib/peopledesk";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ResetPasswordState {
  error?: string;
  success?: boolean;
}

export async function resetPasswordWithManagerEnroll(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const enrollNumberRaw = String(formData.get("enrollNumber") ?? "").trim();
  const managerEnrollRaw = String(formData.get("managerEnrollNumber") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!enrollNumberRaw || !managerEnrollRaw || !newPassword || !confirmPassword) {
    return { error: "সব ঘর পূরণ করুন।" };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে।` };
  }
  if (newPassword !== confirmPassword) {
    return { error: "নতুন পাসওয়ার্ড দুটি মিলছে না।" };
  }

  let employee, managerRecord;
  try {
    [employee, managerRecord] = await Promise.all([
      getPeopleDeskEmployee(enrollNumberRaw),
      getPeopleDeskEmployee(managerEnrollRaw),
    ]);
  } catch {
    return { error: "PeopleDesk থেকে তথ্য আনা যায়নি। একটু পর আবার চেষ্টা করুন।" };
  }

  if (!employee) {
    return { error: "এই এনরোল নম্বর PeopleDesk-এ নিবন্ধিত নেই।" };
  }
  if (!employee.reportingManager) {
    return { error: "আপনার Reporting Manager PeopleDesk-এ পাওয়া যায়নি। HR-এর সাথে যোগাযোগ করুন।" };
  }
  if (!managerRecord || normalizeName(managerRecord.name) !== normalizeName(employee.reportingManager)) {
    return { error: "ম্যানেজার এনরোল নম্বর মিলছে না।" };
  }

  const { enrollNumber } = deriveSyntheticEmail(enrollNumberRaw);
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "পাসওয়ার্ড রিসেট এখনো চালু করা হয়নি। HR/IT-এর সাথে যোগাযোগ করুন।" };
  }

  const { data: profile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("enroll_number", enrollNumber)
    .maybeSingle();

  if (profileLookupError || !profile) {
    return { error: "এই এনরোল নম্বরের কোনো অ্যাকাউন্ট নেই। আগে লগইন করে পাসওয়ার্ড সেট করুন।" };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, { password: newPassword });
  if (updateError) {
    return { error: "পাসওয়ার্ড পরিবর্তন করা যায়নি। একটু পর আবার চেষ্টা করুন।" };
  }

  return { success: true };
}

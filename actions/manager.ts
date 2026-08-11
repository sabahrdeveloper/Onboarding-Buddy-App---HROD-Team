"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitManagerFeedback(input: {
  enrollNumber: string;
  assessmentKey: string;
  feedback: string;
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("manager_set_feedback", {
    p_enroll: input.enrollNumber,
    p_assessment_key: input.assessmentKey,
    p_feedback: input.feedback,
  });
  if (error) return { error: "সংরক্ষণ করা যায়নি। একটু পর আবার চেষ্টা করুন।" };

  revalidatePath(`/team/${input.enrollNumber}`);
  return { success: true };
}

export async function assignBuddy(input: {
  enrollNumber: string;
  buddy: string;
  buddyPhone: string;
  buddyEmail: string;
}): Promise<{ error?: string; success?: boolean }> {
  if (!input.buddy.trim()) return { error: "Buddy-এর নাম দিন।" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("manager_set_buddy", {
    p_enroll: input.enrollNumber,
    p_buddy: input.buddy.trim(),
    p_buddy_phone: input.buddyPhone.trim() || null,
    p_buddy_email: input.buddyEmail.trim() || null,
  });
  if (error) return { error: "Buddy assign করা যায়নি। একটু পর আবার চেষ্টা করুন।" };

  revalidatePath(`/team/${input.enrollNumber}`);
  revalidatePath("/team");
  return { success: true };
}

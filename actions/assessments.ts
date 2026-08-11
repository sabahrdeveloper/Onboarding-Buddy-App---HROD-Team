"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canSubmitAssessment } from "@/lib/business-rules";
import type { AssessmentKey } from "@/lib/types";

interface SubmitAssessmentInput {
  assessmentKey: AssessmentKey;
  ratings: Record<string, number>;
  comment: string;
}

interface SubmitAssessmentResult {
  error?: string;
  success?: boolean;
}

export async function submitAssessment(input: SubmitAssessmentInput): Promise<SubmitAssessmentResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "লগইন করা নেই।" };

  // Independent of each other — both only need input already in hand.
  const [{ data: profile }, { data: template }] = await Promise.all([
    supabase.from("profiles").select("enroll_number").eq("id", user.id).single(),
    supabase.from("assessment_templates").select("items").eq("assessment_key", input.assessmentKey).single(),
  ]);
  if (!profile) return { error: "প্রোফাইল পাওয়া যায়নি।" };
  if (!template) return { error: "Assessment টেমপ্লেট পাওয়া যায়নি।" };

  // BRU-07 (revised): every item rated, checked server-side too
  if (!canSubmitAssessment(input.ratings, template.items)) {
    return { error: "সব বিষয়ে rating দিন।" };
  }

  const { error } = await supabase.from("employee_assessments").upsert(
    {
      employee_enroll_number: profile.enroll_number,
      assessment_key: input.assessmentKey,
      ratings: input.ratings,
      employee_comment: input.comment || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "employee_enroll_number,assessment_key" },
  );

  if (error) return { error: "জমা দেওয়া যায়নি। একটু পর আবার চেষ্টা করুন।" };

  revalidatePath("/home");
  revalidatePath("/journey");

  return { success: true };
}

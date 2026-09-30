"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployee, getEmployeeVariant } from "@/lib/data/queries";
import { syncLeaderboardAfterSubmission } from "@/lib/leaderboard";

interface SubmitResult {
  error?: string;
  success?: boolean;
  score?: number;
}

// One-time only — no retake, ever (enforced by the unique constraint on
// (employee_enroll_number, assessment_id) and re-checked here first so we
// can return a clean error instead of a raw constraint violation).
export async function submitJourneyAssessment(
  journeyId: string,
  answers: Record<string, string>,
): Promise<SubmitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "লগইন করা নেই।" };

  const { data: employee } = await getEmployee();
  if (!employee) return { error: "প্রোফাইল পাওয়া যায়নি।" };

  const variant = await getEmployeeVariant();
  const admin = createAdminClient();

  const { data: assessment } = await admin.from("journey_assessments").select("*").eq("journey_id", journeyId).single();
  if (!assessment) return { error: "কোনো অ্যাসেসমেন্ট পাওয়া যায়নি।" };

  const { data: existing } = await admin
    .from("journey_assessment_submissions")
    .select("id")
    .eq("employee_enroll_number", employee.enroll_number)
    .eq("assessment_id", assessment.id)
    .maybeSingle();
  if (existing) return { error: "আপনি ইতিমধ্যে এই অ্যাসেসমেন্ট জমা দিয়েছেন।" };

  const { data: questions } = await admin
    .from("journey_assessment_questions")
    .select("*")
    .eq("assessment_id", assessment.id);
  if (!questions || questions.length === 0) return { error: "এখনো কোনো প্রশ্ন যোগ করা হয়নি।" };

  let score = 0;
  const answerRows = questions.map((q) => {
    const submitted = (answers[q.id] ?? "").trim();
    let marksAwarded = 0;
    if (q.type === "mcq") {
      if (submitted && submitted === q.correct_option_key) marksAwarded = q.marks;
    } else {
      // Open-answer: any non-empty answer earns full marks (per spec — no
      // grading logic for free-text answers yet).
      if (submitted.length > 0) marksAwarded = q.marks;
    }
    score += marksAwarded;
    return {
      question_id: q.id,
      answer_text: q.type === "open" ? submitted : null,
      selected_option_key: q.type === "mcq" ? submitted : null,
      marks_awarded: marksAwarded,
    };
  });

  const { data: submission, error } = await admin
    .from("journey_assessment_submissions")
    .insert({
      employee_enroll_number: employee.enroll_number,
      assessment_id: assessment.id,
      journey_id: journeyId,
      variant_id: variant.id,
      score,
    })
    .select()
    .single();
  if (error || !submission) return { error: error?.message ?? "জমা দেওয়া যায়নি।" };

  await admin.from("journey_assessment_answers").insert(answerRows.map((r) => ({ ...r, submission_id: submission.id })));

  // Leaderboard housekeeping (rank recompute, podium photo cleanup, top-3
  // notifications) is best-effort side-effect work, not something the
  // employee needs to wait on — it was previously awaited inline, adding
  // up to a dozen sequential round trips to the critical submit path and
  // making the "Assessment Submitted" confirmation feel like it hung,
  // especially over higher-latency network paths. Runs after the response
  // is sent instead.
  after(() => syncLeaderboardAfterSubmission(variant.id));

  revalidatePath("/home");
  revalidatePath("/journey");
  revalidatePath("/leaderboard");
  return { success: true, score };
}

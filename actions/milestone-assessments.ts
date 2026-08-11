"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneIdentity, PhaseKey } from "@/lib/types";

interface SubmitMilestoneAssessmentInput {
  milestone: PhaseKey;
  identity: MilestoneIdentity;
  responses: Record<string, "yes" | "no">;
}

interface SubmitMilestoneAssessmentResult {
  error?: string;
  success?: boolean;
}

export async function submitMilestoneAssessment(
  input: SubmitMilestoneAssessmentInput,
): Promise<SubmitMilestoneAssessmentResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "লগইন করা নেই।" };

  // Independent of each other — both only need input already in hand.
  const [{ data: profile }, { data: template }] = await Promise.all([
    supabase.from("profiles").select("enroll_number").eq("id", user.id).single(),
    supabase.from("milestone_assessment_templates").select("questions").eq("milestone", input.milestone).single(),
  ]);
  if (!profile) return { error: "প্রোফাইল পাওয়া যায়নি।" };
  if (!template) return { error: "Assessment টেমপ্লেট পাওয়া যায়নি।" };

  if (!input.identity.team.trim() || !input.identity.section.trim()) {
    return { error: "Team ও Section পূরণ করুন।" };
  }
  const allAnswered = template.questions.every((q) => input.responses[q] === "yes" || input.responses[q] === "no");
  if (!allAnswered) {
    return { error: "সব প্রশ্নের উত্তর দিন।" };
  }

  // The employees backfill is best-effort and doesn't depend on the upsert's
  // result (different tables) — run both concurrently, then check the
  // upsert's error for the actual return value.
  const [{ error }, { error: employeeUpdateError }] = await Promise.all([
    supabase.from("milestone_assessments").upsert(
      {
        employee_enroll_number: profile.enroll_number,
        milestone: input.milestone,
        identity: { ...input.identity } as Record<string, string>,
        responses: input.responses,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "employee_enroll_number,milestone" },
    ),
    // Reuse Team/Section for the next milestone's form so it isn't re-typed every time.
    supabase
      .from("employees")
      .update({ team: input.identity.team, section: input.identity.section })
      .eq("enroll_number", profile.enroll_number),
  ]);
  if (error) return { error: "জমা দেওয়া যায়নি। একটু পর আবার চেষ্টা করুন।" };
  if (employeeUpdateError) {
    console.error("Failed to backfill team/section on employees:", employeeUpdateError);
  }

  revalidatePath("/home");
  revalidatePath("/journey");

  return { success: true };
}

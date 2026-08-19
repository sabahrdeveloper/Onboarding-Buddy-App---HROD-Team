"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ"] as const;

async function getOrCreateAssessment(journeyId: string, variantId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("journey_assessments").select("*").eq("journey_id", journeyId).maybeSingle();
  if (existing) return existing;
  const { data: created } = await admin
    .from("journey_assessments")
    .insert({ journey_id: journeyId, variant_id: variantId })
    .select()
    .single();
  return created!;
}

function parseQuestionForm(formData: FormData) {
  const type = String(formData.get("type") ?? "mcq") as "mcq" | "open";
  const questionText = String(formData.get("question_text") ?? "").trim();
  const marks = Number(formData.get("marks") ?? 1);
  const sequence = Number(formData.get("sequence") ?? 0);

  if (type === "open") {
    return { type, question_text: questionText, marks, sequence, options: null, correct_option_key: null };
  }

  const options = OPTION_KEYS.map((key) => ({ key, text: String(formData.get(`option_${key}`) ?? "").trim() })).filter(
    (o) => o.text.length > 0,
  );
  const correctOptionKey = String(formData.get("correct_option_key") ?? "");
  return { type, question_text: questionText, marks, sequence, options, correct_option_key: correctOptionKey || null };
}

async function verifyJourneyOwnership(journeyId: string, variantId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("onboarding_phases").select("variant_id").eq("id", journeyId).single();
  return data?.variant_id === variantId;
}

export async function createQuestion(journeyId: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };
  if (!(await verifyJourneyOwnership(journeyId, auth.variantId))) return { error: "Not authorized." };

  const assessment = await getOrCreateAssessment(journeyId, auth.variantId);
  const fields = parseQuestionForm(formData);
  if (!fields.question_text) return { error: "Question text is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("journey_assessment_questions").insert({ ...fields, assessment_id: assessment.id });
  if (error) return { error: error.message };

  revalidatePath(`/admin/assessments/${journeyId}`);
  redirect(`/admin/assessments/${journeyId}`);
}

export async function updateQuestion(journeyId: string, questionId: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };
  if (!(await verifyJourneyOwnership(journeyId, auth.variantId))) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data: question } = await admin.from("journey_assessment_questions").select("assessment_id").eq("id", questionId).single();
  if (!question) return { error: "Not authorized." };
  const { data: assessment } = await admin.from("journey_assessments").select("journey_id").eq("id", question.assessment_id).single();
  if (!assessment || assessment.journey_id !== journeyId) return { error: "Not authorized." };

  const fields = parseQuestionForm(formData);
  if (!fields.question_text) return { error: "Question text is required." };

  const { error } = await admin.from("journey_assessment_questions").update(fields).eq("id", questionId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/assessments/${journeyId}`);
  redirect(`/admin/assessments/${journeyId}`);
}

export async function deleteQuestion(journeyId: string, questionId: string) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };
  if (!(await verifyJourneyOwnership(journeyId, auth.variantId))) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { error } = await admin.from("journey_assessment_questions").delete().eq("id", questionId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/assessments/${journeyId}`);
  return { success: true };
}

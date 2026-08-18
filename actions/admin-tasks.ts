"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

function parseTaskForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    phase: String(formData.get("phase") ?? "30").trim(),
    work_number: Number(formData.get("work_number") ?? 0),
    responsible_role: String(formData.get("responsible_role") ?? "").trim(),
    responsible_key: String(formData.get("responsible_key") ?? "").trim(),
    timeline: String(formData.get("timeline") ?? "").trim(),
    why_text: String(formData.get("why_text") ?? "").trim(),
    how_to_steps: String(formData.get("how_to_steps") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    confirm_question: String(formData.get("confirm_question") ?? "").trim(),
    active: formData.get("active") === "on",
  };
}

export async function createTask(formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const fields = parseTaskForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("onboarding_tasks").insert({
    ...fields,
    responsible_keys: [fields.responsible_key],
    variant_id: auth.variantId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  redirect("/admin/tasks");
}

export async function updateTask(taskId: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  // Ownership check before writing — never trust that the task id in the
  // form actually belongs to this admin's variant.
  const { data: existing } = await admin.from("onboarding_tasks").select("variant_id").eq("id", taskId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const fields = parseTaskForm(formData);
  const { error } = await admin
    .from("onboarding_tasks")
    .update({ ...fields, responsible_keys: [fields.responsible_key] })
    .eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  redirect("/admin/tasks");
}

export async function toggleTaskActive(taskId: string, active: boolean) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("onboarding_tasks").select("variant_id").eq("id", taskId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("onboarding_tasks").update({ active }).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("onboarding_tasks").select("variant_id").eq("id", taskId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("onboarding_tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return { success: true };
}

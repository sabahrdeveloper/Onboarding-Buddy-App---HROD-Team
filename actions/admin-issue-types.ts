"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

function parseIssueTypeForm(formData: FormData) {
  return {
    label: String(formData.get("label") ?? "").trim(),
    assigned_team: String(formData.get("assigned_team") ?? "hr").trim(),
    sequence: Number(formData.get("sequence") ?? 0),
    active: formData.get("active") === "on",
  };
}

export async function createIssueType(formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const fields = parseIssueTypeForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("help_issue_types").insert({ ...fields, variant_id: auth.variantId });
  if (error) return { error: error.message };

  revalidatePath("/admin/issue-types");
  redirect("/admin/issue-types");
}

export async function updateIssueType(issueTypeId: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("help_issue_types").select("variant_id").eq("id", issueTypeId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const fields = parseIssueTypeForm(formData);
  const { error } = await admin.from("help_issue_types").update(fields).eq("id", issueTypeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/issue-types");
  redirect("/admin/issue-types");
}

export async function toggleIssueTypeActive(issueTypeId: string, active: boolean) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("help_issue_types").select("variant_id").eq("id", issueTypeId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("help_issue_types").update({ active }).eq("id", issueTypeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/issue-types");
  return { success: true };
}

export async function deleteIssueType(issueTypeId: string) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("help_issue_types").select("variant_id").eq("id", issueTypeId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("help_issue_types").delete().eq("id", issueTypeId);
  if (error) return { error: error.message };

  revalidatePath("/admin/issue-types");
  return { success: true };
}

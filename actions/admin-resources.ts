"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

function parseResourceForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    sequence: Number(formData.get("sequence") ?? 0),
    active: formData.get("active") === "on",
  };
}

export async function createResourceLink(formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const fields = parseResourceForm(formData);
  const admin = createAdminClient();
  const { error } = await admin.from("resource_links").insert({ ...fields, variant_id: auth.variantId });
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

export async function updateResourceLink(linkId: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("resource_links").select("variant_id").eq("id", linkId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const fields = parseResourceForm(formData);
  const { error } = await admin.from("resource_links").update(fields).eq("id", linkId);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

export async function toggleResourceLinkActive(linkId: string, active: boolean) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("resource_links").select("variant_id").eq("id", linkId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("resource_links").update({ active }).eq("id", linkId);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  return { success: true };
}

export async function deleteResourceLink(linkId: string) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("resource_links").select("variant_id").eq("id", linkId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("resource_links").delete().eq("id", linkId);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  return { success: true };
}

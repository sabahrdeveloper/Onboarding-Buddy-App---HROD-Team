"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT_KEYS } from "@/lib/contact-keys";

function parseContactForm(formData: FormData) {
  return {
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    icon: String(formData.get("icon") ?? "").trim(),
    active: formData.get("active") === "on",
  };
}

export async function createContact(formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const fields = parseContactForm(formData);
  if (!CONTACT_KEYS.includes(fields.key as (typeof CONTACT_KEYS)[number])) return { error: "Invalid key." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("contacts")
    .select("key")
    .eq("variant_id", auth.variantId)
    .eq("key", fields.key)
    .maybeSingle();
  if (existing) return { error: "This key already has a contact — edit it instead." };

  const { error } = await admin.from("contacts").insert({ ...fields, variant_id: auth.variantId });
  if (error) return { error: error.message };

  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

// contacts has no surrogate id column — (variant_id, key) is its natural
// identity, so update/toggle/delete scope directly by both instead of a
// separate ownership pre-check query.
export async function updateContact(key: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const fields = parseContactForm(formData);
  const admin = createAdminClient();
  const { error } = await admin
    .from("contacts")
    .update({ name: fields.name, role: fields.role, phone: fields.phone, icon: fields.icon, active: fields.active })
    .eq("variant_id", auth.variantId)
    .eq("key", key);
  if (error) return { error: error.message };

  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export async function toggleContactActive(key: string, active: boolean) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("contacts").update({ active }).eq("variant_id", auth.variantId).eq("key", key);
  if (error) return { error: error.message };

  revalidatePath("/admin/contacts");
  return { success: true };
}

export async function deleteContact(key: string) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("contacts").delete().eq("variant_id", auth.variantId).eq("key", key);
  if (error) return { error: error.message };

  revalidatePath("/admin/contacts");
  return { success: true };
}

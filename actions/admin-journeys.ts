"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createJourney(formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const sequence = Number(formData.get("sequence") ?? 0);
  if (!name) return { error: "Name is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("onboarding_phases").insert({ name, sequence, variant_id: auth.variantId });
  if (error) return { error: error.message };

  revalidatePath("/admin/journeys");
  redirect("/admin/journeys");
}

export async function updateJourney(journeyId: string, formData: FormData) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("onboarding_phases").select("variant_id").eq("id", journeyId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const sequence = Number(formData.get("sequence") ?? 0);
  if (!name) return { error: "Name is required." };

  const { error } = await admin.from("onboarding_phases").update({ name, sequence }).eq("id", journeyId);
  if (error) return { error: error.message };

  revalidatePath("/admin/journeys");
  redirect("/admin/journeys");
}

export async function toggleJourneyActive(journeyId: string, active: boolean) {
  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("onboarding_phases").select("variant_id").eq("id", journeyId).single();
  if (!existing || existing.variant_id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin.from("onboarding_phases").update({ active }).eq("id", journeyId);
  if (error) return { error: error.message };

  revalidatePath("/admin/journeys");
  return { success: true };
}

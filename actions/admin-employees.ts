"use server";

import { revalidatePath } from "next/cache";
import { requireVariantAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOnboardingVariants } from "@/lib/data/queries";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";

export async function assignBuddyAsHrAdmin(input: {
  enrollNumber: string;
  buddy: string;
  buddyPhone: string;
  buddyEmail: string;
}): Promise<{ error?: string; success?: boolean }> {
  if (!input.buddy.trim()) return { error: "Buddy-এর নাম দিন।" };

  const auth = await requireVariantAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: target } = await admin.from("employees").select("sbu").eq("enroll_number", input.enrollNumber).single();
  if (!target) return { error: "Employee পাওয়া যায়নি।" };

  // Re-derived from the target's own sbu, never trusted from the client —
  // same defense-in-depth pattern as every other admin write in this repo.
  const { data: variantsData } = await getOnboardingVariants();
  const variant = resolveVariantForSbu(target.sbu, (variantsData ?? []).map(mapOnboardingVariant));
  if (variant.id !== auth.variantId) return { error: "Not authorized." };

  const { error } = await admin
    .from("employees")
    .update({ buddy: input.buddy.trim(), buddy_phone: input.buddyPhone.trim(), buddy_email: input.buddyEmail.trim() })
    .eq("enroll_number", input.enrollNumber);
  if (error) return { error: "Buddy assign করা যায়নি। একটু পর আবার চেষ্টা করুন।" };

  revalidatePath(`/employees/${input.enrollNumber}`);
  revalidatePath("/employees");
  return { success: true };
}

import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Every admin-tasks/admin-resources action re-derives this from the session
 * server-side rather than trusting a client-sent variant id — an HR admin's
 * admin_variant_id is the only variant they're ever allowed to write to.
 */
export async function requireVariantAdmin(): Promise<{ variantId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_hr_admin, admin_variant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_hr_admin || !profile.admin_variant_id) return { error: "Not authorized." };
  return { variantId: profile.admin_variant_id };
}

/** Gate for the cross-module broadcast composer — unlike requireVariantAdmin,
 * a super admin isn't scoped to one variant and can target any of them. */
export async function requireSuperAdmin(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) return { error: "Not authorized." };
  return { ok: true };
}

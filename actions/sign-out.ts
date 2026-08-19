"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_TRACK_COOKIE } from "@/lib/onboarding-track";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ONBOARDING_TRACK_COOKIE);
  redirect("/login");
}

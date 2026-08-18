"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { deriveSyntheticEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth/credentials";
import { getPeopleDeskEmployee } from "@/lib/peopledesk";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";

async function siteOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

/**
 * Starts Google OAuth for login. Only useful for accounts that already linked
 * a Google identity via `linkGoogleAccount` below — a fresh, unlinked Google
 * sign-in has no way to know which enroll number it belongs to (the app's
 * synthetic email scheme means the account's real email is never on record
 * as its auth email), so the callback route rejects those.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=google_start_failed");
  redirect(data.url);
}

/** Links a Google identity to the currently signed-in (enroll-number) account. */
export async function linkGoogleAccount() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?linked=1` },
  });
  if (error || !data.url) redirect("/profile?error=google_link_failed");
  redirect(data.url);
}

export interface LoginState {
  error?: string;
}

export async function loginOrCreateProfile(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const enrollNumberRaw = String(formData.get("enrollNumber") ?? "").trim();
  const passwordRaw = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!enrollNumberRaw || !passwordRaw) {
    return { error: "এনরোল নম্বর ও পাসওয়ার্ড দিতে হবে।" };
  }
  if (passwordRaw.length < MIN_PASSWORD_LENGTH) {
    return { error: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে।` };
  }

  const { email, enrollNumber } = deriveSyntheticEmail(enrollNumberRaw);
  const supabase = await createClient({ remember });

  // Fast path: an existing account with the correct password never touches
  // PeopleDesk — logins stay quick and don't depend on that API's uptime.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passwordRaw });

  if (signInError) {
    // Could be (a) a brand-new enroll number (first-time setup) or (b) an
    // existing account with the wrong password. Only PeopleDesk tells us which:
    // if it isn't registered there at all, this can never be a valid account.
    let peopleDeskEmployee;
    try {
      peopleDeskEmployee = await getPeopleDeskEmployee(enrollNumber);
    } catch {
      return { error: "PeopleDesk থেকে তথ্য আনা যায়নি। একটু পর আবার চেষ্টা করুন।" };
    }

    if (!peopleDeskEmployee) {
      return { error: "এই এনরোল নম্বর PeopleDesk-এ নিবন্ধিত নেই।" };
    }

    const { error: signUpError } = await supabase.auth.signUp({ email, password: passwordRaw });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        return { error: "পাসওয়ার্ড ভুল হয়েছে।" };
      }
      return { error: "লগইন করা যায়নি। একটু পর আবার চেষ্টা করুন।" };
    }

    // New account: provision profile, employee record (from PeopleDesk, not
    // typed input), and the 50-task checklist.
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      return { error: "লগইন করা যায়নি। একটু পর আবার চেষ্টা করুন।" };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: userId, enroll_number: enrollNumber, full_name: peopleDeskEmployee.name });
    if (profileError) {
      return { error: "প্রোফাইল তৈরি করা যায়নি। একটু পর আবার চেষ্টা করুন।" };
    }

    const { error: employeeError } = await supabase.from("employees").insert({
      enroll_number: enrollNumber,
      name: peopleDeskEmployee.name,
      sbu: peopleDeskEmployee.sbu,
      department: peopleDeskEmployee.department,
      designation: peopleDeskEmployee.designation,
      joining_date: peopleDeskEmployee.joiningDate,
      reporting_manager: peopleDeskEmployee.reportingManager,
      reporting_manager_phone: peopleDeskEmployee.reportingManagerPhone,
      reporting_manager_email: peopleDeskEmployee.reportingManagerEmail,
      email: peopleDeskEmployee.email,
      profile_id: userId,
    });
    if (employeeError) {
      return { error: "প্রোফাইল তৈরি করা যায়নি। একটু পর আবার চেষ্টা করুন।" };
    }

    // Scoped to this employee's onboarding variant (resolved from their
    // PeopleDesk sbu) — an unscoped select here would give a Light
    // Engineering employee status rows for both variants' tasks.
    const { data: variantsData } = await supabase.from("onboarding_variants").select("*");
    const variant = resolveVariantForSbu(peopleDeskEmployee.sbu, (variantsData ?? []).map(mapOnboardingVariant));

    const { data: tasks } = await supabase.from("onboarding_tasks").select("id").eq("variant_id", variant.id);
    if (tasks && tasks.length > 0) {
      await supabase.from("employee_task_status").insert(
        tasks.map((t) => ({ employee_enroll_number: enrollNumber, task_id: t.id })),
      );
    }
  }

  redirect("/home");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deriveSyntheticEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth/credentials";
import { getPeopleDeskEmployee } from "@/lib/peopledesk";

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

    const { data: tasks } = await supabase.from("onboarding_tasks").select("id");
    if (tasks && tasks.length > 0) {
      await supabase.from("employee_task_status").insert(
        tasks.map((t) => ({ employee_enroll_number: enrollNumber, task_id: t.id })),
      );
    }
  }

  redirect("/home");
}

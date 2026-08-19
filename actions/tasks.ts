"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHASE_META, type PhaseKey } from "@/lib/types";

interface MarkTaskDoneResult {
  error?: string;
  success?: boolean;
  phaseComplete?: boolean;
  phaseTitle?: string;
}

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function markTaskDone(taskId: string): Promise<MarkTaskDoneResult> {
  const supabase = await createClient();

  // These two don't depend on each other — run them concurrently instead of
  // waiting on auth before even checking whether the task exists.
  const [
    {
      data: { user },
    },
    { data: task },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("onboarding_tasks").select("id, phase, variant_id").eq("id", taskId).single(),
  ]);
  if (!user) return { error: "লগইন করা নেই।" };
  if (!task) return { error: "কাজটি খুঁজে পাওয়া যায়নি।" };

  const { data: profile } = await supabase.from("profiles").select("enroll_number").eq("id", user.id).single();
  if (!profile) return { error: "প্রোফাইল পাওয়া যায়নি।" };

  // BRU-05: scoped to the caller's own enroll_number — RLS enforces this too,
  // this is a defense-in-depth check against a tampered taskId.
  const { data: updated, error } = await supabase
    .from("employee_task_status")
    .update({ done: true, done_date: new Date().toISOString() })
    .eq("employee_enroll_number", profile.enroll_number)
    .eq("task_id", taskId)
    .eq("done", false)
    .select("task_id");

  if (error) return { error: "কাজটি সম্পন্ন করা যায়নি। একটু পর আবার চেষ্টা করুন।" };
  if (!updated || updated.length === 0) return { success: true, phaseComplete: false };

  // Independent of each other — fetch concurrently and cross-reference in JS
  // instead of waiting on the phase's task IDs before fetching statuses.
  const [{ data: phaseTasks }, { data: allStatuses }] = await Promise.all([
    supabase.from("onboarding_tasks").select("id").eq("phase", task.phase),
    supabase.from("employee_task_status").select("task_id, done").eq("employee_enroll_number", profile.enroll_number),
  ]);
  const phaseTaskIds = new Set((phaseTasks ?? []).map((t) => t.id));
  const phaseStatuses = (allStatuses ?? []).filter((s) => phaseTaskIds.has(s.task_id));
  const phaseComplete = phaseStatuses.length > 0 && phaseStatuses.every((s) => s.done);

  // Sales Onboarding / dynamic-journey variants only — the default variant's
  // fixed 30/60/90 phases don't need an HR ping per journey completion.
  if (phaseComplete) {
    const { data: variant } = await supabase.from("onboarding_variants").select("is_default").eq("id", task.variant_id).single();
    if (variant && !variant.is_default) {
      const admin = createAdminClient();
      await admin.from("hr_journey_completion_notifications").insert({
        variant_id: task.variant_id,
        employee_enroll_number: profile.enroll_number,
        journey_id: task.phase,
      });
    }
  }

  revalidatePath("/home");
  revalidatePath("/journey");

  return {
    success: true,
    phaseComplete,
    phaseTitle: PHASE_META[task.phase as PhaseKey]?.title,
  };
}

/** Master-administrator-only: toggle any employee's task done/undone state.
 * Gated by the employee_task_status_admin_update RLS policy (is_super_admin
 * only) — regular managers have no write path to a subordinate's tasks, this
 * is exclusively for the SA0001 test/override account. */
export async function adminSetTaskStatus(
  employeeEnrollNumber: string,
  taskId: string,
  done: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_task_status")
    .update({ done, done_date: done ? new Date().toISOString() : null })
    .eq("employee_enroll_number", employeeEnrollNumber)
    .eq("task_id", taskId);
  if (error) return { error: "Update করা যায়নি — admin অনুমতি প্রয়োজন।" };

  revalidatePath(`/team/${employeeEnrollNumber}`);
  revalidatePath("/team");
  return { success: true };
}

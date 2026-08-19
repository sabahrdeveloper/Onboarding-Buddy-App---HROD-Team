import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";

// These wrap queries that app/(app)/layout.tsx and its child pages (home,
// journey, profile) all need in the same request. Without React.cache(), each
// page independently re-ran the same Supabase query the layout had already
// run moments earlier in the same request — this collapses those duplicates
// into one round-trip per unique query, per request.

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

export const getProfile = cache(async () => {
  const supabase = await createClient();
  return supabase.from("profiles").select("full_name, enroll_number").single();
});

export const getEmployee = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) return { data: null, error: null };
  // Filtered explicitly by profile_id (not just relying on RLS to return a
  // single row) — a manager's RLS grant now also exposes subordinate rows,
  // so an unfiltered .single() would break for any manager account.
  return supabase.from("employees").select("*").eq("profile_id", user.id).single();
});

export const getSubordinates = cache(async () => {
  const supabase = await createClient();
  const { data: employee } = await getEmployee();
  if (!employee) return { data: [], error: null };
  // RLS ("employees_manager_select") already restricts every non-self row this
  // query can see to actual subordinates (is_manager_of case-insensitive email
  // match) — this just excludes the caller's own row from the result.
  return supabase.from("employees").select("*").neq("enroll_number", employee.enroll_number).order("name");
});

export const getOnboardingVariants = cache(async () => {
  const supabase = await createClient();
  return supabase.from("onboarding_variants").select("*");
});

export const getEmployeeVariant = cache(async () => {
  const { data: employee } = await getEmployee();
  const { data: variants } = await getOnboardingVariants();
  return resolveVariantForSbu(employee?.sbu, (variants ?? []).map(mapOnboardingVariant));
});

export const getTasksForVariant = cache(async (variantId: string) => {
  const supabase = await createClient();
  return supabase.from("onboarding_tasks").select("*").eq("variant_id", variantId).order("work_number");
});

export const getTasks = cache(async () => {
  const variant = await getEmployeeVariant();
  return getTasksForVariant(variant.id);
});

export const getTaskStatuses = cache(async () => {
  const supabase = await createClient();
  const { data: employee } = await getEmployee();
  if (!employee) return { data: [], error: null };
  // Filtered explicitly by employee_enroll_number (not just relying on RLS) —
  // a manager's RLS grant also exposes subordinate rows via
  // employee_task_status_manager_select, so an unfiltered select here summed
  // every subordinate's task rows into the caller's own "Journey"/KPI totals.
  return supabase
    .from("employee_task_status")
    .select("task_id, done, done_date")
    .eq("employee_enroll_number", employee.enroll_number);
});

export const getEmployeeAssessments = cache(async () => {
  const supabase = await createClient();
  return supabase.from("employee_assessments").select("assessment_key, submitted_at");
});

export const getMilestoneAssessments = cache(async () => {
  const supabase = await createClient();
  return supabase.from("milestone_assessments").select("milestone, submitted_at");
});

export const getIsHrAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_hr_admin").eq("id", user.id).single();
  return Boolean(data?.is_hr_admin);
});

export const getAdminVariantId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("is_hr_admin, admin_variant_id").eq("id", user.id).single();
  return data?.is_hr_admin ? (data.admin_variant_id ?? null) : null;
});

export const getIsSuperAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single();
  return Boolean(data?.is_super_admin);
});

export const getUnreadNotificationCount = cache(async () => {
  const supabase = await createClient();
  const { data: employee } = await getEmployee();
  if (!employee) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_enroll_number", employee.enroll_number)
    .eq("is_read", false);
  return count ?? 0;
});

export const getUnreadKpiNotificationCount = cache(async () => {
  const supabase = await createClient();
  const { data: employee } = await getEmployee();
  if (!employee) return 0;
  const { count } = await supabase
    .from("kpi_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_enroll_number", employee.enroll_number)
    .eq("is_read", false);
  return count ?? 0;
});

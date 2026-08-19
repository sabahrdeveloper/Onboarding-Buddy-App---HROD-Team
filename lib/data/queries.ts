import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";
import { ONBOARDING_TRACK_COOKIE, isOnboardingTrack } from "@/lib/onboarding-track";

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

// The employee's own SBU-resolved variant, ignoring any onboarding-track
// choice — this is "which variant's population they actually belong to,"
// used everywhere that reasons about the employee as data (HR admin
// screens targeting them, provisioning, etc.), never for deciding what
// content *they themselves* currently see.
export const getHomeVariant = cache(async () => {
  const { data: employee } = await getEmployee();
  const { data: variants } = await getOnboardingVariants();
  return resolveVariantForSbu(employee?.sbu, (variants ?? []).map(mapOnboardingVariant));
});

// What content/theme/nav the currently-logged-in employee actually sees.
// For a default-variant employee this is always their home variant — no
// choice exists. An employee whose home variant is non-default (e.g. Akij
// Light Engineering) additionally runs the normal/default onboarding
// alongside their special one, and picks which to view via the
// /select-onboarding page — that choice is stored in a per-session cookie
// (cleared on sign-out, so it's re-asked every login) and is what this
// resolves against. Every existing page that reads "the employee's
// variant" already goes through this one function, so centralizing the
// track logic here is what makes it apply everywhere for free.
export const getEmployeeVariant = cache(async () => {
  const homeVariant = await getHomeVariant();
  if (homeVariant.isDefault) return homeVariant;

  const cookieStore = await cookies();
  const track = cookieStore.get(ONBOARDING_TRACK_COOKIE)?.value;
  if (!isOnboardingTrack(track) || track === "sales") return homeVariant;

  const { data: variants } = await getOnboardingVariants();
  const defaultVariant = (variants ?? []).map(mapOnboardingVariant).find((v) => v.isDefault);
  return defaultVariant ?? homeVariant;
});

export const getTasksForVariant = cache(async (variantId: string) => {
  const supabase = await createClient();
  return supabase.from("onboarding_tasks").select("*").eq("variant_id", variantId).order("work_number");
});

export const getTasks = cache(async () => {
  const variant = await getEmployeeVariant();
  return getTasksForVariant(variant.id);
});

// Dynamic journeys (non-default variants only — the default variant keeps
// its hardcoded 30/60/90/180). `activeOnly` false is used by the admin
// screen, which must still show/assign to a deactivated journey.
export const getPhasesForVariant = cache(async (variantId: string, opts: { activeOnly: boolean }) => {
  const supabase = await createClient();
  let query = supabase.from("onboarding_phases").select("*").eq("variant_id", variantId).order("sequence");
  if (opts.activeOnly) query = query.eq("active", true);
  return query;
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

// Journey assessments (Sales Onboarding / dynamic-journey variants only) —
// see supabase/migrations/0007_journey_assessments.sql for why this is a
// separate model from assessment_templates.

export const getJourneyAssessmentForJourney = cache(async (journeyId: string) => {
  const supabase = await createClient();
  return supabase.from("journey_assessments").select("*").eq("journey_id", journeyId).maybeSingle();
});

// Admin view — includes correct_option_key. Never pass this straight to a
// client component the employee can inspect; use getQuestionsForEmployee
// (below) for anything rendered to an employee taking the assessment.
export const getQuestionsForAdmin = cache(async (assessmentId: string) => {
  const supabase = await createClient();
  return supabase.from("journey_assessment_questions").select("*").eq("assessment_id", assessmentId).order("sequence");
});

export const getQuestionsForEmployee = cache(async (assessmentId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_assessment_questions")
    .select("id, type, question_text, options, marks, sequence")
    .eq("assessment_id", assessmentId)
    .order("sequence");
  return { data, error };
});

export const getAssessmentSubmission = cache(async (employeeEnrollNumber: string, assessmentId: string) => {
  const supabase = await createClient();
  return supabase
    .from("journey_assessment_submissions")
    .select("*")
    .eq("employee_enroll_number", employeeEnrollNumber)
    .eq("assessment_id", assessmentId)
    .maybeSingle();
});

// All of the current employee's submissions across every journey in their
// variant — used to gate journey completion (tasks done AND submitted).
export const getMySubmittedAssessmentJourneyIds = cache(async () => {
  const supabase = await createClient();
  const { data: employee } = await getEmployee();
  if (!employee) return new Set<string>();
  const { data } = await supabase
    .from("journey_assessment_submissions")
    .select("journey_id")
    .eq("employee_enroll_number", employee.enroll_number);
  return new Set((data ?? []).map((s) => s.journey_id));
});

export const getUnreadHrCompletionCount = cache(async (variantId: string) => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("hr_journey_completion_notifications")
    .select("id", { count: "exact", head: true })
    .eq("variant_id", variantId)
    .eq("is_read", false);
  return count ?? 0;
});

export const getLeaderboardPhoto = cache(async (employeeEnrollNumber: string) => {
  const supabase = await createClient();
  return supabase.from("leaderboard_photos").select("*").eq("employee_enroll_number", employeeEnrollNumber).maybeSingle();
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

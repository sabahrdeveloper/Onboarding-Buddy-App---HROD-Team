import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getAdminVariantId,
  getAuthUser,
  getEmployee,
  getEmployeeAssessments,
  getEmployeeVariant,
  getHomeVariant,
  getMilestoneAssessments,
  getProfile,
  getTaskStatuses,
  getTasks,
} from "@/lib/data/queries";
import { ONBOARDING_TRACK_COOKIE, isOnboardingTrack } from "@/lib/onboarding-track";
import { combineRole, findSbuAssignments, type SbuHrAssignment } from "@/lib/sbu-matching";
import { buildCompanyWideContactLists } from "@/lib/contact-lists";
import { BottomNav } from "@/components/layout/BottomNav";
import { OverlayProvider } from "@/components/journey/OverlayProvider";
import type {
  AssessmentKey,
  AssessmentTemplate,
  Contact,
  MilestoneAssessmentTemplate,
  MilestoneIdentity,
  PhaseKey,
  Task,
} from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  // An employee whose home variant isn't the default (e.g. Akij Light
  // Engineering) runs two onboarding tracks side by side and must pick one
  // via /select-onboarding before reaching any (app) page — re-asked every
  // login since signOut() clears this cookie. Default-variant employees
  // never have a choice to make, so this never fires for them.
  const homeVariant = await getHomeVariant();
  if (!homeVariant.isDefault) {
    const cookieStore = await cookies();
    const track = cookieStore.get(ONBOARDING_TRACK_COOKIE)?.value;
    if (!isOnboardingTrack(track)) redirect("/select-onboarding");
  }

  const [
    { data: profile },
    { data: employee },
    variant,
    { data: rawTasks },
    { data: statuses },
    { data: assessmentsData },
    { data: milestoneAssessmentsData },
    { data: sbuAssignmentsData },
    { data: isManagerData },
    adminVariantId,
  ] = await Promise.all([
    getProfile(),
    getEmployee(),
    getEmployeeVariant(),
    getTasks(),
    getTaskStatuses(),
    getEmployeeAssessments(),
    getMilestoneAssessments(),
    supabase.from("sbu_hr_assignments").select("*"),
    supabase.rpc("is_manager"),
    getAdminVariantId(),
  ]);

  // Assessment/milestone templates depend on the variant just resolved above,
  // so they're fetched in a second small batch rather than the first —
  // same reasoning as the subordinate-detail page: an employee only ever
  // sees their own variant's template content.
  const [{ data: templatesData }, { data: milestoneTemplatesData }, { data: contactsData }, { data: issueTypesData }] =
    await Promise.all([
      supabase.from("assessment_templates").select("*").eq("variant_id", variant.id),
      supabase.from("milestone_assessment_templates").select("*").eq("variant_id", variant.id),
      supabase.from("contacts").select("*").eq("variant_id", variant.id).order("key"),
      supabase
        .from("help_issue_types")
        .select("label")
        .eq("variant_id", variant.id)
        .eq("active", true)
        .order("sequence"),
    ]);
  const helpIssueTypes = (issueTypesData ?? []).map((t) => t.label);

  const statusByTaskId = new Map((statuses ?? []).map((s) => [s.task_id, s]));
  const tasks: Task[] = (rawTasks ?? []).map((t) => ({
    id: t.id,
    workNumber: t.work_number,
    phase: t.phase as PhaseKey,
    title: t.title,
    responsibleRole: t.responsible_role,
    responsibleKey: t.responsible_key,
    responsibleKeys: t.responsible_keys?.length ? t.responsible_keys : [t.responsible_key],
    timeline: t.timeline,
    whyText: t.why_text,
    howToSteps: t.how_to_steps,
    confirmQuestion: t.confirm_question,
    done: statusByTaskId.get(t.id)?.done ?? false,
    doneDate: statusByTaskId.get(t.id)?.done_date ?? null,
  }));

  const genericContacts: Contact[] = (contactsData ?? []).map((c) => ({
    key: c.key,
    name: c.name,
    role: c.role,
    phone: c.phone,
    icon: c.icon,
  }));

  // SBU-specific HRBP/IT Head (round 3 — dynamic per-SBU assignment): match the
  // employee's PeopleDesk-sourced SBU string against the cluster reference data.
  // Falls back to the generic hr/it contact below when no row matches, or when
  // the matched row's person for that specific field is empty (e.g. HRBP "Vacant").
  const sbuAssignments: SbuHrAssignment[] = (sbuAssignmentsData ?? []).map((r) => ({
    cluster: r.cluster,
    sbuDisplayName: r.sbu_display_name,
    sbuAliases: r.sbu_aliases,
    collisionLabel: r.collision_label,
    hrClusterHead: { name: r.hr_cluster_head_name, phone: r.hr_cluster_head_phone, email: r.hr_cluster_head_email },
    hrbp: { name: r.hrbp_name, phone: r.hrbp_phone, email: r.hrbp_email },
    hrSs: { name: r.hr_ss_name, phone: r.hr_ss_phone, email: r.hr_ss_email },
    itHead: { name: r.it_head_name, phone: r.it_head_phone, email: r.it_head_email },
  }));
  const sbuMatches = findSbuAssignments(employee?.sbu, sbuAssignments);
  const dynamicHrbp = combineRole(sbuMatches, (m) => m.hrbp);
  const dynamicItHead = combineRole(sbuMatches, (m) => m.itHead);

  // Company-wide contact list popups (item 2) — every distinct HR/IT person
  // across all SBUs, not scoped to this employee.
  const { hr: hrContactList, it: itContactList } = buildCompanyWideContactLists(sbuAssignments);

  // Manager/Buddy contact cards use the employee's own assigned person (item 2/4 —
  // single source of truth) when that data has been filled in, falling back to the
  // generic org-wide directory entry otherwise (e.g. a freshly auto-created account).
  const contacts: Contact[] = genericContacts.map((c) => {
    if (c.key === "manager" && employee?.reporting_manager) {
      return {
        ...c,
        name: employee.reporting_manager,
        phone: employee.reporting_manager_phone || c.phone,
        email: employee.reporting_manager_email,
      };
    }
    if (c.key === "buddy" && employee?.buddy) {
      return {
        ...c,
        name: employee.buddy,
        phone: employee.buddy_phone || c.phone,
        email: employee.buddy_email,
      };
    }
    if (c.key === "hr" && dynamicHrbp?.name) {
      return { ...c, name: dynamicHrbp.name, phone: dynamicHrbp.phone || c.phone, email: dynamicHrbp.email };
    }
    if (c.key === "it" && dynamicItHead?.name) {
      return { ...c, name: dynamicItHead.name, phone: dynamicItHead.phone || c.phone, email: dynamicItHead.email };
    }
    return c;
  });

  // "dept"-tagged tasks now point at the employee's real Line Manager rather
  // than a generic Department Head placeholder — reuses the manager contact
  // resolved above, keeping the "dept" role label for context.
  const managerContact = contacts.find((c) => c.key === "manager");
  const contactsWithDept = managerContact
    ? contacts.map((c) => (c.key === "dept" ? { ...managerContact, key: "dept", role: c.role } : c))
    : contacts;

  const assessmentTemplates: AssessmentTemplate[] = (templatesData ?? []).map((t) => ({
    key: t.assessment_key as AssessmentKey,
    title: t.title,
    items: t.items,
    statusOptions: t.status_options,
  }));

  const submittedAssessments = (assessmentsData ?? []).map((a) => ({
    assessmentKey: a.assessment_key as AssessmentKey,
    submittedAt: a.submitted_at,
  }));

  const milestoneAssessmentTemplates: MilestoneAssessmentTemplate[] = (milestoneTemplatesData ?? []).map((t) => ({
    milestone: t.milestone as PhaseKey,
    questions: t.questions,
  }));

  const submittedMilestoneKeys = new Set(
    (milestoneAssessmentsData ?? []).filter((m) => m.submitted_at).map((m) => m.milestone as PhaseKey),
  );

  const identityDefaults: MilestoneIdentity = {
    employeeId: profile?.enroll_number ?? "",
    fullName: profile?.full_name ?? "",
    email: employee?.email ?? "",
    designation: employee?.designation ?? "",
    team: employee?.team ?? "",
    section: employee?.section ?? "",
    sbu: employee?.sbu ?? "",
  };

  // Theme override: only variant colors that are actually set replace the
  // app/globals.css defaults — a variant with no colors configured yet (or a
  // future variant missing one field) falls straight back to the existing
  // Akij Resource palette via normal CSS cascade, never a blank/broken value.
  const themeVars: React.CSSProperties = {
    ...(variant.primaryColor ? { "--green": variant.primaryColor } : {}),
    ...(variant.secondaryColor ? { "--green-dark": variant.secondaryColor } : {}),
    ...(variant.accentColor ? { "--blue": variant.accentColor } : {}),
    ...(variant.backgroundColor ? { "--bg": variant.backgroundColor } : {}),
  } as React.CSSProperties;

  return (
    <OverlayProvider
      tasks={tasks}
      contacts={contactsWithDept}
      assessmentTemplates={assessmentTemplates}
      submittedAssessments={submittedAssessments}
      milestoneAssessmentTemplates={milestoneAssessmentTemplates}
      submittedMilestoneKeys={submittedMilestoneKeys}
      identityDefaults={identityDefaults}
      hrContactList={hrContactList}
      itContactList={itContactList}
      helpIssueTypes={helpIssueTypes}
    >
      <div className="flex min-h-full flex-col" style={themeVars}>
        <div className="flex-1 px-4 pb-5 pt-1">{children}</div>
        <BottomNav
          showTeamTab={Boolean(isManagerData)}
          navMode={variant.navMode}
          showEmployeesTab={Boolean(adminVariantId)}
        />
      </div>
    </OverlayProvider>
  );
}

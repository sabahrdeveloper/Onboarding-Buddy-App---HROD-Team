import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminAssessmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: journeys } = await supabase
    .from("onboarding_phases")
    .select("id, name")
    .eq("variant_id", profile.admin_variant_id)
    .order("sequence");

  // journey_assessments/questions have no authenticated select RLS policy —
  // deliberately, so a regular employee's client can never read the answer
  // key — so the admin screen reads them via the service-role client.
  const admin = createAdminClient();
  const { data: assessments } = await admin
    .from("journey_assessments")
    .select("id, journey_id")
    .eq("variant_id", profile.admin_variant_id);
  const assessmentIds = (assessments ?? []).map((a) => a.id);
  const journeyIdByAssessmentId = new Map((assessments ?? []).map((a) => [a.id, a.journey_id]));

  const { data: questions } =
    assessmentIds.length > 0
      ? await admin.from("journey_assessment_questions").select("assessment_id").in("assessment_id", assessmentIds)
      : { data: [] };

  const countByJourney = new Map<string, number>();
  for (const q of questions ?? []) {
    const journeyId = journeyIdByAssessmentId.get(q.assessment_id);
    if (!journeyId) continue;
    countByJourney.set(journeyId, (countByJourney.get(journeyId) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Journey Assessments</div>
      <div className="flex flex-col gap-2">
        {(journeys ?? []).map((j) => (
          <Link
            key={j.id}
            href={`/admin/assessments/${j.id}`}
            className="flex items-center justify-between rounded-card border border-line bg-card p-3.5 shadow-card"
          >
            <span className="text-[13.5px] font-bold text-text">{j.name}</span>
            <span className="text-[12px] font-medium text-muted">{countByJourney.get(j.id) ?? 0} questions</span>
          </Link>
        ))}
        {(journeys ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            No journeys yet — create one under Journeys first.
          </div>
        )}
      </div>
    </div>
  );
}

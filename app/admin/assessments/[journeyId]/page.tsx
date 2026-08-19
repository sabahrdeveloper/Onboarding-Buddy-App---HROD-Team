import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteQuestion } from "@/actions/admin-assessments";

export default async function AdminJourneyAssessmentPage({ params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: journey } = await supabase
    .from("onboarding_phases")
    .select("*")
    .eq("id", journeyId)
    .eq("variant_id", profile.admin_variant_id)
    .single();
  if (!journey) notFound();

  const admin = createAdminClient();
  const { data: assessment } = await admin.from("journey_assessments").select("*").eq("journey_id", journeyId).maybeSingle();
  const { data: questions } = assessment
    ? await admin.from("journey_assessment_questions").select("*").eq("assessment_id", assessment.id).order("sequence")
    : { data: [] };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-en text-[15px] font-bold text-text">{journey.name} — Assessment ({questions?.length ?? 0})</div>
        <Link
          href={`/admin/assessments/${journeyId}/new`}
          className="rounded-lg bg-green px-3 py-1.5 font-en text-[13px] font-bold text-white"
        >
          + Add Question
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {(questions ?? []).map((q, i) => (
          <div key={q.id} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted">
                  {q.type === "mcq" ? "Multiple Choice" : "Open Answer"} · {q.marks} marks
                </div>
                <div className="text-[13.5px] font-bold text-text">
                  {i + 1}. {q.question_text}
                </div>
                {q.type === "mcq" && (
                  <div className="mt-1 text-[12px] font-medium text-muted">
                    {(q.options as { key: string; text: string }[] | null)?.map((o) => (
                      <div key={o.key} className={o.key === q.correct_option_key ? "font-bold text-green-dark" : ""}>
                        {o.key}) {o.text}
                        {o.key === q.correct_option_key ? " ✓" : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Link
                href={`/admin/assessments/${journeyId}/${q.id}/edit`}
                className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text"
              >
                Edit
              </Link>
              <form
                action={async () => {
                  "use server";
                  await deleteQuestion(journeyId, q.id);
                }}
              >
                <button type="submit" className="rounded-lg border border-[#f1b4b6] px-2.5 py-1 text-[12px] font-semibold text-err-tx">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {(questions ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            No questions yet.
          </div>
        )}
      </div>
    </div>
  );
}

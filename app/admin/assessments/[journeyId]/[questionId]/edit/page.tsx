import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { updateQuestion } from "@/actions/admin-assessments";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ journeyId: string; questionId: string }>;
}) {
  const { journeyId, questionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: question } = await createAdminClient().from("journey_assessment_questions").select("*").eq("id", questionId).single();
  if (!question) notFound();

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Edit Question</div>
      <QuestionForm
        action={updateQuestion.bind(null, journeyId, questionId)}
        initial={question as never}
        submitLabel="Save Changes"
      />
    </div>
  );
}

import { QuestionForm } from "@/components/admin/QuestionForm";
import { createQuestion } from "@/actions/admin-assessments";

export default async function NewQuestionPage({ params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = await params;
  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Question</div>
      <QuestionForm action={createQuestion.bind(null, journeyId)} submitLabel="Add Question" />
    </div>
  );
}

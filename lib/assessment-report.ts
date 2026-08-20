import "server-only";
import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin";

/** Builds an .xlsx workbook for one journey's assessment: a per-employee
 * score sheet and a per-question correct/wrong tally, sorted hardest-first. */
export async function buildAssessmentReportWorkbook(journeyId: string): Promise<ExcelJS.Buffer> {
  const admin = createAdminClient();

  const { data: journey } = await admin.from("onboarding_phases").select("name").eq("id", journeyId).single();
  const { data: assessment } = await admin.from("journey_assessments").select("id").eq("journey_id", journeyId).single();

  const workbook = new ExcelJS.Workbook();
  const journeyName = journey?.name ?? "Journey";

  if (!assessment) {
    workbook.addWorksheet("Scores").addRow(["No assessment configured for this journey."]);
    return workbook.xlsx.writeBuffer();
  }

  const [{ data: submissions }, { data: questions }] = await Promise.all([
    admin
      .from("journey_assessment_submissions")
      .select("id, employee_enroll_number, score, submitted_at")
      .eq("assessment_id", assessment.id)
      .order("score", { ascending: false }),
    admin.from("journey_assessment_questions").select("id, question_text, type, marks, sequence").eq("assessment_id", assessment.id).order("sequence"),
  ]);

  const enrollNumbers = (submissions ?? []).map((s) => s.employee_enroll_number);
  const { data: employees } =
    enrollNumbers.length > 0
      ? await admin.from("employees").select("enroll_number, name, designation, sbu").in("enroll_number", enrollNumbers)
      : { data: [] };
  const employeeByEnroll = new Map((employees ?? []).map((e) => [e.enroll_number, e]));

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: answers } =
    submissionIds.length > 0
      ? await admin
          .from("journey_assessment_answers")
          .select("submission_id, question_id, selected_option_key, answer_text, marks_awarded")
          .in("submission_id", submissionIds)
      : { data: [] };

  // Sheet 1: per-employee scores.
  const scoreSheet = workbook.addWorksheet("Scores");
  scoreSheet.addRow([`${journeyName} — Assessment Scores`]);
  scoreSheet.getRow(1).font = { bold: true, size: 14 };
  scoreSheet.addRow([]);
  const scoreHeader = scoreSheet.addRow(["Rank", "Name", "Enroll Number", "Designation", "SBU", "Score", "Submitted At"]);
  scoreHeader.font = { bold: true };
  (submissions ?? []).forEach((s, i) => {
    const emp = employeeByEnroll.get(s.employee_enroll_number);
    scoreSheet.addRow([
      i + 1,
      emp?.name ?? s.employee_enroll_number,
      s.employee_enroll_number,
      emp?.designation ?? "",
      emp?.sbu ?? "",
      s.score,
      new Date(s.submitted_at).toLocaleString(),
    ]);
  });
  scoreSheet.columns.forEach((col) => (col.width = 20));

  // Sheet 2: per-question correct/wrong tally, hardest (lowest correct %) first.
  const questionSheet = workbook.addWorksheet("Question Stats");
  questionSheet.addRow([`${journeyName} — Question Performance`]);
  questionSheet.getRow(1).font = { bold: true, size: 14 };
  questionSheet.addRow([]);
  const qHeader = questionSheet.addRow(["#", "Question", "Type", "Correct", "Wrong", "Total Answered", "Correct %"]);
  qHeader.font = { bold: true };

  const answersByQuestion = new Map<string, { correct: number; wrong: number }>();
  for (const a of answers ?? []) {
    const bucket = answersByQuestion.get(a.question_id) ?? { correct: 0, wrong: 0 };
    // marks_awarded > 0 means full marks were scored for that answer — the
    // same rule submitJourneyAssessment uses (mcq: matched the answer key;
    // open: any non-empty answer), so "correct" here means "scored".
    if (a.marks_awarded > 0) bucket.correct++;
    else bucket.wrong++;
    answersByQuestion.set(a.question_id, bucket);
  }

  const questionRows = (questions ?? []).map((q, i) => {
    const stats = answersByQuestion.get(q.id) ?? { correct: 0, wrong: 0 };
    const totalAnswered = stats.correct + stats.wrong;
    const pct = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;
    return { index: i + 1, text: q.question_text, type: q.type, ...stats, totalAnswered, pct };
  });
  questionRows.sort((a, b) => a.pct - b.pct);
  for (const row of questionRows) {
    questionSheet.addRow([row.index, row.text, row.type, row.correct, row.wrong, row.totalAnswered, `${row.pct}%`]);
  }
  questionSheet.getColumn(2).width = 60;
  questionSheet.columns.forEach((col, i) => {
    if (i !== 1) col.width = 16;
  });

  return workbook.xlsx.writeBuffer();
}

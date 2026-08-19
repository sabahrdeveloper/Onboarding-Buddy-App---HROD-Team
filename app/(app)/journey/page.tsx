import { MilestoneCard, GrowthMilestoneCard } from "@/components/journey/MilestoneCard";
import { ViewWorkListButton } from "@/components/journey/ViewWorkListButton";
import { getEmployeeAssessments, getEmployeeVariant, getMilestoneAssessments, getTaskStatuses, getTasks } from "@/lib/data/queries";
import { growthReviewUnlocked } from "@/lib/business-rules";
import { PHASE_META, PHASE_META_BN, GROWTH_PHASE_META, GROWTH_PHASE_META_BN, type PhaseKey } from "@/lib/types";

const PHASE_KEYS: PhaseKey[] = ["30", "60", "90"];

export default async function JourneyPage() {
  const [{ data: tasks }, { data: statuses }, { data: assessments }, { data: milestoneAssessments }, variant] =
    await Promise.all([getTasks(), getTaskStatuses(), getEmployeeAssessments(), getMilestoneAssessments(), getEmployeeVariant()]);
  const isBn = variant.navMode === "resources";
  const phaseMeta = isBn ? PHASE_META_BN : PHASE_META;
  const growthMeta = isBn ? GROWTH_PHASE_META_BN : GROWTH_PHASE_META;

  const phaseById = new Map((tasks ?? []).map((t) => [t.id, t.phase as PhaseKey]));
  const doneByPhase: Record<PhaseKey, { done: number; total: number }> = {
    "30": { done: 0, total: 0 },
    "60": { done: 0, total: 0 },
    "90": { done: 0, total: 0 },
  };
  let completed = 0;
  for (const s of statuses ?? []) {
    const phase = phaseById.get(s.task_id);
    if (!phase) continue;
    doneByPhase[phase].total++;
    if (s.done) {
      doneByPhase[phase].done++;
      completed++;
    }
  }

  const total = tasks?.length ?? 50;
  const allTasksDone = total > 0 && completed === total;
  const submittedByKey = new Map((assessments ?? []).map((a) => [a.assessment_key, Boolean(a.submitted_at)]));
  const milestoneSubmittedByKey = new Map(
    (milestoneAssessments ?? []).map((m) => [m.milestone, Boolean(m.submitted_at)]),
  );
  const fullySubmitted = (key: PhaseKey) => (submittedByKey.get(key) ?? false) && (milestoneSubmittedByKey.get(key) ?? false);
  const unlocked = growthReviewUnlocked(allTasksDone, {
    "30": fullySubmitted("30"),
    "60": fullySubmitted("60"),
    "90": fullySubmitted("90"),
  });

  return (
    <div>
      <div className="mb-4 mt-1.5">
        <div className="font-en text-xl font-bold leading-tight text-text">
          {isBn ? "৩০ · ৬০ · ৯০ · ১৮০ জার্নি" : "30 · 60 · 90 · 180 Journey"}
        </div>
        <div className="mt-1 text-sm font-medium leading-snug text-muted">
          আপনার প্রথম ১৮০ দিনের সম্পূর্ণ পথচলা
        </div>
      </div>

      <ViewWorkListButton bn={isBn} />

      {PHASE_KEYS.map((key) => (
        <MilestoneCard
          key={key}
          phase={{ key, ...phaseMeta[key], totalTasks: doneByPhase[key].total, doneTasks: doneByPhase[key].done }}
          bn={isBn}
        />
      ))}
      <GrowthMilestoneCard phase={{ key: "180", ...growthMeta, unlocked }} bn={isBn} />
    </div>
  );
}

import Link from "next/link";
import { MilestoneCard, GrowthMilestoneCard } from "@/components/journey/MilestoneCard";
import { ViewWorkListButton } from "@/components/journey/ViewWorkListButton";
import { Icon } from "@/components/icons/Icon";
import {
  getEmployeeAssessments,
  getEmployeeVariant,
  getMilestoneAssessments,
  getPhasesForVariant,
  getTaskStatuses,
  getTasks,
} from "@/lib/data/queries";
import { growthReviewUnlocked } from "@/lib/business-rules";
import { PHASE_META, PHASE_META_BN, GROWTH_PHASE_META, GROWTH_PHASE_META_BN, type PhaseKey } from "@/lib/types";

const PHASE_KEYS: PhaseKey[] = ["30", "60", "90"];

export default async function JourneyPage() {
  const [{ data: tasks }, { data: statuses }, { data: assessments }, { data: milestoneAssessments }, variant] =
    await Promise.all([getTasks(), getTaskStatuses(), getEmployeeAssessments(), getMilestoneAssessments(), getEmployeeVariant()]);
  const isBn = variant.navMode === "resources";
  const phaseMeta = isBn ? PHASE_META_BN : PHASE_META;
  const growthMeta = isBn ? GROWTH_PHASE_META_BN : GROWTH_PHASE_META;

  if (!variant.isDefault) {
    const { data: journeys } = await getPhasesForVariant(variant.id, { activeOnly: true });
    const activeTasks = (tasks ?? []).filter((t) => t.active);
    const doneTaskIds = new Set((statuses ?? []).filter((s) => s.done).map((s) => s.task_id));
    const doneByJourney = new Map((journeys ?? []).map((j) => [j.id, { done: 0, total: 0 }]));
    for (const t of activeTasks) {
      const counts = doneByJourney.get(t.phase);
      if (!counts) continue;
      counts.total++;
      if (doneTaskIds.has(t.id)) counts.done++;
    }

    return (
      <div>
        <div className="mb-4 mt-1.5">
          <div className="font-en text-xl font-bold leading-tight text-text">
            {isBn ? "আপনার জার্নি" : "Your Journey"}
          </div>
          <div className="mt-1 text-sm font-medium leading-snug text-muted">
            {isBn ? "আপনার onboarding পথচলা" : "Your onboarding path"}
          </div>
        </div>

        <Link
          href="/leaderboard"
          className="mb-2.5 flex items-center justify-center gap-2 rounded-button border-2 bg-card px-4 py-3 font-en text-sm font-bold text-text shadow-card transition-transform active:scale-[0.98]"
          style={{ borderColor: "#D4AF37" }}
        >
          <Icon name="award" size={18} />
          {isBn ? "লিডারবোর্ড" : "Leaderboard"}
        </Link>
        <ViewWorkListButton bn={isBn} />

        {(journeys ?? []).map((j) => {
          const counts = doneByJourney.get(j.id) ?? { done: 0, total: 0 };
          return (
            <MilestoneCard
              key={j.id}
              phase={{
                key: j.id,
                title: j.name,
                sub: "",
                color: "#2CA24D",
                short: j.name.slice(0, 3).toUpperCase(),
                totalTasks: counts.total,
                doneTasks: counts.done,
              }}
              bn={isBn}
            />
          );
        })}
        {(journeys ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            {isBn ? "এখনো কোনো জার্নি যোগ করা হয়নি।" : "No journeys have been added yet."}
          </div>
        )}
      </div>
    );
  }

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

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Mascot } from "@/components/mascot/Mascot";
import { MilestoneCard, GrowthMilestoneCard } from "@/components/journey/MilestoneCard";
import { ContinueJourneyButton } from "@/components/journey/ContinueJourneyButton";
import { ViewWorkListButton } from "@/components/journey/ViewWorkListButton";
import { HrServicesGrid } from "@/components/journey/HrServicesGrid";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Icon } from "@/components/icons/Icon";
import {
  getAdminVariantId,
  getEmployee,
  getEmployeeAssessments,
  getEmployeeVariant,
  getHomeVariant,
  getIsHrAdmin,
  getMilestoneAssessments,
  getProfile,
  getTaskStatuses,
  getTasks,
  getUnreadNotificationCount,
} from "@/lib/data/queries";
import { ONBOARDING_TRACK_COOKIE, isOnboardingTrack } from "@/lib/onboarding-track";
import { currentPhase, daysRemainingInPhase, growthReviewUnlocked, progressPercent } from "@/lib/business-rules";
import { PHASE_META, GROWTH_PHASE_META, type PhaseKey } from "@/lib/types";

export default async function HomePage() {
  // An employee whose home variant isn't the default (e.g. Akij Light
  // Engineering) runs two onboarding tracks side by side and must pick one
  // via /select-onboarding before reaching Home — re-asked every login
  // since signOut() clears this cookie. Lives here (not the shared (app)
  // layout) so /profile and /notifications stay reachable pre-selection —
  // e.g. the Profile button on /select-onboarding itself.
  const homeVariant = await getHomeVariant();
  if (!homeVariant.isDefault) {
    const cookieStore = await cookies();
    const track = cookieStore.get(ONBOARDING_TRACK_COOKIE)?.value;
    if (!isOnboardingTrack(track)) redirect("/select-onboarding");
  }

  const [
    { data: profile },
    { data: employee },
    { data: tasks },
    { data: statuses },
    { data: assessments },
    { data: milestoneAssessments },
    variant,
    isHrAdmin,
    adminVariantId,
    unreadNotificationCount,
  ] = await Promise.all([
    getProfile(),
    getEmployee(),
    getTasks(),
    getTaskStatuses(),
    getEmployeeAssessments(),
    getMilestoneAssessments(),
    getEmployeeVariant(),
    getIsHrAdmin(),
    getAdminVariantId(),
    getUnreadNotificationCount(),
  ]);
  const isMirrorApp = variant.navMode === "resources";

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
  const pct = progressPercent(completed);
  const phase = currentPhase(doneByPhase);
  const firstName = profile?.full_name?.trim().split(/\s+/).slice(0, 2).join(" ") ?? "";

  const submittedByKey = new Map((assessments ?? []).map((a) => [a.assessment_key, Boolean(a.submitted_at)]));
  const milestoneSubmittedByKey = new Map(
    (milestoneAssessments ?? []).map((m) => [m.milestone, Boolean(m.submitted_at)]),
  );
  const fullySubmitted = (key: PhaseKey) => (submittedByKey.get(key) ?? false) && (milestoneSubmittedByKey.get(key) ?? false);
  const growthUnlocked = growthReviewUnlocked(total > 0 && completed === total, {
    "30": fullySubmitted("30"),
    "60": fullySubmitted("60"),
    "90": fullySubmitted("90"),
  });

  const milestone =
    phase === "180"
      ? null
      : { key: phase, ...PHASE_META[phase], totalTasks: doneByPhase[phase].total, doneTasks: doneByPhase[phase].done };
  const phaseTitle = phase === "180" ? GROWTH_PHASE_META.title : PHASE_META[phase].title;

  const reminderText =
    phase === "180"
      ? "Dear Employee, congratulations on finishing your 90-day checklist! Please complete your 180 Days Growth Review next."
      : (() => {
          const daysLeft = daysRemainingInPhase(phase, employee?.joining_date ?? null);
          return `Dear Employee, please complete your remaining ${phase} days task within ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
        })();

  return (
    <div>
      {variant.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- variant logo path is DB-driven, not a static import next/image can optimize at build time
        <img src={variant.logoUrl} alt={variant.name} className="mb-3 h-8 w-auto object-contain object-left" />
      )}

      <div className="mb-4 mt-0.5 flex items-start justify-between gap-3">
        <div>
          <div className="font-en text-xl font-bold leading-tight text-text">
            আসসালামু আলাইকুম, <b>{firstName}</b>
          </div>
          <div className="mt-1 text-sm font-medium leading-snug text-muted">
            আপনার প্রথম ১৮০ দিনের সম্পূর্ণ পথচলা শুরু হয়েছে।
          </div>
        </div>
        {isMirrorApp && <NotificationBell unreadCount={unreadNotificationCount} />}
      </div>

      <div className="mb-3 rounded-card border border-line bg-card p-4 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="font-en text-[15px] font-semibold text-text">Overall Onboarding Progress</span>
          <span className="font-en text-xl font-extrabold text-green-dark">{pct}%</span>
        </div>
        <div className="my-3 h-2.5 overflow-hidden rounded-lg bg-[#edeff2]">
          <div className="h-full rounded-lg bg-green transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[12.5px] font-medium text-muted">
          Current Phase: <b className="font-bold text-text">{phaseTitle}</b> ·{" "}
          <span>
            {completed}/{total} works
          </span>
        </div>
      </div>

      <div className="mb-3.5 flex items-start gap-2.5 rounded-card border border-[#f0d08a] bg-warn-bg p-3.5 shadow-card">
        <Icon name="bell" size={18} className="mt-0.5 shrink-0 text-warn-tx" />
        <p className="text-[13px] font-semibold leading-snug text-warn-tx">{reminderText}</p>
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div className="rounded-card border border-line bg-card p-3.5 px-4 shadow-card">
          <div className="font-en text-[22px] font-extrabold text-green-dark">{completed}</div>
          <div className="mt-0.5 text-xs font-semibold text-muted">Completed works</div>
        </div>
        <div className="rounded-card border border-line bg-card p-3.5 px-4 shadow-card">
          <div className="font-en text-[22px] font-extrabold text-warn-tx">{total - completed}</div>
          <div className="mt-0.5 text-xs font-semibold text-muted">Pending works</div>
        </div>
      </div>

      <div className="flex items-center gap-3.5 rounded-card border border-[#cde9d5] bg-green-light p-4 shadow-card">
        <div className="h-[58px] w-[58px] shrink-0">
          <Mascot variant="color" mood="happy" />
        </div>
        <div>
          <div className="mb-[3px] flex flex-wrap items-center gap-1.5 font-en text-[15px] font-extrabold text-green-dark">
            OnboardingBuddy{" "}
            <span className="whitespace-nowrap rounded-lg border border-[#cde9d5] bg-white px-1.5 py-0.5 font-en text-[9.5px] font-bold uppercase tracking-[0.04em] text-green-dark">
              AI Guide
            </span>
          </div>
          <p className="text-[12.5px] font-medium leading-snug text-text">
            আমি আপনাকে ধাপে ধাপে onboarding সম্পন্ন করতে সাহায্য করবো।
          </p>
        </div>
      </div>

      <ContinueJourneyButton currentPhase={phase} />
      <ViewWorkListButton variant="primary" />

      {isHrAdmin && (
        <div className="mt-3 flex gap-3">
          <Link
            href="/admin/tasks/new"
            className="flex-1 rounded-button bg-green px-4 py-3.5 text-center font-en text-sm font-bold text-white"
          >
            + Add Task
          </Link>
          <Link
            href="/admin/resources/new"
            className="flex-1 rounded-button bg-green px-4 py-3.5 text-center font-en text-sm font-bold text-white"
          >
            + Add Resource
          </Link>
        </div>
      )}

      {isHrAdmin && isMirrorApp && (
        <Link
          href="/admin/notifications"
          className="mt-3 block rounded-button border border-line bg-card px-4 py-3.5 text-center font-en text-sm font-bold text-text"
        >
          Push Notification
        </Link>
      )}

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">HR Services</div>
      <HrServicesGrid
        managerPhone={employee?.reporting_manager_phone}
        buddyPhone={employee?.buddy_phone}
        buddyAssigned={Boolean(employee?.buddy)}
        showEmployeesCard={Boolean(adminVariantId)}
      />

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">Current Milestone</div>
      {milestone ? (
        <MilestoneCard phase={milestone} />
      ) : (
        <GrowthMilestoneCard phase={{ key: "180", ...GROWTH_PHASE_META, unlocked: growthUnlocked }} />
      )}
    </div>
  );
}

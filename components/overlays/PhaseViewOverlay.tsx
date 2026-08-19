import { Icon } from "@/components/icons/Icon";
import { OverlayShell } from "@/components/overlays/OverlayShell";
import { TaskListRow } from "@/components/overlays/TaskListRow";
import { PHASE_META, PHASE_META_BN, type AssessmentKey, type Contact, type PhaseKey, type Task } from "@/lib/types";

interface PhaseViewOverlayProps {
  phaseKey: PhaseKey;
  /** Non-default (dynamic journey) variants pass their journey's name/sub
   * directly instead of relying on the fixed PHASE_META lookup. */
  title?: string;
  sub?: string;
  /** Dynamic-journey variants have no assessment concept yet — hides the
   * assessment CTA entirely rather than rendering a broken link. */
  hideAssessment?: boolean;
  tasks: Task[];
  contacts: Contact[];
  submitted: boolean;
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenAssessment: (key: AssessmentKey) => void;
  bn?: boolean;
}

export function PhaseViewOverlay({
  phaseKey,
  title,
  sub,
  hideAssessment,
  tasks,
  contacts,
  submitted,
  onBack,
  onOpenTask,
  onOpenAssessment,
  bn: isBn,
}: PhaseViewOverlayProps) {
  const phaseTasks = tasks.filter((t) => t.phase === phaseKey);
  const done = phaseTasks.filter((t) => t.done).length;
  const total = phaseTasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const contactByKey = new Map(contacts.map((c) => [c.key, c]));
  const meta = title !== undefined ? { title, sub: sub ?? "" } : (isBn ? PHASE_META_BN : PHASE_META)[phaseKey];

  return (
    <OverlayShell title={meta.title} subtitle={meta.sub} onBack={onBack} progressPct={pct}>
      {phaseTasks.map((task) => (
        <TaskListRow
          key={task.id}
          task={task}
          contact={contactByKey.get(task.responsibleKey)}
          onClick={() => onOpenTask(task.id)}
          bn={isBn}
        />
      ))}

      {!hideAssessment && (
        <div
          onClick={() => onOpenAssessment(phaseKey as AssessmentKey)}
          className="cursor-pointer rounded-2xl border-[1.5px] border-dashed border-blue bg-blue-light p-3.5 transition-transform active:scale-[0.99]"
        >
          <div className="flex items-start gap-[11px]">
            <div
              className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 border-blue ${
                submitted ? "bg-blue text-white" : "text-blue-dark"
              }`}
            >
              <Icon name={submitted ? "check" : "info"} size={15} />
            </div>
            <div className="flex-1 font-en text-sm font-semibold leading-snug text-blue-dark">
              {isBn
                ? `${phaseKey} দিনের অ্যাসেসমেন্ট ${submitted ? "— সম্পন্ন" : "নিন"}`
                : `${phaseKey} Days Assessment ${submitted ? "— সম্পন্ন" : "নিন"}`}
            </div>
          </div>
          <div className="mt-[9px] flex flex-wrap items-center gap-1.5 pl-[35px]">
            <span className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-en text-[11px] font-semibold text-blue-dark">
              <Icon name="users" size={13} />
              HR / Manager
            </span>
          </div>
        </div>
      )}
    </OverlayShell>
  );
}

import { Icon } from "@/components/icons/Icon";
import { OverlayShell } from "@/components/overlays/OverlayShell";
import { TaskListRow } from "@/components/overlays/TaskListRow";
import { bn } from "@/lib/bn";
import { PHASE_META, PHASE_META_BN, type Contact, type PhaseKey, type Task } from "@/lib/types";

const PHASE_ORDER: PhaseKey[] = ["30", "60", "90"];

interface FullTaskListOverlayProps {
  tasks: Task[];
  contacts: Contact[];
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  bn?: boolean;
}

export function FullTaskListOverlay({ tasks, contacts, onBack, onOpenTask, bn: isBn }: FullTaskListOverlayProps) {
  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const contactByKey = new Map(contacts.map((c) => [c.key, c]));
  const phaseMeta = isBn ? PHASE_META_BN : PHASE_META;

  return (
    <OverlayShell
      title={isBn ? `সম্পূর্ণ ${total}টি কাজের তালিকা` : `Full ${total} Work List`}
      subtitle={`${bn(completed)}/${bn(total)} সম্পন্ন`}
      onBack={onBack}
      progressPct={pct}
    >
      {PHASE_ORDER.map((phase) => (
        <div key={phase}>
          <div className="mb-3 mt-4 flex items-center gap-2 rounded-xl bg-green-light px-3.5 py-2.5 font-en text-[13px] font-bold text-green-dark">
            <Icon name="map" size={16} />
            {phaseMeta[phase].title}
          </div>
          {tasks
            .filter((t) => t.phase === phase)
            .map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                contact={contactByKey.get(task.responsibleKey)}
                onClick={() => onOpenTask(task.id)}
                showManualLink
                bn={isBn}
              />
            ))}
        </div>
      ))}
    </OverlayShell>
  );
}

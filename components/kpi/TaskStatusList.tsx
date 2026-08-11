"use client";

import { useTransition } from "react";
import { StatusIcon } from "@/components/kpi/StatusIcon";
import { bn } from "@/lib/bn";
import { PHASE_META, type PhaseKey } from "@/lib/types";
import { adminSetTaskStatus } from "@/actions/tasks";
import { useRouter } from "next/navigation";

export interface TaskStatusRow {
  id: string;
  workNumber: number;
  phase: PhaseKey;
  title: string;
  done: boolean;
}

const PHASE_ORDER: PhaseKey[] = ["30", "60", "90"];

/** All tasks grouped by phase with icon-only completion status — the same
 * presentation used on the KPI tab's own "KPI 1" section, reused here for a
 * manager viewing a subordinate so both surfaces stay visually consistent.
 * `adminEmployeeEnrollNumber` set (only ever by the SA0001 super-admin
 * account) turns each row into a clickable done/undone toggle. */
export function TaskStatusList({
  tasks,
  adminEmployeeEnrollNumber,
}: {
  tasks: TaskStatusRow[];
  adminEmployeeEnrollNumber?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(taskId: string, done: boolean) {
    if (!adminEmployeeEnrollNumber || isPending) return;
    startTransition(async () => {
      await adminSetTaskStatus(adminEmployeeEnrollNumber, taskId, !done);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {PHASE_ORDER.map((phase) => {
        const phaseTasks = tasks.filter((t) => t.phase === phase);
        if (phaseTasks.length === 0) return null;
        const done = phaseTasks.filter((t) => t.done).length;
        return (
          <div key={phase} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-en text-[13px] font-bold text-text">{PHASE_META[phase].title}</span>
              <span className="font-en text-[12px] font-semibold text-muted">
                {done}/{phaseTasks.length}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {phaseTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5">
                  {adminEmployeeEnrollNumber ? (
                    <button
                      type="button"
                      onClick={() => toggle(t.id, t.done)}
                      disabled={isPending}
                      aria-label={t.done ? "Mark undone (admin)" : "Mark done (admin)"}
                      className="shrink-0 disabled:opacity-50"
                    >
                      <StatusIcon done={t.done} size={18} />
                    </button>
                  ) : (
                    <StatusIcon done={t.done} size={18} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-text">
                    {bn(t.workNumber)}. {t.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

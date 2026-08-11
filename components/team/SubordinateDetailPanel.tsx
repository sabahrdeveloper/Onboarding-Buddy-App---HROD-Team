"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { TaskStatusList, type TaskStatusRow } from "@/components/kpi/TaskStatusList";
import { TicketCard, type HelpRequestRow } from "@/components/team/TicketCard";

export type { HelpRequestRow };

/**
 * Shared subordinate drill-down body — the task list (with the "Filter the
 * help calls" toggle) and the Need Help section. Rendered inside
 * /team/[enrollNumber], which both the Team tab and the KPI tab's subordinate
 * rows link to, so this is genuinely one screen regardless of entry point.
 */
export function SubordinateDetailPanel({
  tasks,
  helpRequests,
  isSuperAdmin,
  employeeEnrollNumber,
}: {
  tasks: TaskStatusRow[];
  helpRequests: HelpRequestRow[];
  isSuperAdmin?: boolean;
  employeeEnrollNumber?: string;
}) {
  const [filterToHelpCalls, setFilterToHelpCalls] = useState(false);

  const taskIdsWithHelp = new Set(
    helpRequests.map((h) => h.relatedTaskId).filter((id): id is string => Boolean(id)),
  );
  const visibleTasks = filterToHelpCalls ? tasks.filter((t) => taskIdsWithHelp.has(t.id)) : tasks;

  return (
    <div>
      <div className="mb-3 mt-[22px] flex items-center justify-between">
        <span className="font-en text-[15px] font-bold text-text">Onboarding Tasks</span>
        <button
          onClick={() => setFilterToHelpCalls((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-en text-[11.5px] font-bold transition-colors ${
            filterToHelpCalls
              ? "border-green bg-green-light text-green-dark"
              : "border-line bg-card text-muted"
          }`}
        >
          <Icon name="help" size={13} />
          Filter the help calls
        </button>
      </div>

      {isSuperAdmin && (
        <p className="mb-2.5 text-[11px] font-semibold text-muted">
          Admin mode: tap any task&apos;s icon to toggle done/undone.
        </p>
      )}
      {filterToHelpCalls && visibleTasks.length === 0 ? (
        <div className="mb-2.5 rounded-card border border-line bg-card p-4 text-center text-[12.5px] font-medium text-muted shadow-card">
          এই কর্মীর কোনো task-এ help request নেই।
        </div>
      ) : (
        <TaskStatusList
          tasks={visibleTasks}
          adminEmployeeEnrollNumber={isSuperAdmin ? employeeEnrollNumber : undefined}
        />
      )}

      <div className="mb-3 mt-[22px] font-en text-[15px] font-bold text-text">Need Help</div>
      {helpRequests.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-4 text-center text-[12.5px] font-medium text-muted shadow-card">
          এই কর্মী এখনো কোনো help request পাঠাননি।
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {helpRequests.map((h) => (
            <TicketCard key={h.id} ticket={h} />
          ))}
        </div>
      )}
    </div>
  );
}

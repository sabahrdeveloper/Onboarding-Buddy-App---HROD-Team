"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

/** Segmented tab control — same pattern as AssessmentOverlay's
 * Assessment/Rating switcher, reused here so "Onboarding KPI" (automatic,
 * task-completion based) and "Employee KPI" (manual, monthly, approval
 * based) read as two views of one screen rather than a bolted-on addition.
 * Initial tab honors ?tab=employee so back-links from the Employee KPI
 * subpages (/employee-kpi/submit, /history, etc.) land back on the same tab
 * instead of always resetting to Onboarding KPI. */
export function KpiSectionTabs({ onboarding, employee }: { onboarding: ReactNode; employee: ReactNode }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "employee" ? "employee" : "onboarding";
  const [tab, setTab] = useState<"onboarding" | "employee">(initialTab);

  return (
    <div>
      <div className="mb-4 flex gap-1.5 rounded-2xl bg-[#edeff2] p-1">
        <button
          onClick={() => setTab("onboarding")}
          className={`flex-1 rounded-xl py-2.5 font-en text-[13px] font-bold transition-colors ${
            tab === "onboarding" ? "bg-card text-text shadow-card" : "text-muted"
          }`}
        >
          Onboarding Score
        </button>
        <button
          onClick={() => setTab("employee")}
          className={`flex-1 rounded-xl py-2.5 font-en text-[13px] font-bold transition-colors ${
            tab === "employee" ? "bg-card text-text shadow-card" : "text-muted"
          }`}
        >
          Employee KPI
        </button>
      </div>

      <div className={tab === "onboarding" ? "" : "hidden"}>{onboarding}</div>
      <div className={tab === "employee" ? "" : "hidden"}>{employee}</div>
    </div>
  );
}

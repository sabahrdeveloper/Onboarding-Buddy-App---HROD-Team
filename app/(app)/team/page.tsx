import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeVariant, getSubordinates, getTasks } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";
import { progressPercent } from "@/lib/business-rules";

export default async function TeamPage() {
  const supabase = await createClient();
  const [{ data: subordinates }, { data: tasks }, variant] = await Promise.all([
    getSubordinates(),
    getTasks(),
    getEmployeeVariant(),
  ]);
  const isBn = variant.navMode === "resources";

  if (!subordinates || subordinates.length === 0) {
    return (
      <div>
        <div className="mb-4 mt-0.5 font-en text-xl font-bold text-text">{isBn ? "টিম" : "Team"}</div>
        <div className="rounded-card border border-line bg-card p-5 text-center shadow-card">
          <p className="text-sm font-medium text-muted">এখনো কোনো subordinate assign করা হয়নি।</p>
        </div>
      </div>
    );
  }

  const enrollNumbers = subordinates.map((s) => s.enroll_number);
  const { data: statuses } = await supabase
    .from("employee_task_status")
    .select("employee_enroll_number, done")
    .in("employee_enroll_number", enrollNumbers);

  const total = tasks?.length ?? 50;
  const doneByEmployee = new Map<string, number>();
  for (const s of statuses ?? []) {
    if (s.done) doneByEmployee.set(s.employee_enroll_number, (doneByEmployee.get(s.employee_enroll_number) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-1 mt-0.5 font-en text-xl font-bold text-text">{isBn ? "টিম" : "Team"}</div>
      <div className="mb-4 text-sm font-medium text-muted">
        {subordinates.length} জন আপনার অধীনে onboarding সম্পন্ন করছেন।
      </div>
      <div className="flex flex-col gap-2.5">
        {subordinates.map((s) => {
          const done = doneByEmployee.get(s.enroll_number) ?? 0;
          const pct = progressPercent(done);
          return (
            <Link
              key={s.enroll_number}
              href={`/team/${s.enroll_number}`}
              className="flex items-center gap-3 rounded-card border border-line bg-card p-3.5 shadow-card transition-transform active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-light font-en text-base font-extrabold text-green-dark">
                {s.name.trim().charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-en text-sm font-bold text-text">{s.name}</div>
                <div className="truncate text-xs font-medium text-muted">
                  {[s.designation, s.department].filter(Boolean).join(" · ") || s.enroll_number}
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-lg bg-[#edeff2]">
                  <div className="h-full rounded-lg bg-green" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="shrink-0 font-en text-sm font-extrabold text-green-dark">
                {done}/{total}
              </div>
              <Icon name="chevronRight" size={18} className="shrink-0 text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

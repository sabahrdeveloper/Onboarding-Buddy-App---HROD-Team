import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminVariantId, getOnboardingVariants, getTasksForVariant } from "@/lib/data/queries";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";
import { isTestEmployee } from "@/lib/test-employees";
import { Icon } from "@/components/icons/Icon";

export default async function EmployeesPage() {
  const adminVariantId = await getAdminVariantId();
  if (!adminVariantId) redirect("/home");

  const supabase = await createClient();
  const [{ data: allEmployees }, { data: variantsData }, { data: tasks }] = await Promise.all([
    supabase.from("employees").select("enroll_number, name, sbu, designation, department"),
    getOnboardingVariants(),
    getTasksForVariant(adminVariantId),
  ]);

  const variants = (variantsData ?? []).map(mapOnboardingVariant);
  const employees = (allEmployees ?? []).filter(
    (e) => resolveVariantForSbu(e.sbu, variants).id === adminVariantId && !isTestEmployee(e.enroll_number),
  );
  const isBn = variants.find((v) => v.id === adminVariantId)?.navMode === "resources";

  // Only this variant's active tasks count — an employee provisioned across
  // two tracks (e.g. Light Engineering's Organization + Sales dual-track)
  // has employee_task_status rows for BOTH variants' tasks, so an unfiltered
  // count here was inflating "done" with the other variant's rows entirely.
  const activeTaskIds = new Set((tasks ?? []).filter((t) => t.active).map((t) => t.id));
  const total = activeTaskIds.size;
  const enrollNumbers = employees.map((e) => e.enroll_number);
  // PostgREST caps a single select at 1000 rows — with ~25 employees x up to
  // 64 task rows each (dual-track variants), this list was silently
  // truncating and undercounting completion for whoever fell past row 1000.
  // Paged until exhausted so growth in either dimension can't reintroduce it.
  const statuses: { employee_enroll_number: string; task_id: string; done: boolean }[] = [];
  if (enrollNumbers.length > 0) {
    const PAGE_SIZE = 1000;
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page } = await supabase
        .from("employee_task_status")
        .select("employee_enroll_number, task_id, done")
        .in("employee_enroll_number", enrollNumbers)
        .range(from, from + PAGE_SIZE - 1);
      if (!page || page.length === 0) break;
      statuses.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
  }

  const doneByEmployee = new Map<string, number>();
  for (const s of statuses ?? []) {
    if (s.done && activeTaskIds.has(s.task_id)) {
      doneByEmployee.set(s.employee_enroll_number, (doneByEmployee.get(s.employee_enroll_number) ?? 0) + 1);
    }
  }

  return (
    <div>
      <div className="mb-1 mt-0.5 font-en text-xl font-bold text-text">{isBn ? "কর্মীরা" : "Employees"}</div>
      <div className="mb-4 text-sm font-medium text-muted">{employees.length} জন এই variant-এ onboarding করছেন।</div>

      {employees.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center shadow-card">
          <p className="text-sm font-medium text-muted">এখনো কোনো employee নেই।</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {employees.map((e) => {
            const done = doneByEmployee.get(e.enroll_number) ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={e.enroll_number}
                href={`/employees/${e.enroll_number}`}
                className="flex items-center gap-3 rounded-card border border-line bg-card p-3.5 shadow-card transition-transform active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-light font-en text-base font-extrabold text-green-dark">
                  {e.name.trim().charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-en text-sm font-bold text-text">{e.name}</div>
                  <div className="truncate text-xs font-medium text-muted">
                    {[e.designation, e.department].filter(Boolean).join(" · ") || e.enroll_number}
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
      )}
    </div>
  );
}

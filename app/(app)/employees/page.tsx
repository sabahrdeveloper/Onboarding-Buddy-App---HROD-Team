import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminVariantId, getOnboardingVariants, getTasksForVariant } from "@/lib/data/queries";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";
import { Icon } from "@/components/icons/Icon";
import { progressPercent } from "@/lib/business-rules";

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
    (e) => resolveVariantForSbu(e.sbu, variants).id === adminVariantId,
  );

  const total = tasks?.length ?? 0;
  const enrollNumbers = employees.map((e) => e.enroll_number);
  const { data: statuses } =
    enrollNumbers.length > 0
      ? await supabase
          .from("employee_task_status")
          .select("employee_enroll_number, done")
          .in("employee_enroll_number", enrollNumbers)
      : { data: [] };

  const doneByEmployee = new Map<string, number>();
  for (const s of statuses ?? []) {
    if (s.done) doneByEmployee.set(s.employee_enroll_number, (doneByEmployee.get(s.employee_enroll_number) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-1 mt-0.5 font-en text-xl font-bold text-text">Employees</div>
      <div className="mb-4 text-sm font-medium text-muted">{employees.length} জন এই variant-এ onboarding করছেন।</div>

      {employees.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center shadow-card">
          <p className="text-sm font-medium text-muted">এখনো কোনো employee নেই।</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {employees.map((e) => {
            const done = doneByEmployee.get(e.enroll_number) ?? 0;
            const pct = progressPercent(done);
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

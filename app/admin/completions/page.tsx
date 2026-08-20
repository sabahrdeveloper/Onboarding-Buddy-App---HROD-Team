import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markCompletionRead } from "@/actions/admin-completions";
import { getOnboardingVariants } from "@/lib/data/queries";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";
import { isTestEmployee } from "@/lib/test-employees";

export default async function AdminCompletionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const [{ data: notifications }, { data: journeys }, { data: allEmployees }, { data: variantsData }] = await Promise.all([
    supabase
      .from("hr_journey_completion_notifications")
      .select("*")
      .eq("variant_id", profile.admin_variant_id)
      .order("created_at", { ascending: false }),
    supabase.from("onboarding_phases").select("id, name").eq("variant_id", profile.admin_variant_id),
    supabase.from("employees").select("enroll_number, name, designation, sbu"),
    getOnboardingVariants(),
  ]);

  const variants = (variantsData ?? []).map(mapOnboardingVariant);
  const journeyNameById = new Map((journeys ?? []).map((j) => [j.id, j.name]));
  const employeeByEnroll = new Map(
    (allEmployees ?? [])
      .filter((e) => resolveVariantForSbu(e.sbu, variants).id === profile.admin_variant_id)
      .map((e) => [e.enroll_number, e]),
  );

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Journey Completions</div>
      <div className="flex flex-col gap-2">
        {(notifications ?? [])
          .filter((n) => !isTestEmployee(n.employee_enroll_number))
          .map((n) => {
          const emp = employeeByEnroll.get(n.employee_enroll_number);
          return (
            <div key={n.id} className={`rounded-card border p-3.5 shadow-card ${n.is_read ? "border-line bg-card" : "border-[#cde9d5] bg-[#fafdf9]"}`}>
              <div className="text-[13.5px] font-bold text-text">{emp?.name ?? n.employee_enroll_number}</div>
              <div className="text-[12px] font-medium text-muted">
                {n.employee_enroll_number} · {emp?.designation ?? "—"}
              </div>
              <div className="mt-1 text-[12.5px] font-medium text-text">
                Completed: {journeyNameById.get(n.journey_id) ?? "Unknown journey"}
              </div>
              <div className="mt-1 text-[11px] font-medium text-muted">{new Date(n.created_at).toLocaleString()}</div>
              {!n.is_read && (
                <form
                  action={async () => {
                    "use server";
                    await markCompletionRead(n.id);
                  }}
                  className="mt-2"
                >
                  <button type="submit" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text">
                    Mark Read
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {(notifications ?? []).filter((n) => !isTestEmployee(n.employee_enroll_number)).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            No journey completions yet.
          </div>
        )}
      </div>
    </div>
  );
}

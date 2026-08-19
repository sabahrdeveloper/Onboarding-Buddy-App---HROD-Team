import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleJourneyActive } from "@/actions/admin-journeys";

export default async function AdminJourneysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const [{ data: journeys }, { data: tasks }] = await Promise.all([
    supabase.from("onboarding_phases").select("*").eq("variant_id", profile.admin_variant_id).order("sequence"),
    supabase.from("onboarding_tasks").select("id, phase").eq("variant_id", profile.admin_variant_id),
  ]);

  const taskCountByJourney = new Map<string, number>();
  for (const t of tasks ?? []) {
    taskCountByJourney.set(t.phase, (taskCountByJourney.get(t.phase) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-en text-[15px] font-bold text-text">Journeys ({journeys?.length ?? 0})</div>
        <Link href="/admin/journeys/new" className="rounded-lg bg-green px-3 py-1.5 font-en text-[13px] font-bold text-white">
          + Add Journey
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {(journeys ?? []).map((journey) => (
          <div key={journey.id} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-bold text-text">{journey.name}</div>
                <div className="text-[12px] font-medium text-muted">
                  Sequence {journey.sequence} · {taskCountByJourney.get(journey.id) ?? 0} tasks
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  journey.active ? "bg-ok-bg text-ok-tx" : "bg-[#f0f1f3] text-muted"
                }`}
              >
                {journey.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Link
                href={`/admin/journeys/${journey.id}/edit`}
                className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text"
              >
                Rename
              </Link>
              <form
                action={async () => {
                  "use server";
                  await toggleJourneyActive(journey.id, !journey.active);
                }}
              >
                <button type="submit" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text">
                  {journey.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          </div>
        ))}
        {(journeys ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            No journeys yet.
          </div>
        )}
      </div>
    </div>
  );
}

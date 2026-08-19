import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteIssueType, toggleIssueTypeActive } from "@/actions/admin-issue-types";

export default async function AdminIssueTypesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: issueTypes } = await supabase
    .from("help_issue_types")
    .select("*")
    .eq("variant_id", profile.admin_variant_id)
    .order("sequence");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-en text-[15px] font-bold text-text">Issue Types ({issueTypes?.length ?? 0})</div>
        <Link href="/admin/issue-types/new" className="rounded-lg bg-green px-3 py-1.5 font-en text-[13px] font-bold text-white">
          + Add Issue Type
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {(issueTypes ?? []).map((issueType) => (
          <div key={issueType.id} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted">
                  Routes to {issueType.assigned_team.toUpperCase()}
                </div>
                <div className="truncate text-[13.5px] font-bold text-text">{issueType.label}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  issueType.active ? "bg-ok-bg text-ok-tx" : "bg-[#f0f1f3] text-muted"
                }`}
              >
                {issueType.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Link
                href={`/admin/issue-types/${issueType.id}/edit`}
                className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text"
              >
                Edit
              </Link>
              <form
                action={async () => {
                  "use server";
                  await toggleIssueTypeActive(issueType.id, !issueType.active);
                }}
              >
                <button type="submit" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text">
                  {issueType.active ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteIssueType(issueType.id);
                }}
              >
                <button type="submit" className="rounded-lg border border-[#f1b4b6] px-2.5 py-1 text-[12px] font-semibold text-err-tx">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {(issueTypes ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            No issue types yet — employees will see an empty dropdown on Help Calls until you add some.
          </div>
        )}
      </div>
    </div>
  );
}

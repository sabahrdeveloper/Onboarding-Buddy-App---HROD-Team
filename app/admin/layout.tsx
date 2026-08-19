import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_hr_admin, admin_variant_id")
    .eq("id", user.id)
    .single();
  if (!profile?.is_hr_admin || !profile.admin_variant_id) redirect("/home");

  const { data: variant } = await supabase
    .from("onboarding_variants")
    .select("name, nav_mode, is_default")
    .eq("id", profile.admin_variant_id)
    .single();

  return (
    <div className="px-4 pb-8 pt-4">
      <div className="mb-4">
        <div className="font-en text-lg font-extrabold text-text">HR Admin Panel</div>
        <div className="text-[13px] font-medium text-muted">{variant?.name ?? "Unknown variant"}</div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-line pb-3">
        <Link
          href="/admin/tasks"
          className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
        >
          Tasks
        </Link>
        <Link
          href="/admin/resources"
          className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
        >
          Resources
        </Link>
        <Link
          href="/admin/contacts"
          className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
        >
          Contacts
        </Link>
        <Link
          href="/admin/issue-types"
          className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
        >
          Issue Types
        </Link>
        {variant?.is_default === false && (
          <Link
            href="/admin/journeys"
            className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
          >
            Journeys
          </Link>
        )}
        {variant?.is_default === false && (
          <Link
            href="/admin/assessments"
            className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
          >
            Assessments
          </Link>
        )}
        {variant?.is_default === false && (
          <Link
            href="/admin/completions"
            className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
          >
            Completions
          </Link>
        )}
        {variant?.nav_mode === "resources" && (
          <Link
            href="/admin/notifications"
            className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text"
          >
            Notifications
          </Link>
        )}
        <Link href="/home" className="ml-auto rounded-lg px-3 py-1.5 font-en text-[13px] font-semibold text-muted">
          Exit
        </Link>
      </div>
      {children}
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IssueTypeForm } from "@/components/admin/IssueTypeForm";
import { updateIssueType } from "@/actions/admin-issue-types";

export default async function EditIssueTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: issueType } = await supabase
    .from("help_issue_types")
    .select("*")
    .eq("id", id)
    .eq("variant_id", profile.admin_variant_id)
    .single();
  if (!issueType) notFound();

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Edit Issue Type</div>
      <IssueTypeForm action={updateIssueType.bind(null, id)} initial={issueType} submitLabel="Save Changes" />
    </div>
  );
}

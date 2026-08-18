import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResourceLinkForm } from "@/components/admin/ResourceLinkForm";
import { updateResourceLink } from "@/actions/admin-resources";

export default async function EditResourceLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: link } = await supabase
    .from("resource_links")
    .select("*")
    .eq("id", id)
    .eq("variant_id", profile.admin_variant_id)
    .single();
  if (!link) notFound();

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Edit Resource</div>
      <ResourceLinkForm action={updateResourceLink.bind(null, id)} initial={link} submitLabel="Save Changes" />
    </div>
  );
}

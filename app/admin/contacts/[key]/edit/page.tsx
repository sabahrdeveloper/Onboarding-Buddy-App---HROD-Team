import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/admin/ContactForm";
import { updateContact } from "@/actions/admin-contacts";

export default async function EditContactPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("key", key)
    .eq("variant_id", profile.admin_variant_id)
    .single();
  if (!contact) notFound();

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Edit Contact</div>
      <ContactForm action={updateContact.bind(null, key)} initial={contact} submitLabel="Save Changes" />
    </div>
  );
}

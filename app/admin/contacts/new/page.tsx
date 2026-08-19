import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/admin/ContactForm";
import { createContact } from "@/actions/admin-contacts";
import { CONTACT_KEYS } from "@/lib/contact-keys";

export default async function NewContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: existing } = await supabase.from("contacts").select("key").eq("variant_id", profile.admin_variant_id);
  const takenKeys = new Set((existing ?? []).map((c) => c.key));
  const availableKeys = CONTACT_KEYS.filter((k) => !takenKeys.has(k));
  if (availableKeys.length === 0) redirect("/admin/contacts");

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Contact</div>
      <ContactForm action={createContact} availableKeys={availableKeys} submitLabel="Create Contact" />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteContact, toggleContactActive, CONTACT_KEYS } from "@/actions/admin-contacts";

export default async function AdminContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("variant_id", profile.admin_variant_id)
    .order("key");

  const missingKeys = CONTACT_KEYS.filter((k) => !(contacts ?? []).some((c) => c.key === k));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-en text-[15px] font-bold text-text">Contacts ({contacts?.length ?? 0})</div>
        {missingKeys.length > 0 && (
          <Link href="/admin/contacts/new" className="rounded-lg bg-green px-3 py-1.5 font-en text-[13px] font-bold text-white">
            + Add Contact
          </Link>
        )}
      </div>

      {missingKeys.length > 0 && (
        <div className="mb-3 rounded-card border border-[#f0d08a] bg-warn-bg p-3 text-[12.5px] font-medium text-warn-tx">
          Missing: {missingKeys.join(", ")} — employees see nothing for these until added.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(contacts ?? []).map((contact) => (
          <div key={contact.key} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{contact.key}</div>
                <div className="truncate text-[13.5px] font-bold text-text">{contact.name}</div>
                <div className="truncate text-[12px] font-medium text-muted">
                  {contact.role} · {contact.phone}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  contact.active ? "bg-ok-bg text-ok-tx" : "bg-[#f0f1f3] text-muted"
                }`}
              >
                {contact.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Link
                href={`/admin/contacts/${contact.key}/edit`}
                className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text"
              >
                Edit
              </Link>
              <form
                action={async () => {
                  "use server";
                  await toggleContactActive(contact.key, !contact.active);
                }}
              >
                <button type="submit" className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-text">
                  {contact.active ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteContact(contact.key);
                }}
              >
                <button type="submit" className="rounded-lg border border-[#f1b4b6] px-2.5 py-1 text-[12px] font-semibold text-err-tx">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {(contacts ?? []).length === 0 && (
          <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
            No contacts yet.
          </div>
        )}
      </div>
    </div>
  );
}

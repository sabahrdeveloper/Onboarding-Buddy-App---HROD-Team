import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeNotificationForm } from "@/components/admin/EmployeeNotificationForm";
import { sendNotificationToAll } from "@/actions/admin-notifications";

const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: variant } = await supabase
    .from("onboarding_variants")
    .select("nav_mode")
    .eq("id", profile.admin_variant_id)
    .single();
  if (variant?.nav_mode !== "resources") redirect("/admin/tasks");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-3 font-en text-[15px] font-bold text-text">Notify All</div>
        <form
          action={async (formData: FormData) => {
            "use server";
            await sendNotificationToAll(formData);
          }}
          className="flex flex-col gap-3.5"
        >
          <input name="title" placeholder="Title (optional)" className={inputClass} />
          <textarea name="body" placeholder="Message" rows={3} required className={inputClass} />
          <button type="submit" className="rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white">
            Send to Everyone
          </button>
        </form>
      </div>

      <div className="border-t border-line pt-6">
        <div className="mb-3 font-en text-[15px] font-bold text-text">Notify Employee</div>
        <EmployeeNotificationForm />
      </div>
    </div>
  );
}

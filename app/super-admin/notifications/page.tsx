import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingVariants } from "@/lib/data/queries";
import { SuperAdminNotificationComposer } from "@/components/admin/SuperAdminNotificationComposer";

export default async function SuperAdminNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) redirect("/home");

  const { data: variantsData } = await getOnboardingVariants();
  const variants = (variantsData ?? []).map((v) => ({ id: v.id, name: v.name }));

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 font-en text-lg font-extrabold text-text">Broadcast Notification</div>
      <SuperAdminNotificationComposer variants={variants} />
    </div>
  );
}

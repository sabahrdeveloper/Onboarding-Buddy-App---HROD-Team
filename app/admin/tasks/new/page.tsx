import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/admin/TaskForm";
import { createTask } from "@/actions/admin-tasks";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: variant } = await supabase
    .from("onboarding_variants")
    .select("is_default")
    .eq("id", profile.admin_variant_id)
    .single();

  const { data: phases } = variant?.is_default
    ? { data: null }
    : await supabase.from("onboarding_phases").select("id, name").eq("variant_id", profile.admin_variant_id).order("sequence");

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Task</div>
      <TaskForm action={createTask} submitLabel="Create Task" phases={phases ?? undefined} />
    </div>
  );
}

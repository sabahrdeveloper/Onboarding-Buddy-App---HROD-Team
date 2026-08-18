import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/admin/TaskForm";
import { updateTask } from "@/actions/admin-tasks";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: task } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .eq("id", id)
    .eq("variant_id", profile.admin_variant_id)
    .single();
  if (!task) notFound();

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Edit Task</div>
      <TaskForm action={updateTask.bind(null, id)} initial={task} submitLabel="Save Changes" />
    </div>
  );
}

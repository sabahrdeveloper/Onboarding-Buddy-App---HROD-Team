import { TaskForm } from "@/components/admin/TaskForm";
import { createTask } from "@/actions/admin-tasks";

export default function NewTaskPage() {
  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Task</div>
      <TaskForm action={createTask} submitLabel="Create Task" />
    </div>
  );
}

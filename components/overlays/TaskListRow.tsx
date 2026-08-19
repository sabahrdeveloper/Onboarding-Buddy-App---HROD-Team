import { Icon, type IconName } from "@/components/icons/Icon";
import { bn } from "@/lib/bn";
import type { Contact, Task } from "@/lib/types";

interface TaskListRowProps {
  task: Task;
  contact: Contact | undefined;
  onClick: () => void;
  showManualLink?: boolean;
  bn?: boolean;
}

export function TaskListRow({ task, contact, onClick, showManualLink = false, bn: isBn }: TaskListRowProps) {
  return (
    <div
      onClick={onClick}
      className={`mb-[11px] cursor-pointer rounded-2xl border p-3.5 shadow-card transition-transform active:scale-[0.99] ${
        task.done ? "border-[#d6eebd] bg-[#fafdf9]" : "border-line bg-card"
      }`}
    >
      <div className="flex items-start gap-[11px]">
        <div
          className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 ${
            task.done ? "border-green bg-green text-white" : "border-line text-transparent"
          }`}
        >
          <Icon name="check" size={15} />
        </div>
        <div className="flex-1 font-en text-sm font-semibold leading-snug text-text">
          {bn(task.workNumber)}. {task.title}
        </div>
      </div>
      <div className="mt-[9px] flex flex-wrap items-center gap-1.5 pl-[35px]">
        <span className="flex items-center gap-1 rounded-lg bg-[#f0f1f3] px-2.5 py-1 font-en text-[11px] font-semibold text-muted">
          <Icon name="clock" size={13} />
          {task.timeline}
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-blue-light px-2.5 py-1 font-en text-[11px] font-semibold text-blue-dark">
          {contact && <Icon name={contact.icon as IconName} size={13} />}
          {task.responsibleRole}
        </span>
        <span
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-en text-[11px] font-semibold ${
            task.done ? "bg-ok-bg text-ok-tx" : "bg-warn-bg text-warn-tx"
          }`}
        >
          {task.done && <Icon name="check" size={12} />}
          {task.done ? (isBn ? "সম্পন্ন" : "Done") : isBn ? "বাকি" : "Pending"}
        </span>
        {showManualLink && (
          <span className="ml-auto flex items-center gap-[3px] font-en text-[11px] font-bold text-green-dark">
            {isBn ? "ম্যানুয়াল" : "Manual"}
            <Icon name="arrowRight" size={13} />
          </span>
        )}
      </div>
    </div>
  );
}

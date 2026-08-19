import { Icon, type IconName } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";
import { OverlayShell } from "@/components/overlays/OverlayShell";
import { bn } from "@/lib/bn";
import type { ContactActionInfo } from "@/lib/contact-actions";
import type { Contact, Task } from "@/lib/types";

type ContactActionType = "call" | "whatsapp" | "message";

interface TaskManualOverlayProps {
  task: Task;
  /** One entry per assignee — tasks can now have multiple owners (e.g. HRBP + IT). */
  contacts: Contact[];
  onBack: () => void;
  onMarkDone: () => void;
  onNeedHelp: () => void;
  onContactAction: (type: ContactActionType, info: ContactActionInfo) => void;
  pending: boolean;
  bn?: boolean;
}

export function TaskManualOverlay({
  task,
  contacts,
  onBack,
  onMarkDone,
  onNeedHelp,
  onContactAction,
  pending,
  bn: isBn,
}: TaskManualOverlayProps) {
  const question = task.confirmQuestion || "চলুন এই কাজটি সম্পন্ন করি।";
  const primaryContact = contacts[0];

  return (
    <OverlayShell
      title={`${bn(task.workNumber)}. ${task.title}`}
      subtitle={`${task.timeline} · ${task.responsibleRole}`}
      onBack={onBack}
      footer={
        task.done ? (
          <div className="flex gap-2.5">
            <button
              onClick={onNeedHelp}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-input border border-line bg-card py-3.5 font-en text-sm font-bold text-text shadow-card"
            >
              <Icon name="help" size={16} />
              {isBn ? "সাহায্য দরকার" : "Need Help"}
            </button>
            <button
              disabled
              className="flex flex-1 items-center justify-center gap-2 rounded-input bg-green px-4 py-3.5 font-en text-sm font-bold text-white opacity-60"
            >
              <Icon name="check" size={18} />
              সম্পন্ন হয়েছে
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={onMarkDone}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              <Icon name="check" size={18} />
              {isBn ? "হ্যাঁ, সম্পন্ন হিসেবে চিহ্নিত করুন" : "Yes, Mark as Done"}
            </button>
            <div className="mt-2.5 flex gap-2.5">
              <button
                onClick={() => primaryContact && onContactAction("call", primaryContact)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-input border border-line bg-card py-3.5 font-en text-sm font-bold text-text shadow-card"
              >
                <Icon name="phone" size={16} />
                {isBn ? "যোগাযোগ" : "Contact"}
              </button>
              <button
                onClick={onNeedHelp}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-input border border-line bg-card py-3.5 font-en text-sm font-bold text-text shadow-card"
              >
                <Icon name="help" size={16} />
                {isBn ? "সাহায্য দরকার" : "Need Help"}
              </button>
            </div>
          </div>
        )
      }
    >
      <div className="mb-4 mt-0.5 flex items-start gap-3">
        <div className="h-[50px] w-[50px] shrink-0">
          <Mascot variant="color" mood={task.done ? "success" : "happy"} />
        </div>
        <div className="rounded-[4px_16px_16px_16px] border border-line bg-card px-[15px] py-[13px] shadow-card">
          <div className="font-en text-[14.5px] font-semibold leading-[1.45] text-text">{question}</div>
        </div>
      </div>

      {contacts.map((contact) => (
        <div key={contact.key} className="mb-3.5 rounded-2xl border border-line bg-card p-3.5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-green-light text-green-dark">
              <Icon name={contact.icon as IconName} size={22} />
            </div>
            <div>
              <div className="font-en text-sm font-extrabold text-text">{contact.name}</div>
              <div className="text-xs font-medium text-muted">{contact.role}</div>
              <div className="mt-0.5 flex items-center gap-1 font-en text-[12.5px] font-bold text-blue-dark">
                <Icon name="phone" size={13} />
                {contact.phone}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onContactAction("call", contact)}
              disabled={!contact.phone}
              className="flex flex-1 flex-col items-center gap-[5px] rounded-xl bg-green-light py-[11px] font-en text-[11.5px] font-bold text-green-dark transition-transform active:scale-[0.97] disabled:opacity-40"
            >
              <Icon name="phone" size={18} />
              {isBn ? "কল" : "Call"}
            </button>
            <button
              onClick={() => onContactAction("whatsapp", contact)}
              disabled={!contact.phone}
              className="flex flex-1 flex-col items-center gap-[5px] rounded-xl bg-ok-bg py-[11px] font-en text-[11.5px] font-bold text-ok-tx transition-transform active:scale-[0.97] disabled:opacity-40"
            >
              <Icon name="message" size={18} />
              WhatsApp
            </button>
            <button
              onClick={() => onContactAction("message", contact)}
              disabled={!contact.email}
              className="flex flex-1 flex-col items-center gap-[5px] rounded-xl bg-blue-light py-[11px] font-en text-[11.5px] font-bold text-blue-dark transition-transform active:scale-[0.97] disabled:opacity-40"
            >
              <Icon name="mail" size={18} />
              {isBn ? "মেসেজ" : "Message"}
            </button>
          </div>
        </div>
      ))}

      <div className="mb-3.5 rounded-[14px] border border-[#cde9d5] bg-green-light p-3.5 text-[13.5px] font-medium leading-[1.55] text-[#2f5238]">
        <span className="mb-1.5 flex items-center gap-1.5 font-en text-[11px] font-bold uppercase tracking-[0.03em] opacity-85">
          <Icon name="info" size={13} />
          কেন গুরুত্বপূর্ণ
        </span>
        {task.whyText}
      </div>

      <div className="mb-3 mt-2 font-en text-xs font-bold uppercase tracking-[0.03em] text-muted">
        {isBn ? "যেভাবে সম্পন্ন করবেন — ম্যানুয়াল" : "How to Complete — Manual"}
      </div>
      {task.howToSteps.map((step, i) => (
        <div key={i} className="mb-[11px] flex items-start gap-3">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-green-light font-en text-xs font-extrabold text-green-dark">
            {bn(i + 1)}
          </div>
          <div className="pt-0.5 text-[13.5px] font-medium leading-[1.45] text-text">{step}</div>
        </div>
      ))}
    </OverlayShell>
  );
}

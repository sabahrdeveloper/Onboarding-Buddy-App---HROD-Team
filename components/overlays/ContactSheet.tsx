import { Icon, type IconName } from "@/components/icons/Icon";
import type { ContactActionInfo } from "@/lib/contact-actions";
import type { Contact } from "@/lib/types";

type ContactActionType = "call" | "whatsapp" | "message";

interface ContactSheetProps {
  contact: Contact;
  onClose: () => void;
  onContactAction: (type: ContactActionType, info: ContactActionInfo) => void;
  onRequestHelp: () => void;
  onViewContactList?: () => void;
}

const CONTACT_LIST_LABEL: Record<string, string> = {
  hr: "HR Contact List",
  it: "IT Contact List",
};

export function ContactSheet({ contact, onClose, onContactAction, onRequestHelp, onViewContactList }: ContactSheetProps) {
  const contactListLabel = CONTACT_LIST_LABEL[contact.key];
  return (
    <div
      className="fixed inset-0 z-[88] flex items-end bg-[rgba(31,41,55,.45)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full rounded-t-[28px] bg-card px-[18px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-2 shadow-modal">
        <div className="mx-auto mb-4 mt-2 h-[5px] w-11 rounded-[3px] bg-line" />

        <div className="flex items-center gap-3">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] bg-green-light text-green-dark">
            <Icon name={contact.icon as IconName} size={26} />
          </div>
          <div>
            <div className="font-en text-base font-extrabold text-text">{contact.name}</div>
            <div className="text-xs font-medium text-muted">{contact.role}</div>
            <div className="mt-0.5 flex items-center gap-1 font-en text-[15px] font-bold text-blue-dark">
              <Icon name="phone" size={14} />
              {contact.phone}
            </div>
            {contact.email && (
              <div className="mt-0.5 flex items-center gap-1 font-en text-[12.5px] font-semibold text-muted">
                <Icon name="mail" size={13} />
                {contact.email}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onContactAction("call", contact)}
            disabled={!contact.phone}
            className="flex flex-1 flex-col items-center gap-[5px] rounded-xl bg-green-light py-[11px] font-en text-[11.5px] font-bold text-green-dark transition-transform active:scale-[0.97] disabled:opacity-40"
          >
            <Icon name="phone" size={18} />
            Call
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
            Message
          </button>
          {contactListLabel && (
            <button
              onClick={onViewContactList}
              className="flex flex-1 flex-col items-center gap-[5px] rounded-xl bg-warn-bg py-[11px] font-en text-[11.5px] font-bold text-warn-tx transition-transform active:scale-[0.97]"
            >
              <Icon name="list" size={18} />
              {contactListLabel}
            </button>
          )}
        </div>

        <button
          onClick={onRequestHelp}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-input border border-line bg-card py-3.5 font-en text-sm font-bold text-text shadow-card"
        >
          <Icon name="help" size={16} />
          Request Help Form
        </button>
      </div>
    </div>
  );
}

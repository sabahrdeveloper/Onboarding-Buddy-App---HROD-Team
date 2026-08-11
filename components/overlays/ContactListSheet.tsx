import { Icon } from "@/components/icons/Icon";
import type { ContactListEntry } from "@/lib/contact-lists";
import type { ContactActionInfo } from "@/lib/contact-actions";

interface ContactListSheetProps {
  title: string;
  entries: ContactListEntry[];
  onClose: () => void;
  onContactAction: (type: "call" | "message", info: ContactActionInfo) => void;
}

export function ContactListSheet({ title, entries, onClose, onContactAction }: ContactListSheetProps) {
  return (
    <div
      className="fixed inset-0 z-[89] flex items-end bg-[rgba(31,41,55,.45)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[80vh] w-full flex-col rounded-t-[28px] bg-card pb-[calc(20px+env(safe-area-inset-bottom))] pt-2 shadow-modal">
        <div className="mx-auto mb-3 h-[5px] w-11 shrink-0 rounded-[3px] bg-line" />
        <div className="mb-3 flex shrink-0 items-center justify-between px-[18px]">
          <div className="font-en text-base font-extrabold text-text">{title}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-muted"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[18px]">
          {entries.length === 0 ? (
            <p className="py-6 text-center text-[13px] font-medium text-muted">তালিকাটি শীঘ্রই যুক্ত হবে</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.email ?? entry.name}
                className="mb-2.5 rounded-[16px] border border-line bg-bg px-4 py-3.5 last:mb-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-en text-sm font-bold text-text">{entry.name}</div>
                  <div className="max-w-[45%] text-right text-[11px] font-medium leading-snug text-muted">
                    {entry.sbu}
                  </div>
                </div>
                {entry.phone && (
                  <div className="mt-0.5 flex items-center gap-1 font-en text-[13px] font-semibold text-blue-dark">
                    <Icon name="phone" size={13} />
                    {entry.phone}
                  </div>
                )}
                {entry.email && (
                  <div className="mt-0.5 flex items-center gap-1 font-en text-[12px] font-medium text-muted">
                    <Icon name="mail" size={12} />
                    {entry.email}
                  </div>
                )}
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => onContactAction("call", entry)}
                    disabled={!entry.phone}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-light py-2 font-en text-[12px] font-bold text-green-dark transition-transform active:scale-[0.97] disabled:opacity-40"
                  >
                    <Icon name="phone" size={14} />
                    Call
                  </button>
                  <button
                    onClick={() => onContactAction("message", entry)}
                    disabled={!entry.email}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-light py-2 font-en text-[12px] font-bold text-blue-dark transition-transform active:scale-[0.97] disabled:opacity-40"
                  >
                    <Icon name="mail" size={14} />
                    Message
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

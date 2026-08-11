import { Icon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";

export interface TicketInfo {
  ticketId: string;
  status: string;
  assignedTo: string;
}

export interface SuccessModalState {
  title: string;
  message: string;
  ticket?: TicketInfo;
  secondaryLabel?: string;
}

interface SuccessModalProps extends SuccessModalState {
  onHome: () => void;
  onViewJourney: () => void;
}

export function SuccessModal({ title, message, ticket, secondaryLabel, onHome, onViewJourney }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(31,41,55,.45)] p-6">
      <div className="w-full max-w-[340px] rounded-modal bg-card px-6 pb-6 pt-[30px] text-center shadow-modal">
        <div className="mx-auto mb-2 h-24 w-24">
          <Mascot variant="color" mood="success" />
        </div>
        <h2 className="my-1.5 font-en text-xl font-extrabold text-text">{title}</h2>
        <p className="mb-[18px] text-sm font-medium leading-[1.55] text-muted">{message}</p>

        {ticket && (
          <div className="mb-4 rounded-[14px] border border-[#cbddfb] bg-blue-light p-3.5 text-left">
            <div className="flex items-center gap-[7px] font-en text-sm font-extrabold text-blue-dark">
              <Icon name="ticket" size={16} />
              Ticket Created
            </div>
            <div className="mt-2 flex justify-between text-[13px]">
              <span className="text-muted">Ticket ID</span>
              <span className="font-en font-bold text-text">{ticket.ticketId}</span>
            </div>
            <div className="mt-2 flex justify-between text-[13px]">
              <span className="text-muted">Status</span>
              <span className="font-en font-bold text-warn-tx">{ticket.status}</span>
            </div>
            <div className="mt-2 flex justify-between text-[13px]">
              <span className="text-muted">Assigned To</span>
              <span className="font-en font-bold text-text">{ticket.assignedTo}</span>
            </div>
          </div>
        )}

        <button
          onClick={onHome}
          className="mb-2.5 flex w-full items-center justify-center rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98]"
        >
          Back to Home
        </button>
        <button
          onClick={onViewJourney}
          className="flex w-full items-center justify-center rounded-button border border-line bg-card px-4 py-3.5 font-en text-sm font-bold text-text shadow-card transition-transform active:scale-[0.98]"
        >
          {secondaryLabel ?? "View Journey"}
        </button>
      </div>
    </div>
  );
}

import { Icon } from "@/components/icons/Icon";

export interface HelpRequestRow {
  id: string;
  ticketId: string;
  relatedTaskId: string | null;
  taskTitle: string | null;
  issueType: string;
  description: string;
  status: string;
  createdAt: string;
  /** Who submitted it — only shown when a list can contain more than one
   * person's tickets (e.g. a manager's or HR/IT's "directed to me" queue). */
  employeeName?: string;
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-warn-bg text-warn-tx",
  resolved: "bg-ok-bg text-ok-tx",
};

export function formatTicketDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** One help-request ticket, read-only. Shared by the manager's subordinate
 * detail view and the Help Calls screen so both look and behave the same. */
export function TicketCard({ ticket }: { ticket: HelpRequestRow }) {
  return (
    <div className="rounded-card border border-line bg-card p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {ticket.employeeName && (
            <div className="mb-0.5 truncate font-en text-[11.5px] font-bold text-green-dark">{ticket.employeeName}</div>
          )}
          <div className="font-en text-[13px] font-bold text-text">{ticket.issueType}</div>
          {ticket.taskTitle && (
            <div className="mt-0.5 truncate text-[11.5px] font-medium text-muted">Task: {ticket.taskTitle}</div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-en text-[10.5px] font-bold capitalize ${
            STATUS_STYLE[ticket.status] ?? "bg-[#f0f1f3] text-muted"
          }`}
        >
          {ticket.status}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] font-medium leading-snug text-text">{ticket.description}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        <Icon name="clock" size={12} />
        {formatTicketDate(ticket.createdAt)} · {ticket.ticketId}
      </div>
    </div>
  );
}

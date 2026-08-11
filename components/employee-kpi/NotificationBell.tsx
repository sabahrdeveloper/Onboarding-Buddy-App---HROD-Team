import Link from "next/link";
import { Icon } from "@/components/icons/Icon";

/** Icon-only notification entry point — top-right corner of the Employee KPI
 * section, matching the standard bell-icon placement instead of a written
 * "Notifications" button. Shows an unread-count badge when > 0. */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/employee-kpi/notifications"
      aria-label="Notifications"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-text shadow-card"
    >
      <Icon name="bell" size={17} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-err-tx px-1 font-en text-[9px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

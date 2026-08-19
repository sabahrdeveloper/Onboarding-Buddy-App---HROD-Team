import Link from "next/link";
import { Icon } from "@/components/icons/Icon";

/** Mirror-app-only (rendered by Home when variant.navMode === 'resources') —
 * same visual pattern as components/employee-kpi/NotificationBell.tsx, kept
 * separate since that one is hardcoded to the KPI notifications route/table. */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/notifications"
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

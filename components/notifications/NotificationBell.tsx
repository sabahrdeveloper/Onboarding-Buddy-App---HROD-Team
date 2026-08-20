"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { getMyUnreadCount } from "@/actions/notifications";

/** Mirror-app-only (rendered by the shared layout when variant.navMode ===
 * 'resources') — same visual pattern as components/employee-kpi/NotificationBell.tsx,
 * kept separate since that one is hardcoded to the KPI notifications route/table.
 *
 * Self-refreshes on mount and whenever the tab regains focus/visibility,
 * rather than only trusting the `unreadCount` server-rendered prop — that
 * prop comes through the shared layout, which the client Router Cache can
 * reuse for up to `staleTimes.dynamic` seconds (next.config.*) on normal
 * navigation, so a notification sent while the recipient is already
 * browsing the app wouldn't otherwise show up until that cache expired. */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [count, setCount] = useState(unreadCount);

  useEffect(() => {
    setCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      getMyUnreadCount().then((c) => {
        if (!cancelled) setCount(c);
      });
    }
    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-text shadow-card"
    >
      <Icon name="bell" size={17} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-err-tx px-1 font-en text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

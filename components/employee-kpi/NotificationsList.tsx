"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";
import { formatMonthDate } from "@/lib/employee-kpi";

interface NotificationActionResult {
  error?: string;
  success?: boolean;
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, IconName> = {
  submission: "list",
  approval: "checkCircle",
  rejection: "x",
  manager_added_kpi: "plus",
  achievement_update: "trending",
  not_submitted_reminder: "bell",
};

function dateSectionLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return formatMonthDate(iso);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function groupByDate(notifications: NotificationRow[]): [string, NotificationRow[]][] {
  const groups = new Map<string, NotificationRow[]>();
  for (const n of notifications) {
    const label = dateSectionLabel(n.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), n]);
  }
  return [...groups.entries()];
}

interface NotificationsListProps {
  notifications: NotificationRow[];
  markOneAction: (id: string) => Promise<NotificationActionResult>;
  markAllAction: () => Promise<NotificationActionResult>;
}

export function NotificationsList({ notifications, markOneAction, markAllAction }: NotificationsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible = tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAction();
      router.refresh();
    });
  }

  function handleOpen(id: string, isRead: boolean) {
    if (isRead) return;
    startTransition(async () => {
      await markOneAction(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("all")}
            className={`rounded-full px-3.5 py-1.5 font-en text-[12.5px] font-bold ${
              tab === "all" ? "bg-green text-white" : "bg-card text-muted border border-line"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab("unread")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-en text-[12.5px] font-bold ${
              tab === "unread" ? "bg-green text-white" : "bg-card text-muted border border-line"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="rounded-full bg-err-tx px-1.5 py-0.5 font-en text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={isPending} className="font-en text-[11.5px] font-bold text-green-dark">
            Mark all read
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center text-[12.5px] font-medium text-muted shadow-card">
          কোনো notification নেই।
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupByDate(visible).map(([label, group]) => (
            <div key={label}>
              <div className="mb-2 font-en text-[11px] font-bold uppercase tracking-[0.03em] text-muted">{label}</div>
              <div className="flex flex-col gap-2">
                {group.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleOpen(n.id, n.isRead)}
                    className={`flex items-start gap-3 rounded-card border p-3.5 text-left shadow-card ${
                      n.isRead ? "border-line bg-card" : "border-[#cde9d5] bg-green-light"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-light text-green-dark">
                      <Icon name={TYPE_ICON[n.type] ?? "bell"} size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-en text-[13px] font-bold text-text">{n.title}</div>
                      <div className="mt-0.5 text-[12px] font-medium leading-snug text-text">{n.body}</div>
                      <div className="mt-1 text-[11px] font-semibold text-muted">{formatTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

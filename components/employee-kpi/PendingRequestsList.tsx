"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { formatMonthDate } from "@/lib/employee-kpi";

export interface PendingRequestRow {
  enrollNumber: string;
  name: string;
  submittedAt: string;
  itemCount: number;
}

export function PendingRequestsList({ requests }: { requests: PendingRequestRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = requests.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2 rounded-input border border-line bg-card px-3.5 py-3">
        <Icon name="list" size={16} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employee…"
          className="w-full bg-transparent font-en text-sm text-text outline-none placeholder:text-muted"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center text-[12.5px] font-medium text-muted shadow-card">
          কোনো pending KPI request নেই।
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((r) => (
            <Link
              key={r.enrollNumber}
              href={`/team/${r.enrollNumber}`}
              className="flex items-center justify-between rounded-card border border-line bg-card p-3.5 shadow-card transition-transform active:scale-[0.98]"
            >
              <div className="min-w-0">
                <div className="truncate font-en text-[13px] font-bold text-text">{r.name}</div>
                <div className="mt-0.5 text-[11.5px] font-medium text-muted">
                  Submitted on: {formatMonthDate(r.submittedAt)} · {r.itemCount} KPI
                </div>
              </div>
              <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

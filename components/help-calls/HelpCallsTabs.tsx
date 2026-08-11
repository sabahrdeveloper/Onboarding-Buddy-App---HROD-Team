"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { TicketCard, type HelpRequestRow } from "@/components/team/TicketCard";

type Tab = "mine" | "directed";

export function HelpCallsTabs({
  mineTickets,
  directedTickets,
  showDirected,
}: {
  mineTickets: HelpRequestRow[];
  directedTickets: HelpRequestRow[];
  showDirected: boolean;
}) {
  const [tab, setTab] = useState<Tab>("mine");
  const active = tab === "mine" ? mineTickets : directedTickets;

  return (
    <div>
      {showDirected && (
        <div className="mb-4 flex gap-1.5 rounded-2xl bg-[#edeff2] p-1">
          <button
            onClick={() => setTab("mine")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 font-en text-[13px] font-bold transition-colors ${
              tab === "mine" ? "bg-card text-text shadow-card" : "text-muted"
            }`}
          >
            My Tickets
          </button>
          <button
            onClick={() => setTab("directed")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 font-en text-[13px] font-bold transition-colors ${
              tab === "directed" ? "bg-card text-text shadow-card" : "text-muted"
            }`}
          >
            Directed to Me
          </button>
        </div>
      )}

      {active.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-5 text-center shadow-card">
          <Icon name="ticket" size={26} className="mx-auto mb-2 text-muted" />
          <p className="text-sm font-medium text-muted">
            {tab === "mine" ? "আপনি এখনো কোনো help request পাঠাননি।" : "এখনো আপনার দিকে কোনো help request নেই।"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {active.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}

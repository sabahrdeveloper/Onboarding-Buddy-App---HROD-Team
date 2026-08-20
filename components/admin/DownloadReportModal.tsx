"use client";

import { useState } from "react";

interface Journey {
  id: string;
  name: string;
}

export function DownloadReportModal({ journeys }: { journeys: Journey[] }) {
  const [open, setOpen] = useState(false);
  const [journeyId, setJourneyId] = useState(journeys[0]?.id ?? "");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={journeys.length === 0}
        className="rounded-lg border border-line bg-card px-3 py-1.5 font-en text-[13px] font-semibold text-text disabled:opacity-50"
      >
        Download Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-card bg-card p-4 shadow-card">
            <div className="mb-3 font-en text-[15px] font-bold text-text">Download Assessment Report</div>
            <label className="mb-1 block font-en text-[12.5px] font-semibold text-text">Journey</label>
            <select
              value={journeyId}
              onChange={(e) => setJourneyId(e.target.value)}
              className="mb-4 w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-button border border-line px-4 py-2.5 font-en text-sm font-semibold text-text"
              >
                Cancel
              </button>
              <a
                href={`/admin/assessments/report?journeyId=${journeyId}`}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-button bg-green px-4 py-2.5 text-center font-en text-sm font-bold text-white"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

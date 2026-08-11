"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/employee-kpi/StatusPill";
import { KpiItemProgressRow, type KpiItemLike } from "@/components/employee-kpi/KpiItemProgressRow";
import { formatMonthDate, periodLabel, type SubmissionStatus } from "@/lib/employee-kpi";
import { adminUnlockSubmission } from "@/actions/employee-kpi";

export interface ReviewSubmission {
  id: string;
  period: string;
  status: SubmissionStatus;
  employeeNote: string | null;
  managerComment: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  items: KpiItemLike[];
}

export interface CommentRow {
  id: string;
  authorRole: "employee" | "manager";
  comment: string;
  createdAt: string;
}

export function ManagerReviewPanel({
  submission,
  employeeEnrollNumber,
  comments,
  isSuperAdmin,
}: {
  submission: ReviewSubmission | null;
  employeeEnrollNumber: string;
  comments: CommentRow[];
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnlock() {
    if (!submission) return;
    startTransition(async () => {
      await adminUnlockSubmission(submission.id, employeeEnrollNumber);
      router.push(`/employee-kpi/review/${employeeEnrollNumber}`);
    });
  }

  if (!submission) {
    return (
      <div className="mb-4 rounded-card border border-line bg-card p-4 text-center text-[12.5px] font-medium text-muted shadow-card">
        এই মাসের কোনো Employee KPI submission নেই।
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-en text-[13px] font-bold text-muted">{periodLabel(submission.period)}</div>
        </div>
        <StatusPill status={submission.status} />
      </div>

      {submission.status === "pending" && (
        <>
          <p className="mb-3 text-[12.5px] font-medium leading-snug text-muted">
            {submission.items.length} KPI submit করা হয়েছে, approval-এর অপেক্ষায়।
          </p>
          <Link
            href={`/employee-kpi/review/${employeeEnrollNumber}`}
            className="flex items-center justify-center gap-2 rounded-button bg-text px-4 py-3.5 font-en text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            Review Submission
          </Link>
        </>
      )}

      {submission.status === "rejected" && (
        <>
          <div className="mb-3 rounded-[14px] border border-[#f5c2c2] bg-err-bg p-3.5">
            <p className="text-[12.5px] font-semibold leading-snug text-err-tx">
              এই submission reject করা হয়েছে — employee-এর resubmission-এর অপেক্ষায়।
            </p>
            {submission.managerComment && (
              <p className="mt-1.5 text-[12px] font-medium text-err-tx">Reason: {submission.managerComment}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {submission.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2.5">
                <span className="font-en text-[12.5px] font-bold text-text">{item.name}</span>
                <span className="text-[11px] font-medium text-muted">
                  {item.target} {item.unit ?? ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {submission.status === "approved" && (
        <>
          <div className="mb-3 text-[11.5px] font-semibold text-muted">
            {submission.reviewedAt && `Approved on: ${formatMonthDate(submission.reviewedAt)}`}
          </div>
          <div className="flex flex-col gap-3 rounded-card bg-bg p-3">
            {submission.items.map((item) => (
              <KpiItemProgressRow key={item.id} item={item} />
            ))}
          </div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-input border border-line bg-card py-3 font-en text-[12.5px] font-bold text-text"
          >
            {showHistory ? "Hide" : "View"} Update History
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleUnlock}
              disabled={isPending}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-input border border-[#f5c2c2] bg-err-bg py-3 font-en text-[12.5px] font-bold text-err-tx disabled:opacity-60"
            >
              {isPending ? "Unlocking…" : "Admin: Unlock for Editing"}
            </button>
          )}
          {showHistory && (
            <div className="mt-2.5 flex flex-col gap-2">
              {comments.length === 0 ? (
                <p className="text-center text-[12px] font-medium text-muted">কোনো comment/update নেই।</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-bg px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-en text-[11px] font-bold text-text capitalize">{c.authorRole}</span>
                      <span className="font-en text-[10.5px] font-semibold text-muted">{formatMonthDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-text">{c.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

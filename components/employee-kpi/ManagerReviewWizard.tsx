"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { addManagerKpi, approveSubmission, rejectSubmission, removeManagerKpi } from "@/actions/employee-kpi";
import type { KpiItemLike } from "@/components/employee-kpi/KpiItemProgressRow";

export interface WizardSubmission {
  id: string;
  employeeNote: string | null;
  items: KpiItemLike[];
}

type Step = 1 | 2 | 3;

/**
 * The manager's pending-review flow as three distinct, full-width steps —
 * matching the mockup's separate "Employee KPI Details (Review)" →
 * "Add New KPI" → "Approve / Reject with Comment" screens, rather than one
 * flat panel with everything visible at once.
 */
export function ManagerReviewWizard({
  submission,
  employeeEnrollNumber,
  employeeName,
  isSuperAdmin,
}: {
  submission: WizardSubmission;
  employeeEnrollNumber: string;
  employeeName: string;
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- Step 2: add-KPI form state ---
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addManagerKpi({
        submissionId: submission.id,
        employeeEnrollNumber,
        name,
        target: Number(target),
        unit,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setName("");
      setTarget("");
      setUnit("");
      router.refresh();
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeManagerKpi({ itemId, employeeEnrollNumber });
      router.refresh();
    });
  }

  function handleReview(action: "approved" | "rejected") {
    setError(null);
    if (action === "rejected" && !comment.trim()) {
      setError("Reject করার কারণ লিখুন।");
      return;
    }
    startTransition(async () => {
      const fn = action === "approved" ? approveSubmission : rejectSubmission;
      const result = await fn({ submissionId: submission.id, employeeEnrollNumber, comment });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/team/${employeeEnrollNumber}`);
    });
  }

  function goBack() {
    if (step === 1) router.push(`/team/${employeeEnrollNumber}`);
    else setStep((s) => (s - 1) as Step);
  }

  return (
    <div>
      <div className="mb-4 mt-0.5 flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-en text-lg font-extrabold text-text">{employeeName}</div>
          <div className="text-xs font-medium text-muted">
            {step === 1 && "Review Submission"}
            {step === 2 && "Add New KPI"}
            {step === 3 && "Approve / Reject"}
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="flex min-h-[65vh] flex-col">
          <div>
            <div className="mb-3 font-en text-[13px] font-bold text-text">Submitted KPI</div>
            <div className="mb-4 flex flex-col gap-2">
              {submission.items.map((item, i) => (
                <div key={item.id} className="rounded-card border border-line bg-card p-3.5 shadow-card">
                  <div className="font-en text-[13px] font-bold text-text">
                    {i + 1}. {item.name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] font-medium text-muted">
                    Target: {item.target} {item.unit ?? ""}
                  </div>
                </div>
              ))}
            </div>

            {submission.employeeNote && (
              <div className="mb-4">
                <div className="mb-1.5 font-en text-[12px] font-bold text-text">Employee Comment</div>
                <div className="rounded-card border border-line bg-bg p-3.5 text-[12.5px] font-medium leading-snug text-text">
                  {submission.employeeNote}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-button bg-text px-4 py-4 font-en text-base font-bold text-white transition-transform active:scale-[0.98]"
          >
            Review &amp; Action
          </button>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="mb-4 rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="mb-2 font-en text-[13px] font-bold text-text">Add New KPI</div>
            <label className="mb-1 block font-en text-[11.5px] font-bold text-text">KPI Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cross-sell New Product"
              className="mb-2.5 w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-en text-[11.5px] font-bold text-text">Target</label>
                <input
                  type="number"
                  min={0}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="20"
                  className="w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
                />
              </div>
              <div>
                <label className="mb-1 block font-en text-[11.5px] font-bold text-text">Unit (optional)</label>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Deals"
                  className="w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
                />
              </div>
            </div>
            {error && <p className="mt-2 text-xs font-semibold text-err-tx">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setName("");
                  setTarget("");
                  setUnit("");
                  setError(null);
                }}
                className="flex-1 rounded-input border border-line bg-card py-3 font-en text-sm font-bold text-text"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isPending}
                className="flex-1 rounded-input bg-green py-3 font-en text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Adding…" : "Add KPI"}
              </button>
            </div>
          </div>

          <div className="mb-2 font-en text-[12px] font-bold text-muted">Current KPI List</div>
          <div className="mb-4 flex flex-col gap-2">
            {submission.items.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between rounded-card border border-line bg-card p-3 shadow-card">
                <div className="min-w-0">
                  <div className="truncate font-en text-[12.5px] font-bold text-text">
                    {i + 1}. {item.name}
                  </div>
                  <div className="text-[11px] font-medium text-muted">
                    Target: {item.target} {item.unit ?? ""}
                  </div>
                </div>
                {(item.addedByManager || isSuperAdmin) && (
                  <button onClick={() => handleRemove(item.id)} aria-label="Remove" className="shrink-0 text-err-tx">
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            className="flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white transition-transform active:scale-[0.98]"
          >
            Continue
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="mb-4">
            <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Manager Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment (required to reject, optional to approve)"
              rows={3}
              className="w-full resize-none rounded-input border border-line bg-card px-3.5 py-3 font-bn text-sm text-text outline-none focus:border-green"
            />
          </div>

          <div className="mb-2 font-en text-[12px] font-bold text-muted">KPI Summary</div>
          <div className="mb-4 flex flex-col gap-1.5">
            {submission.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-card border border-line bg-card p-3 shadow-card">
                <Icon name="chevronRight" size={14} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <span className="font-en text-[12.5px] font-bold text-text">{item.name}</span>
                  <span className="ml-1.5 text-[11px] font-medium text-muted">
                    Target: {item.target} {item.unit ?? ""}
                  </span>
                  {item.addedByManager && (
                    <span className="ml-1.5 rounded-md bg-blue-light px-1.5 py-0.5 font-en text-[9px] font-bold text-blue-dark">
                      Added by Manager
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mb-2 text-xs font-semibold text-err-tx">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleReview("rejected")}
              disabled={isPending}
              className="flex-1 rounded-button bg-err-tx py-4 font-en text-sm font-bold text-white disabled:opacity-60"
            >
              Reject
            </button>
            <button
              onClick={() => handleReview("approved")}
              disabled={isPending}
              className="flex-1 rounded-button bg-green py-4 font-en text-sm font-bold text-white disabled:opacity-60"
            >
              Approve
            </button>
          </div>
        </>
      )}
    </div>
  );
}

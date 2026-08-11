import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { StatusPill } from "@/components/employee-kpi/StatusPill";
import { KpiItemProgressRow, type KpiItemLike } from "@/components/employee-kpi/KpiItemProgressRow";
import { formatMonthDate, itemPace, overallPct, periodLabel, type SubmissionStatus } from "@/lib/employee-kpi";

export interface EmployeeKpiOverviewSubmission {
  period: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  managerComment: string | null;
  items: KpiItemLike[];
}

/** The employee's own "Employee KPI" card on the KPI tab — a single,
 * state-aware view (no submission yet / pending / rejected / approved)
 * rather than four separate screens, since the mockup's own screens already
 * reuse one "KPI" header across those states. */
export function EmployeeKpiOverviewCard({ submission }: { submission: EmployeeKpiOverviewSubmission | null }) {
  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-en text-[13px] font-bold text-muted">{submission ? periodLabel(submission.period) : "এই মাস"}</div>
        {submission && <StatusPill status={submission.status} />}
      </div>

      {!submission && (
        <>
          <p className="mb-3 text-[12.5px] font-medium leading-snug text-muted">
            এই মাসের KPI এখনো submit করেননি। Target KPI যোগ করে manager-এর approval-এর জন্য পাঠান।
          </p>
          <Link
            href="/employee-kpi/submit"
            className="flex items-center justify-center gap-2 rounded-button bg-green px-4 py-3.5 font-en text-sm font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98]"
          >
            Submit KPI
          </Link>
        </>
      )}

      {submission?.status === "pending" && (
        <>
          <div className="mb-3 rounded-[14px] border border-[#f0d08a] bg-warn-bg p-3.5">
            <p className="text-[12.5px] font-semibold leading-snug text-warn-tx">
              আপনার KPI submit করা হয়েছে এবং manager-এর approval-এর অপেক্ষায় আছে।
            </p>
            <div className="mt-2 flex gap-4 text-[11.5px] font-semibold text-warn-tx">
              <span>Submitted on: {formatMonthDate(submission.submittedAt)}</span>
              <span>Total KPI: {submission.items.length}</span>
            </div>
          </div>
          <div className="mb-3 font-en text-[12px] font-bold text-muted">Submitted KPI</div>
          <div className="mb-3 flex flex-col gap-2">
            {submission.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate font-en text-[12.5px] font-bold text-text">{item.name}</div>
                  <div className="text-[11px] font-medium text-muted">
                    Target: {item.target} {item.unit ?? ""}
                  </div>
                </div>
                <StatusPill status="pending" />
              </div>
            ))}
          </div>
          <Link
            href="/employee-kpi/details"
            className="flex items-center justify-center gap-2 rounded-input border border-line bg-card px-4 py-3 font-en text-sm font-bold text-text"
          >
            View Submission Details
          </Link>
        </>
      )}

      {submission?.status === "rejected" && (
        <>
          <div className="mb-3 rounded-[14px] border border-[#f5c2c2] bg-err-bg p-3.5">
            <p className="text-[12.5px] font-semibold leading-snug text-err-tx">
              আপনার KPI reject হয়েছে। এডিট করে আবার submit করুন।
            </p>
            {submission.managerComment && (
              <p className="mt-1.5 text-[12px] font-medium leading-snug text-err-tx">
                Manager: {submission.managerComment}
              </p>
            )}
          </div>
          <Link
            href="/employee-kpi/submit"
            className="flex items-center justify-center gap-2 rounded-button bg-green px-4 py-3.5 font-en text-sm font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98]"
          >
            Edit &amp; Resubmit
          </Link>
        </>
      )}

      {submission?.status === "approved" && (
        <>
          <div className="mb-3 rounded-[14px] border border-[#cde9d5] bg-green-light p-3.5">
            <p className="text-[12.5px] font-semibold leading-snug text-green-dark">
              আপনার KPI approve হয়েছে — এখন এটি Actual KPI।
            </p>
            <div className="mt-1.5 text-[11.5px] font-semibold text-green-dark">
              {submission.reviewedAt && `Approved on: ${formatMonthDate(submission.reviewedAt)}`}
              {submission.reviewedByName && ` · ${submission.reviewedByName}`}
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-en text-[12.5px] font-bold text-text">Overall KPI Progress</span>
              <span className="font-en text-lg font-extrabold text-green-dark">{overallPct(submission.items)}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-lg bg-[#edeff2]">
              <div className="h-full rounded-lg bg-green transition-[width]" style={{ width: `${overallPct(submission.items)}%` }} />
            </div>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-bg px-2 py-2.5">
              <div className="font-en text-base font-extrabold text-text">{submission.items.length}</div>
              <div className="mt-0.5 text-[10px] font-semibold text-muted">Total KPI</div>
            </div>
            <div className="rounded-xl bg-bg px-2 py-2.5">
              <div className="font-en text-base font-extrabold text-ok-tx">
                {submission.items.filter((i) => itemPace(i) === "on_track").length}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-muted">On Track</div>
            </div>
            <div className="rounded-xl bg-bg px-2 py-2.5">
              <div className="font-en text-base font-extrabold text-warn-tx">
                {submission.items.filter((i) => itemPace(i) === "at_risk").length}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-muted">At Risk</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-card bg-bg p-3">
            {submission.items.map((item) => (
              <KpiItemProgressRow key={item.id} item={item} />
            ))}
          </div>

          <div className="mt-3 font-en text-[11px] font-bold uppercase tracking-[0.03em] text-muted">Quick Actions</div>
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href="/employee-kpi/update"
              className="flex items-center justify-center gap-1.5 rounded-input bg-green px-3.5 py-3.5 font-en text-sm font-bold text-white transition-transform active:scale-[0.98]"
            >
              <Icon name="trending" size={16} />
              Update Achievement
            </Link>
            <Link
              href="/employee-kpi/submit"
              className="flex items-center justify-center gap-1.5 rounded-input bg-green px-3.5 py-3.5 font-en text-sm font-bold text-white transition-transform active:scale-[0.98]"
            >
              <Icon name="plus" size={16} />
              Submit Next Month KPI
            </Link>
            <Link
              href="/employee-kpi/history"
              className="flex items-center justify-between rounded-input border border-line bg-card px-3.5 py-3.5 font-en text-sm font-bold text-text"
            >
              View History
              <Icon name="chevronRight" size={16} className="text-muted" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

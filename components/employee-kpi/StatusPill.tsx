import { STATUS_LABEL, STATUS_PILL_CLASS, type SubmissionStatus } from "@/lib/employee-kpi";

export function StatusPill({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 font-en text-[10.5px] font-bold ${STATUS_PILL_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

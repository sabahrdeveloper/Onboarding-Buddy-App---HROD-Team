import { Icon } from "@/components/icons/Icon";
import { KPI_META, type KpiId } from "@/lib/kpi";

/** Headline card for a single KPI: number badge, title/subtitle, and the big
 * percentage with a progress bar. Optional caption (e.g. "5 team members"). */
export function KpiHeadlineCard({ kpiId, pct, caption }: { kpiId: KpiId; pct: number; caption?: string }) {
  const meta = KPI_META[kpiId];
  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-green-light text-green-dark">
          <Icon name={meta.icon} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-green-light px-1.5 py-0.5 font-en text-[10px] font-bold uppercase tracking-[0.04em] text-green-dark">
              KPI {meta.number}
            </span>
            <span className="truncate font-en text-sm font-extrabold text-text">{meta.title}</span>
          </div>
          <div className="mt-0.5 truncate text-[12px] font-medium text-muted">{meta.subtitle}</div>
        </div>
        <div className="shrink-0 font-en text-2xl font-extrabold text-green-dark">{pct}%</div>
      </div>
      <div className="my-3 h-2.5 overflow-hidden rounded-lg bg-[#edeff2]">
        <div className="h-full rounded-lg bg-green transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      {caption && <div className="text-[12px] font-medium text-muted">{caption}</div>}
    </div>
  );
}

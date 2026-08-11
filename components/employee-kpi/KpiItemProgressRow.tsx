import { itemPace, itemPct } from "@/lib/employee-kpi";

export interface KpiItemLike {
  id: string;
  name: string;
  target: number;
  unit: string | null;
  achievement: number;
  addedByManager: boolean;
}

/** One KPI's live progress bar — name, target/unit, achievement %, and an
 * on-track/at-risk tint on the bar itself (no separate text label needed,
 * the color carries it, matching the app's icon-only status convention). */
export function KpiItemProgressRow({ item }: { item: KpiItemLike }) {
  const pct = itemPct(item);
  const pace = itemPace(item);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-en text-[12.5px] font-bold text-text">
          {item.name}
          {item.addedByManager && (
            <span className="ml-1.5 rounded-md bg-blue-light px-1.5 py-0.5 font-en text-[9.5px] font-bold text-blue-dark">
              Manager added
            </span>
          )}
        </span>
        <span className="font-en text-[12px] font-bold text-green-dark">{pct}%</span>
      </div>
      <div className="mt-1 text-[11px] font-medium text-muted">
        {item.achievement} / {item.target} {item.unit ?? ""}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-lg bg-[#edeff2]">
        <div
          className={`h-full rounded-lg ${pace === "at_risk" ? "bg-warn-tx" : "bg-green"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

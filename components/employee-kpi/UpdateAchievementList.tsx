"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { updateAchievement } from "@/actions/employee-kpi";
import { itemPct } from "@/lib/employee-kpi";

export interface AchievementItem {
  id: string;
  name: string;
  target: number;
  unit: string | null;
  achievement: number;
}

/** Top editor for whichever KPI is currently selected — matches the
 * mockup's dedicated single-KPI editing card (Achievement + unit + optional
 * comment + Save Update), distinct from the collapsed list below it. */
function SelectedItemEditor({ item }: { item: AchievementItem }) {
  const router = useRouter();
  const [achievement, setAchievement] = useState(String(item.achievement));
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateAchievement({ itemId: item.id, achievement: Number(achievement), comment });
      if (result.error) {
        setError(result.error);
        return;
      }
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-card">
      <div className="font-en text-[13px] font-bold text-text">{item.name}</div>
      <div className="mt-0.5 mb-3 text-[11.5px] font-medium text-muted">
        Target: {item.target} {item.unit ?? ""}
      </div>

      <label className="mb-1.5 block font-en text-[12px] font-bold text-text">Achievement</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={achievement}
          onChange={(e) => setAchievement(e.target.value)}
          className="w-full rounded-input border border-line bg-bg px-3.5 py-3 font-en text-sm text-text outline-none focus:border-green"
        />
        <div className="flex items-center rounded-input border border-line bg-bg px-3.5 py-3 font-en text-sm text-muted">
          {item.unit || "value"}
        </div>
      </div>

      <label className="mb-1.5 mt-3 block font-en text-[12px] font-bold text-text">Comment (Optional)</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="On track. Expecting higher in last week."
        rows={2}
        className="w-full resize-none rounded-input border border-line bg-bg px-3.5 py-3 font-bn text-sm text-text outline-none placeholder:text-muted focus:border-green"
      />

      {error && <p className="mt-1.5 text-xs font-semibold text-err-tx">{error}</p>}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-input bg-green px-3.5 py-3.5 font-en text-sm font-bold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Update"}
      </button>
    </div>
  );
}

/** A collapsed row for a non-selected KPI — tap to bring it into the editor above. */
function CollapsedRow({ item, onSelect }: { item: AchievementItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-card border border-line bg-card p-3.5 shadow-card"
    >
      <div className="min-w-0 text-left">
        <div className="truncate font-en text-[12.5px] font-bold text-text">{item.name}</div>
        <div className="mt-0.5 text-[11px] font-medium text-muted">
          Achievement: {item.achievement} / {item.target} {item.unit ?? ""} ({itemPct(item)}%)
        </div>
      </div>
      <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
    </button>
  );
}

export function UpdateAchievementList({ items }: { items: AchievementItem[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const rest = items.filter((i) => i.id !== selected.id);

  return (
    <div className="flex flex-col gap-4">
      <SelectedItemEditor key={selected.id} item={selected} />

      {rest.length > 0 && (
        <div>
          <div className="mb-2 font-en text-[11px] font-bold uppercase tracking-[0.03em] text-muted">My KPI Progress</div>
          <div className="flex flex-col gap-2">
            {rest.map((item) => (
              <CollapsedRow key={item.id} item={item} onSelect={() => setSelectedId(item.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { submitMonthlyKpis } from "@/actions/employee-kpi";

type Frequency = "daily" | "weekly" | "monthly";

interface DraftItem {
  key: number;
  name: string;
  target: string;
  unit: string;
  frequency: Frequency;
}

let nextKey = 1;

function blankItem(): DraftItem {
  return { key: nextKey++, name: "", target: "", unit: "", frequency: "monthly" };
}

export function SubmitKpiForm({
  initialItems,
  initialNote,
}: {
  initialItems: { name: string; target: number; unit: string; frequency: Frequency }[];
  initialNote: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<DraftItem[]>(
    initialItems.length > 0
      ? initialItems.map((i) => ({ key: nextKey++, name: i.name, target: String(i.target), unit: i.unit, frequency: i.frequency }))
      : [blankItem()],
  );
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateItem(key: number, patch: Partial<DraftItem>) {
    setItems((cur) => cur.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: number) {
    setItems((cur) => (cur.length > 1 ? cur.filter((i) => i.key !== key) : cur));
  }

  function handleSubmit() {
    setError(null);
    const parsed = items.map((i) => ({ name: i.name, target: Number(i.target), unit: i.unit, frequency: i.frequency }));
    startTransition(async () => {
      const result = await submitMonthlyKpis({ items: parsed, employeeNote: note });
      if (result.error) {
        setError(result.error);
        return;
      }
      // revalidatePath in the action already invalidates /kpi's cache, so
      // push() alone fetches fresh data — a trailing refresh() would just
      // re-fetch the same page a second time and double the perceived delay.
      router.push("/kpi");
    });
  }

  return (
    <div>
      <div className="mb-3 font-en text-[13px] font-bold text-text">Add your Target KPI for this month</div>

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <div key={item.key} className="rounded-card border border-line bg-card p-3.5 shadow-card">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-en text-[12px] font-bold text-muted">KPI {idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(item.key)} aria-label="Remove" className="text-err-tx">
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
            <label className="mb-1 block font-en text-[11.5px] font-bold text-text">KPI Name</label>
            <input
              value={item.name}
              onChange={(e) => updateItem(item.key, { name: e.target.value })}
              placeholder="e.g. Increase Sales"
              className="mb-2.5 w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-en text-[11.5px] font-bold text-text">Target</label>
                <input
                  type="number"
                  min={0}
                  value={item.target}
                  onChange={(e) => updateItem(item.key, { target: e.target.value })}
                  placeholder="100"
                  className="w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
                />
              </div>
              <div>
                <label className="mb-1 block font-en text-[11.5px] font-bold text-text">Unit (optional)</label>
                <input
                  value={item.unit}
                  onChange={(e) => updateItem(item.key, { unit: e.target.value })}
                  placeholder="Sales"
                  className="w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
                />
              </div>
            </div>
            <div className="mt-2.5">
              <label className="mb-1 block font-en text-[11.5px] font-bold text-text">Frequency</label>
              <select
                value={item.frequency}
                onChange={(e) => updateItem(item.key, { frequency: e.target.value as Frequency })}
                className="w-full rounded-input border border-line bg-bg px-3.5 py-2.5 font-en text-sm text-text outline-none focus:border-green"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setItems((cur) => [...cur, blankItem()])}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-input border border-dashed border-line bg-card py-3 font-en text-sm font-bold text-green-dark"
      >
        <Icon name="plus" size={16} />
        Add KPI
      </button>

      <div className="mt-3.5">
        <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Manager Note (Optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something (optional)"
          rows={3}
          className="w-full resize-none rounded-input border border-line bg-bg px-3.5 py-3 font-bn text-sm text-text outline-none focus:border-green"
        />
      </div>

      {error && <p className="mt-2 text-xs font-semibold text-err-tx">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:opacity-70"
      >
        {isPending ? "Submitting…" : "Submit for Approval"}
      </button>
    </div>
  );
}

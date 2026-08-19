"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";
const labelClass = "mb-1 block font-en text-[12.5px] font-semibold text-text";

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ"] as const;

export interface QuestionFormValues {
  type: "mcq" | "open";
  question_text: string;
  marks: number;
  sequence: number;
  options: { key: string; text: string }[] | null;
  correct_option_key: string | null;
}

export function QuestionForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: QuestionFormValues;
  submitLabel: string;
}) {
  const [type, setType] = useState<"mcq" | "open">(initial?.type ?? "mcq");
  const optionByKey = new Map((initial?.options ?? []).map((o) => [o.key, o.text]));

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>Question Type</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value as "mcq" | "open")} className={inputClass}>
          <option value="mcq">Multiple Choice</option>
          <option value="open">Open Answer</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Question</label>
        <textarea name="question_text" defaultValue={initial?.question_text} required rows={2} className={inputClass} />
      </div>
      {type === "mcq" && (
        <>
          {OPTION_KEYS.map((key) => (
            <div key={key}>
              <label className={labelClass}>Option {key}</label>
              <input name={`option_${key}`} defaultValue={optionByKey.get(key)} className={inputClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Correct Option</label>
            <select name="correct_option_key" defaultValue={initial?.correct_option_key ?? ""} className={inputClass}>
              <option value="">Select correct option</option>
              {OPTION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      {type === "open" && (
        <div className="rounded-lg bg-bg px-3.5 py-2.5 text-[12.5px] font-medium text-muted">
          Open-answer questions currently award full marks for any non-empty answer.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Marks</label>
          <input name="marks" type="number" min={0} step="0.5" defaultValue={initial?.marks ?? 1} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Sequence</label>
          <input name="sequence" type="number" defaultValue={initial?.sequence ?? 0} required className={inputClass} />
        </div>
      </div>
      <button type="submit" className="mt-1 rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white">
        {submitLabel}
      </button>
    </form>
  );
}

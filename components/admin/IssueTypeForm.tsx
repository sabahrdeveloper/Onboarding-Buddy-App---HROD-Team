const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";
const labelClass = "mb-1 block font-en text-[12.5px] font-semibold text-text";

export interface IssueTypeFormValues {
  label: string;
  assigned_team: string;
  sequence: number;
  active: boolean;
}

export function IssueTypeForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: IssueTypeFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>Label (shown to employees)</label>
        <input name="label" defaultValue={initial?.label} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Routes To</label>
        <select name="assigned_team" defaultValue={initial?.assigned_team ?? "hr"} className={inputClass}>
          <option value="hr">HR</option>
          <option value="it">IT</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Sequence (lower shows first in the dropdown)</label>
        <input name="sequence" type="number" defaultValue={initial?.sequence ?? 0} required className={inputClass} />
      </div>
      <label className="flex items-center gap-2 font-en text-[13px] font-medium text-text">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-[18px] w-[18px] accent-green" />
        Active
      </label>
      <button type="submit" className="mt-1 rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white">
        {submitLabel}
      </button>
    </form>
  );
}

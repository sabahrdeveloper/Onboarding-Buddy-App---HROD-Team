const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";
const labelClass = "mb-1 block font-en text-[12.5px] font-semibold text-text";

export interface JourneyFormValues {
  name: string;
  sequence: number;
}

export function JourneyForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: JourneyFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>Journey Name</label>
        <input name="name" defaultValue={initial?.name} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Sequence (order shown to employees)</label>
        <input name="sequence" type="number" defaultValue={initial?.sequence ?? 0} required className={inputClass} />
      </div>
      <button type="submit" className="mt-1 rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white">
        {submitLabel}
      </button>
    </form>
  );
}

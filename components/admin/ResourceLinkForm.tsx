const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";
const labelClass = "mb-1 block font-en text-[12.5px] font-semibold text-text";

export interface ResourceLinkFormValues {
  title: string;
  url: string;
  category: string;
  sequence: number;
  active: boolean;
}

export function ResourceLinkForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: ResourceLinkFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>Title</label>
        <input name="title" defaultValue={initial?.title} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>URL</label>
        <input name="url" type="url" defaultValue={initial?.url} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Category (e.g. Policy, Sales Guide, Product)</label>
        <input name="category" defaultValue={initial?.category} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Sequence (lower shows first within category)</label>
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

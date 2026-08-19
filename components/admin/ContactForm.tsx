import { CONTACT_KEYS } from "@/lib/contact-keys";

const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";
const labelClass = "mb-1 block font-en text-[12.5px] font-semibold text-text";

export interface ContactFormValues {
  key: string;
  name: string;
  role: string;
  phone: string;
  icon: string;
  active: boolean;
}

export function ContactForm({
  action,
  initial,
  availableKeys,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: ContactFormValues;
  /** Only relevant on create — which keys don't have a contact yet. */
  availableKeys?: readonly string[];
  submitLabel: string;
}) {
  const keyLocked = Boolean(initial);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>Key</label>
        {keyLocked ? (
          <input value={initial?.key} disabled className={`${inputClass} bg-bg text-muted`} />
        ) : (
          <select name="key" defaultValue={availableKeys?.[0] ?? CONTACT_KEYS[0]} className={inputClass}>
            {(availableKeys ?? CONTACT_KEYS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label className={labelClass}>Name</label>
        <input name="name" defaultValue={initial?.name} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Role (display text)</label>
        <input name="role" defaultValue={initial?.role} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Phone</label>
        <input name="phone" defaultValue={initial?.phone} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Icon (icon-paths.ts name, e.g. users, monitor, briefcase)</label>
        <input name="icon" defaultValue={initial?.icon} required className={inputClass} />
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

const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";
const labelClass = "mb-1 block font-en text-[12.5px] font-semibold text-text";

export interface TaskFormValues {
  title: string;
  phase: string;
  work_number: number;
  responsible_role: string;
  responsible_key: string;
  timeline: string;
  why_text: string;
  how_to_steps: string[];
  confirm_question: string;
  active: boolean;
}

export function TaskForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: TaskFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>Title</label>
        <input name="title" defaultValue={initial?.title} required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phase</label>
          <select name="phase" defaultValue={initial?.phase ?? "30"} className={inputClass}>
            <option value="30">30</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Work Number (sequence)</label>
          <input name="work_number" type="number" defaultValue={initial?.work_number} required className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Responsible Role (display text)</label>
        <input name="responsible_role" defaultValue={initial?.responsible_role} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Responsible Contact Key (e.g. hr, it, manager, buddy)</label>
        <input name="responsible_key" defaultValue={initial?.responsible_key} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Timeline</label>
        <input name="timeline" defaultValue={initial?.timeline} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Why (explanation shown to employee)</label>
        <textarea name="why_text" defaultValue={initial?.why_text} required rows={3} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>How-to Steps (one per line)</label>
        <textarea
          name="how_to_steps"
          defaultValue={initial?.how_to_steps?.join("\n")}
          required
          rows={4}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Confirm Question (shown on mark-done)</label>
        <input name="confirm_question" defaultValue={initial?.confirm_question} required className={inputClass} />
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

import { Icon, type IconName } from "@/components/icons/Icon";

export interface ToastState {
  text: string;
  icon?: IconName;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <div
      className={`fixed left-1/2 top-4 z-[95] flex max-w-[90%] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-2xl bg-text px-[18px] py-3 font-en text-[13.5px] font-semibold text-white shadow-float transition-transform duration-300 ${
        toast ? "translate-y-0" : "-translate-y-[90px]"
      }`}
    >
      {toast?.icon && <Icon name={toast.icon} size={16} />}
      {toast?.text}
    </div>
  );
}

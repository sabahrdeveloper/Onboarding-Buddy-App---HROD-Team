import { Icon } from "@/components/icons/Icon";

interface OverlayShellProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  progressPct?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Full-screen overlay chrome shared by the Full Work List, Phase View, and
 * Task Manual overlays — ported from the prototype's .ov/.ov-top/.ov-body shell.
 * Relies on PhoneFrame's transform-gpu bezel to contain this `fixed` element.
 */
export function OverlayShell({ title, subtitle, onBack, progressPct, footer, children }: OverlayShellProps) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-bg">
      <div className="flex items-center gap-3 border-b border-line bg-card px-4 pb-[13px] pt-3.5">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-text"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <div className="flex-1 font-en text-base font-extrabold leading-tight text-text">
          {title}
          {subtitle && <small className="mt-0.5 block text-[11px] font-semibold text-muted">{subtitle}</small>}
        </div>
      </div>

      {progressPct !== undefined && (
        <div className="h-1.5 bg-[#edeff2]">
          <div
            className="h-full rounded-r-[4px] bg-green transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">{children}</div>

      {footer && (
        <div className="border-t border-line bg-card px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
          {footer}
        </div>
      )}
    </div>
  );
}

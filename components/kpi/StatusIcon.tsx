import { Icon } from "@/components/icons/Icon";

/** Icon-only completion indicator (no text labels, per spec): a filled green
 * check-circle when done, a muted clock ("not achieved yet") otherwise. */
export function StatusIcon({ done, size = 20 }: { done: boolean; size?: number }) {
  return done ? (
    <Icon name="checkCircle" size={size} className="shrink-0 text-green-dark" aria-label="Completed" />
  ) : (
    <Icon name="clock" size={size} className="shrink-0 text-muted" aria-label="Not completed yet" />
  );
}

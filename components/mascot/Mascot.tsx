export type MascotVariant = "color" | "white";
// "happy" renders identically to "neutral" in the prototype's mascot() — both fall
// through to the default mouth shape — kept as a distinct value since the prototype
// uses data-m="happy" at several call sites for semantic clarity.
export type MascotMood = "neutral" | "happy" | "thinking" | "cheering" | "success";

interface MascotProps {
  variant?: MascotVariant;
  mood?: MascotMood;
  className?: string;
}

/**
 * Ported 1:1 from the prototype's mascot(variant, mood) SVG-string generator.
 */
export function Mascot({ variant = "color", mood = "neutral", className }: MascotProps) {
  const white = variant === "white";
  const body = white ? "#FFFFFF" : "#2CA24D";
  const stroke = white ? "#2CA24D" : "#0C7A35";
  const face = white ? "#2CA24D" : "#FFFFFF";
  const cheek = white ? "#BFE3C9" : "#7BC98F";

  let mouthD: string;
  if (mood === "cheering" || mood === "success") {
    mouthD = "M39 60 Q50 72 61 60";
  } else if (mood === "thinking") {
    mouthD = "M44 62 h12";
  } else {
    mouthD = "M42 60 Q50 68 58 60";
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="50" cy="93" rx="23" ry="4" fill="rgba(0,0,0,.10)" />
      <path d="M50 24 V14" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx="57" cy="11" r="5" fill={body} stroke={stroke} strokeWidth="2.4" />
      <rect x="20" y="24" width="60" height="60" rx="26" fill={body} stroke={stroke} strokeWidth="3" />
      <circle cx="40" cy="48" r="5" fill={face} />
      <circle cx="60" cy="48" r="5" fill={face} />
      <path d={mouthD} stroke={face} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="31" cy="58" r="3.5" fill={cheek} opacity=".85" />
      <circle cx="69" cy="58" r="3.5" fill={cheek} opacity=".85" />
      {mood === "thinking" && (
        <>
          <circle cx="80" cy="30" r="3" fill={body} stroke={stroke} strokeWidth="1.6" />
          <circle cx="88" cy="22" r="4.5" fill={body} stroke={stroke} strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}

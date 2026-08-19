interface SalesMascotProps {
  className?: string;
}

/**
 * Flat-design counterpart to Mascot.tsx for the Sales Onboarding track —
 * same rounded-body/face construction and color tokens, with the bolt from
 * the provided artwork replacing the antenna, redrawn as flat shapes (no
 * gradient/bevel/shadow) to match the rest of this app's icon system.
 */
export function SalesMascot({ className }: SalesMascotProps) {
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
      <path
        d="M58 2 L38 20 L48 20 L42 32 L66 12 L54 12 Z"
        fill="#E63946"
        stroke="#9E1B24"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="20" y="24" width="60" height="60" rx="26" fill="#2CA24D" stroke="#0C7A35" strokeWidth="3" />
      <circle cx="40" cy="48" r="5" fill="#FFFFFF" />
      <circle cx="60" cy="48" r="5" fill="#FFFFFF" />
      <path d="M42 60 Q50 68 58 60" stroke="#FFFFFF" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="31" cy="58" r="3.5" fill="#7BC98F" opacity=".85" />
      <circle cx="69" cy="58" r="3.5" fill="#7BC98F" opacity=".85" />
    </svg>
  );
}

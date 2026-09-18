export function SwypToken({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="swyp-token-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#7B3DFF" />
          <stop offset="100%" stopColor="#FF3EDB" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#swyp-token-grad)" />
      <circle cx="12" cy="12" r="11" stroke="white" strokeOpacity="0.25" />
      <path
        d="M9.2 15.5c0 1.1 1.05 1.9 2.8 1.9 1.9 0 3-.85 3-2.1 0-1.35-1.15-1.75-2.65-2.1-1.75-.4-2.75-.75-2.75-1.95 0-1.1.95-1.75 2.4-1.75 1.6 0 2.55.75 2.6 1.85"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

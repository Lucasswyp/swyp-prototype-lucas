"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const GRADIENT_STOPS = (
  <>
    <stop offset="0%" stopColor="#6A2FE0" />
    <stop offset="55%" stopColor="#B24DFF" />
    <stop offset="100%" stopColor="#FF6EEB" />
  </>
);

/** Compact icon-only mark (S + arrow), for favicons and small nav slots. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const gid = `swyp-mark-grad-${useId()}`;
  const hid = `swyp-mark-hl-${useId()}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="18" y1="90" x2="85" y2="10" gradientUnits="userSpaceOnUse">
          {GRADIENT_STOPS}
        </linearGradient>
        <linearGradient id={hid} x1="30" y1="20" x2="70" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M66 16
           C 48 16 32 24 32 35
           C 32 47 47 50 60 53
           C 73 56 79 61 79 67
           C 79 79 63 87 46 87
           C 35 87 25 83 19 76"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 10
           C 44 12 30 20 30 32"
        fill="none"
        stroke={`url(#${hid})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M55 4 L86 10 L71 33 Z" fill={`url(#${gid})`} />
    </svg>
  );
}

const wordmarkSizes = {
  sm: { text: "text-lg", arrowBox: 13, arrowTop: -4, arrowLeft: -2 },
  md: { text: "text-2xl", arrowBox: 18, arrowTop: -6, arrowLeft: -3 },
  lg: { text: "text-4xl", arrowBox: 27, arrowTop: -9, arrowLeft: -4 },
} as const;

/**
 * Full "Swyp" wordmark lockup: a single gradient wordmark with a small arrow
 * flicking off the top of the S, matching the brand mark. Renders with a
 * transparent background — no icon tile.
 */
export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const gid = `swyp-word-grad-${useId()}`;
  const cfg = wordmarkSizes[size];

  if (!showWordmark) {
    return <LogoMark size={cfg.arrowBox * 1.6} className={className} />;
  }

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
      </svg>
      <span
        className={cn("font-heading font-extrabold tracking-tight", cfg.text)}
        style={{
          background: "linear-gradient(100deg, #6A2FE0 0%, #B24DFF 55%, #FF6EEB 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          fontStyle: "italic",
        }}
      >
        Swyp
      </span>
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: cfg.arrowTop,
          left: cfg.arrowLeft,
          width: cfg.arrowBox,
          height: cfg.arrowBox,
          transform: "rotate(8deg)",
        }}
      >
        <path d="M18 82 L68 27" fill="none" stroke={`url(#${gid})`} strokeWidth="16" strokeLinecap="round" />
        <path d="M82 12 L77 32 L63 18 Z" fill={`url(#${gid})`} />
      </svg>
    </span>
  );
}

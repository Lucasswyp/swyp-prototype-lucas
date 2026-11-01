"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { SwypToken } from "./SwypToken";
import { formatTokens } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TokenBadge({
  amount,
  size = "md",
  className,
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-lg px-4 py-2 gap-2",
  }[size];
  const iconSize = { sm: 12, md: 16, lg: 20 }[size];

  // Als het saldo omhoog gaat, springt het bolletje even op en licht het op.
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  const previous = useRef(amount);
  useEffect(() => {
    if (amount > previous.current && !reduced) {
      controls.start({
        scale: [1, 1.35, 0.95, 1],
        boxShadow: ["0 0 0 rgba(255,62,219,0)", "0 0 24px rgba(255,62,219,0.9)", "0 0 0 rgba(255,62,219,0)"],
        transition: { duration: 0.7, delay: 0.5 },
      });
    }
    previous.current = amount;
  }, [amount, controls, reduced]);

  return (
    <motion.span
      animate={controls}
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 font-semibold tabular-nums",
        sizeClasses,
        className
      )}
    >
      <SwypToken size={iconSize} />
      {formatTokens(amount)}
    </motion.span>
  );
}

"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function PullToRefreshIndicator({
  pullDistance,
  refreshing,
  triggerDistance,
}: {
  pullDistance: number;
  refreshing: boolean;
  triggerDistance: number;
}) {
  const progress = Math.min(1, pullDistance / triggerDistance);
  const visible = refreshing || pullDistance > 0;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 top-[calc(env(safe-area-inset-top)+0.25rem)] z-20 flex justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${refreshing ? 8 : pullDistance}px)`,
        transition: refreshing || pullDistance === 0 ? "transform 0.25s ease-out, opacity 0.25s ease-out" : "none",
      }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur">
        <motion.div
          animate={refreshing ? { rotate: 360 } : { rotate: progress * 270 }}
          transition={refreshing ? { duration: 0.7, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw size={15} className={progress >= 1 || refreshing ? "text-white" : "text-white/50"} />
        </motion.div>
      </div>
    </div>
  );
}

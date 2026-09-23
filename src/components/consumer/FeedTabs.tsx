"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FeedTabs({ active }: { active: "for-you" | "discover" }) {
  return (
    <div className="pointer-events-auto flex items-center gap-5">
      <Link
        href="/app"
        className={cn(
          "relative font-heading text-[15px] font-bold pb-1 transition-colors",
          active === "for-you" ? "text-white" : "text-white/50"
        )}
      >
        For You
        {active === "for-you" && (
          <motion.span
            layoutId="feed-tab-indicator"
            className="absolute left-0 right-0 -bottom-px h-0.5 bg-white"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </Link>
      <Link
        href="/app/discover"
        className={cn(
          "relative font-heading text-[15px] font-bold pb-1 transition-colors",
          active === "discover" ? "text-white" : "text-white/50"
        )}
      >
        Discover
        {active === "discover" && (
          <motion.span
            layoutId="feed-tab-indicator"
            className="absolute left-0 right-0 -bottom-px h-0.5 bg-white"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeedTabsProps {
  active: "for-you" | "discover";
  // Tapping the tab you're already on doesn't navigate anywhere (same
  // route), so — matching TikTok/Instagram — it refreshes the feed and
  // scrolls back to the top instead of doing nothing.
  onActiveTap?: () => void;
}

export function FeedTabs({ active, onActiveTap }: FeedTabsProps) {
  function handleClick(tab: "for-you" | "discover", e: React.MouseEvent) {
    if (tab === active && onActiveTap) {
      e.preventDefault();
      onActiveTap();
    }
  }

  return (
    <div className="pointer-events-auto flex items-center gap-5">
      <Link
        href="/app"
        onClick={(e) => handleClick("for-you", e)}
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
        onClick={(e) => handleClick("discover", e)}
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

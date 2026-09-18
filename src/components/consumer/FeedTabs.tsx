"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function FeedTabs({ active }: { active: "for-you" | "discover" }) {
  return (
    <div className="pointer-events-auto flex items-center gap-5">
      <Link
        href="/app"
        className={cn(
          "font-heading text-[15px] font-bold pb-1 border-b-2 transition-colors",
          active === "for-you" ? "text-white border-white" : "text-white/50 border-transparent"
        )}
      >
        For You
      </Link>
      <Link
        href="/app/discover"
        className={cn(
          "font-heading text-[15px] font-bold pb-1 border-b-2 transition-colors",
          active === "discover" ? "text-white border-white" : "text-white/50 border-transparent"
        )}
      >
        Discover
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Gift, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/app",
    label: "Home",
    icon: Home,
    match: (p: string) => p === "/app" || p.startsWith("/app/discover"),
  },
  { href: "/app/search", label: "Zoeken", icon: Search, match: (p: string) => p.startsWith("/app/search") },
  { href: "/app/rewards", label: "Rewards", icon: Gift, match: (p: string) => p.startsWith("/app/rewards") || p.startsWith("/app/my-rewards") },
  { href: "/app/saved", label: "Saved", icon: Bookmark, match: (p: string) => p.startsWith("/app/saved") },
  { href: "/app/profile", label: "Profiel", icon: User, match: (p: string) => p.startsWith("/app/profile") || p.startsWith("/app/wallet") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-indigo/90 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),10px)]"
      aria-label="Hoofdnavigatie"
    >
      <ul className="flex items-stretch justify-between px-2 pt-2">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-white" : "text-white/45 hover:text-white/70"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} className={active ? "text-magenta" : ""} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

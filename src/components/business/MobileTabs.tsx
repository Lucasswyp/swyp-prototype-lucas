"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const items = [
  { href: "/business", label: "Overview" },
  { href: "/business/campaigns", label: "Campaigns" },
  { href: "/business/products", label: "Products" },
  { href: "/business/rewards", label: "Rewards" },
  { href: "/business/audience", label: "Audience" },
  { href: "/business/creative-insights", label: "Insights" },
  { href: "/business/settings", label: "Settings" },
];

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden sticky top-0 z-20 bg-indigo/95 backdrop-blur border-b border-white/10">
      <div className="flex items-center gap-1 px-3 py-2">
        <Logo size="sm" className="mr-2 shrink-0" />
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {items.map(({ href, label }) => {
            const active = href === "/business" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                  active ? "bg-white text-indigo" : "bg-white/5 text-white/60"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

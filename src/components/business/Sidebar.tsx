"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Package,
  Gift,
  Users,
  Lightbulb,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useBusiness } from "@/contexts/BusinessContext";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/business", label: "Overview", icon: LayoutDashboard },
  { href: "/business/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/business/products", label: "Products", icon: Package },
  { href: "/business/rewards", label: "Rewards", icon: Gift },
  { href: "/business/audience", label: "Audience", icon: Users },
  { href: "/business/creative-insights", label: "Creative Insights", icon: Lightbulb },
  { href: "/business/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { business, email } = useBusiness();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/business/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-slate/60 h-screen sticky top-0 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Logo size="sm" />
        <span className="text-xs text-white/30 font-medium">for Business</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/business" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/app"
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5"
      >
        <ExternalLink size={14} /> Bekijk consumer app
      </Link>

      <div className="flex items-center gap-2 mt-4 px-2 pt-4 border-t border-white/10">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
          {business.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{business.name}</p>
          <p className="text-[11px] text-white/40 truncate">{email}</p>
        </div>
        <button onClick={logout} aria-label="Uitloggen" className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white shrink-0">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

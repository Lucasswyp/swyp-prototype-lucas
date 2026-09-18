"use client";

import Link from "next/link";
import { ChevronLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { TokenBadge } from "@/components/ui/TokenBadge";
import { LogoMark } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";

export function TopBar({
  title,
  back,
  transparent,
}: {
  title?: string;
  back?: boolean;
  transparent?: boolean;
}) {
  const router = useRouter();
  const tokenBalance = useAppStore((s) => s.tokenBalance);

  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-3 px-4 py-3 ${
        transparent ? "bg-transparent" : "bg-indigo/85 backdrop-blur-xl border-b border-white/5"
      }`}
    >
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Terug"
          className="rounded-full p-1.5 hover:bg-white/10 -ml-1.5"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {!back && <LogoMark size={26} />}
      {title && <h1 className="font-heading font-bold text-lg truncate">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <Link href="/app/wallet">
          <TokenBadge amount={tokenBalance} size="sm" />
        </Link>
        <button aria-label="Meldingen" className="rounded-full p-1.5 hover:bg-white/10">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}

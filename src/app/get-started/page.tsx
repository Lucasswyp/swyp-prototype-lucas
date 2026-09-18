import Link from "next/link";
import { Sparkles, Briefcase, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.28),transparent_60%)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>
        <h1 className="text-center font-heading text-2xl font-bold mb-2">Hoe wil je Swyp gebruiken?</h1>
        <p className="text-center text-white/50 text-sm mb-8">
          Kies je pad — je kunt dit later niet zomaar wisselen.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/get-started/user"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-violet/50 hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet/30 to-magenta/20 border border-white/10">
              <Sparkles size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold">Ik ben een gebruiker</p>
              <p className="text-xs text-white/50">Swipe, verdien Tokens, wissel rewards in.</p>
            </div>
            <ArrowRight size={18} className="text-white/30 group-hover:text-white/70 shrink-0" />
          </Link>

          <Link
            href="/business/signup"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-violet/50 hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet/30 to-magenta/20 border border-white/10">
              <Briefcase size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold">Ik ben een bedrijf</p>
              <p className="text-xs text-white/50">Plaats advertenties en volg je resultaten live.</p>
            </div>
            <ArrowRight size={18} className="text-white/30 group-hover:text-white/70 shrink-0" />
          </Link>
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          <Link href="/" className="hover:text-white/60">
            ← Terug naar de website
          </Link>
        </p>
      </div>
    </div>
  );
}

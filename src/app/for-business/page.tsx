import Link from "next/link";
import { ArrowRight, Target, Eye, LineChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const benefits = [
  { icon: Target, title: "Bereik relevante gebruikers", body: "Target op interesse, leeftijd, locatie en gedrag — geen verspilde vertoningen." },
  { icon: Eye, title: "Betaal voor kwalitatieve aandacht", body: "Gebruikers kiezen zelf om te kijken en te swipen. Aandacht is geen toeval, maar een keuze." },
  { icon: LineChart, title: "Analyseer engagement tot in detail", body: "Retention per seconde, swipe-rates, saves en clicks — precies zien wat werkt." },
  { icon: TrendingUp, title: "Genereer verkeer en sales", body: "Van swipe tot conversie, met directe attributie naar je producten en winkels." },
];

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-indigo/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5 whitespace-nowrap">
            <Logo size="sm" />
            <span className="text-xs text-white/40 font-medium hidden sm:inline">for Business</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="hidden sm:block">
              <Button variant="secondary" size="sm">Consumenten-app</Button>
            </Link>
            <Link href="/business">
              <Button size="sm">Naar dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24 text-center bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.3),transparent_55%)]">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            Maak van aandacht <span className="text-gradient-swyp">resultaat.</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Swyp beloont consumenten voor het bekijken van jouw advertenties — en geeft jou het inzicht om precies
            te zien wat werkt.
          </p>
          <Link href="/business/signup">
            <Button size="lg" className="gap-2">
              Meld je bedrijf aan <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet/30 to-magenta/20 border border-white/10">
                <b.icon size={22} />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">{b.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 bg-slate/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">Je eigen analytics dashboard</h2>
          <p className="text-white/55 mb-10 max-w-lg mx-auto">
            Spend, ROAS, retention per seconde, engagement signals en creative insights — allemaal in real-time.
          </p>
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="bg-slate p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              {[
                { label: "Spend", value: "€1.842" },
                { label: "Views", value: "84.302" },
                { label: "Completion rate", value: "68.4%" },
                { label: "ROAS", value: "6.78x" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
                  <p className="text-xs text-white/40 mb-1">{m.label}</p>
                  <p className="font-heading text-xl font-extrabold">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet/20 to-magenta/10 p-10 sm:p-14">
          <h2 className="font-heading text-3xl font-bold mb-4">Klaar om te adverteren op Swyp?</h2>
          <p className="text-white/60 mb-8">Maak een gratis account en zet je eerste campagne live.</p>
          <Link href="/business/signup">
            <Button size="lg" className="gap-2">
              Meld je bedrijf aan <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <span className="font-heading font-bold text-white/70">
            Sw<span className="text-magenta">yp</span>
          </span>
          <span>© 2026 Swyp. Swipe. Spaar. Profiteer.</span>
        </div>
      </footer>
    </div>
  );
}

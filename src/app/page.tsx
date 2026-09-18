import Link from "next/link";
import Image from "next/image";
import { Sparkles, Coins, Gift, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { RewardCard } from "@/components/consumer/RewardCard";
import { rewards, getCompany } from "@/data/seed";
import { img, photos } from "@/lib/images";

const steps = [
  {
    icon: Sparkles,
    title: "Swipe",
    body: "Ontdek advertenties die bij je passen — merken, producten en ervaringen, geselecteerd op jouw interesses.",
  },
  {
    icon: Coins,
    title: "Spaar",
    body: "Verdien Swyp Tokens met je aandacht: door te kijken, liken, opslaan en meer te ontdekken.",
  },
  {
    icon: Gift,
    title: "Profiteer",
    body: "Wissel je Tokens in voor echte voordelen — kortingen, gratis producten, upgrades en meer.",
  },
];

export default function LandingPage() {
  const featured = rewards.slice(0, 4);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-indigo/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Logo />
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/60">
            <a href="#how" className="hover:text-white">Hoe het werkt</a>
            <a href="#rewards" className="hover:text-white">Rewards</a>
            <Link href="/for-business" className="hover:text-white">Voor bedrijven</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/for-business" className="hidden sm:block">
              <Button variant="secondary" size="sm">Voor bedrijven</Button>
            </Link>
            <Link href="/app">
              <Button size="sm">Download Swyp</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 bg-[radial-gradient(circle_at_30%_0%,rgba(123,61,255,0.35),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(255,62,219,0.2),transparent_50%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-heading text-5xl sm:text-6xl font-extrabold leading-[1.05] mb-6">
              Swipe.
              <br />
              Spaar.
              <br />
              <span className="text-gradient-swyp">Profiteer.</span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-md mb-8 leading-relaxed">
              Ontdek merken, producten en ervaringen die bij je passen — en word beloond voor je aandacht.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app">
                <Button size="lg" className="gap-2">
                  Download Swyp <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/for-business">
                <Button size="lg" variant="secondary">
                  Voor bedrijven
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-[280px] h-[560px] rounded-[2.5rem] border border-white/15 shadow-[0_0_100px_rgba(123,61,255,0.25)] overflow-hidden">
            <Image src={img(photos.sneaker1, 700)} alt="Swyp feed preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/20" />
            <div className="absolute left-4 right-16 bottom-8 text-white">
              <p className="font-heading font-bold text-sm mb-1">NØRR</p>
              <p className="text-xs mb-2 opacity-80">Essential Oversized Hoodie</p>
              <span className="inline-block rounded-full bg-white text-indigo text-xs font-bold px-3 py-1.5">
                Bekijk product →
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="px-4 sm:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">Hoe Swyp werkt</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet/30 to-magenta/20 border border-white/10">
                  <s.icon size={26} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rewards" className="px-4 sm:px-6 py-20 bg-slate/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold mb-2">Echte rewards, geen gimmick</h2>
              <p className="text-white/55 text-sm max-w-md">
                Van gratis koffie tot hotel-upgrades — wissel je Tokens in bij merken die je al leuk vindt.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((r) => (
              <RewardCard key={r.id} reward={r} company={getCompany(r.companyId)} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { stat: "9", label: "aangesloten merken" },
            { stat: "4.7", label: "gemiddelde app-waardering", icon: Star },
            { stat: "€2,3M+", label: "uitgekeerde rewardwaarde" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-heading text-4xl font-extrabold mb-1 flex items-center justify-center gap-1">
                {s.icon && <s.icon size={26} className="fill-yellow-400 text-yellow-400" />}
                {s.stat}
              </p>
              <p className="text-sm text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet/20 to-magenta/10 p-10 sm:p-14">
          <h2 className="font-heading text-3xl font-bold mb-4">Klaar om te swipen?</h2>
          <p className="text-white/60 mb-8">Start vandaag nog en verdien je eerste Tokens binnen 5 minuten.</p>
          <Link href="/app">
            <Button size="lg" className="gap-2">
              Download Swyp <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <Logo size="sm" />
          <div className="flex gap-6">
            <Link href="/for-business" className="hover:text-white/70">Voor bedrijven</Link>
            <a href="#" className="hover:text-white/70">Privacy</a>
            <a href="#" className="hover:text-white/70">Voorwaarden</a>
          </div>
          <span>© 2026 Swyp. Swipe. Spaar. Profiteer.</span>
        </div>
      </footer>
    </div>
  );
}

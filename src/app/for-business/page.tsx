import Link from "next/link";
import { ArrowRight, Video, Users, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { CAMPAIGN_PRICE_EUR, CAMPAIGN_TOKEN_BUDGET_EUR } from "@/lib/businessTerms";

const VAT = 1.21;
const euro = (n: number) => `€${n.toLocaleString("nl-NL", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const priceInclVat = Math.round(CAMPAIGN_PRICE_EUR * VAT * 100) / 100;

const benefits = [
  { icon: Video, title: "Eén video, weinig gedoe", body: "Upload een video van maximaal 1 minuut, kies je beloning en je budget. Wij controleren hem en zetten hem live." },
  { icon: Users, title: "Mensen kijken omdat ze willen", body: "Kijkers verdienen punten met kijken, liken en bewaren. Die wisselen ze bij jou in voor de korting die jij kiest." },
  { icon: LineChart, title: "Zie wat er gebeurt", body: "Weergaven, hoeveel mensen tot het eind kijken, likes, opslagen, doorklikken en ingewisselde kortingen, live in je dashboard." },
  { icon: ShieldCheck, title: "Jij houdt de controle", body: "Het budget bepaal je zelf. Is het op, dan stopt de campagne vanzelf. Geen abonnement en geen verplichting." },
];

const steps = [
  { title: "Maak een account en upload je video", body: "Een gratis account is zo gemaakt. Een telefoonvideo in staand formaat is genoeg." },
  { title: "Kies je beloning en budget", body: "Bijvoorbeeld een koffie, een knipbeurt of 10% korting. Zo zien kijkers waarom het loont." },
  { title: "Kijkers wisselen in, jij ziet de cijfers", body: "Een kijker laat bij jou zijn code zien en krijgt de korting. In je dashboard zie je wat je video deed." },
];

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-indigo/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5 whitespace-nowrap">
            <Logo size="sm" />
            <span className="text-xs text-white/55 font-medium hidden sm:inline">voor bedrijven</span>
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
            Laat mensen in de buurt <span className="text-gradient-swyp">jouw bedrijf ontdekken.</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg mb-4 max-w-xl mx-auto leading-relaxed">
            Swyp is een app waarin mensen korte video&apos;s van lokale bedrijven bekijken en daar punten voor krijgen.
            Die wisselen ze bij jou in voor een korting. Jij zet één video live en ziet wat ermee gebeurt.
          </p>
          <p className="text-sm text-white/60 mb-8 max-w-xl mx-auto">
            Swyp is nieuw en het aantal kijkers is nog klein. Daarom beloven we geen aantallen, wel eerlijke cijfers.
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

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold mb-10 text-center">Zo werkt het</h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {steps.map((st, i) => (
              <li key={st.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet to-magenta text-sm font-bold">{i + 1}</span>
                <h3 className="font-heading font-bold mb-2">{st.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{st.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="prijs" className="px-4 sm:px-6 py-16 bg-slate/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">Wat het kost</h2>
          <p className="text-white/55 mb-8">Een account is gratis. Je betaalt per campagne, niet per maand.</p>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
            <p className="font-heading text-5xl font-extrabold">{euro(CAMPAIGN_PRICE_EUR)}</p>
            <p className="mt-1 text-white/60">per campagne van 30 dagen, exclusief btw ({euro(priceInclVat)} inclusief)</p>
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-white/70">
              <li>Daarin zit een tokenbudget tot {euro(CAMPAIGN_TOKEN_BUDGET_EUR)}: dat is wat kijkers in totaal kunnen verdienen. Is het op, dan stopt de campagne.</li>
              <li>De korting zelf geef jij aan je klant bij het afrekenen. Swyp rekent daar niets voor.</li>
              <li>Meer budget nodig? Bijvullen kost {euro(1.49)} per {euro(1)} tokenbudget.</li>
              <li>Je krijgt een factuur met 14 dagen betaaltermijn. Geen abonnement, je kunt zo stoppen.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">Je eigen dashboard</h2>
          <p className="text-white/55 mb-10 max-w-lg mx-auto">
            Dit zie je straks voor je eigen video&apos;s, live en met echte cijfers. Hieronder een voorbeeld.
          </p>
          <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <span className="absolute right-3 top-3 rounded-full bg-magenta/15 px-3 py-1.5 text-xs font-semibold text-magenta">
              Voorbeeld met fictieve cijfers
            </span>
            <div className="bg-slate p-6 pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              {[
                { label: "Weergaven", value: "1.240" },
                { label: "Uitgekeken", value: "62%" },
                { label: "Likes en opslagen", value: "9,4%" },
                { label: "Doorgeklikt", value: "4,1%" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
                  <p className="text-xs text-white/55 mb-1">{m.label}</p>
                  <p className="font-heading text-xl font-extrabold">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet/20 to-magenta/10 p-10 sm:p-14">
          <h2 className="font-heading text-3xl font-bold mb-4">Klaar om mee te doen?</h2>
          <p className="text-white/60 mb-8">Een account is gratis en je kunt rustig kijken hoe het werkt. Je betaalt pas als je een campagne start.</p>
          <Link href="/business/signup">
            <Button size="lg" className="gap-2">
              Meld je bedrijf aan <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/55">
          <span className="font-heading font-bold text-white/70">
            Sw<span className="text-magenta">yp</span>
          </span>
          <span>© 2026 Swyp. Swipe. Spaar. Profiteer.</span>
        </div>
      </footer>
    </div>
  );
}

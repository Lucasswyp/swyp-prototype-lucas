import Link from "next/link";
import { Share, SquarePlus, MoreVertical } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "Swyp op je beginscherm | Swyp",
  description: "Zet Swyp als app op het beginscherm van je iPhone of Android-telefoon, zonder App Store.",
};

const iphone = [
  { icon: Share, title: "Open Swyp in Safari", body: "Ga naar swyp.it/app. Gebruik Safari, dat werkt het betrouwbaarst." },
  { icon: Share, title: "Tik op de deelknop", body: "Het vierkantje met een pijl omhoog, onderin of bovenin het scherm." },
  { icon: SquarePlus, title: "Kies “Zet op beginscherm”", body: "Scroll een stukje omlaag in het menu als je het niet meteen ziet." },
  { icon: SquarePlus, title: "Tik op “Voeg toe”", body: "Swyp staat nu als app op je beginscherm en opent schermvullend." },
];

const android = [
  { icon: MoreVertical, title: "Open Swyp in Chrome", body: "Ga naar swyp.it/app en tik rechtsboven op de drie puntjes." },
  { icon: SquarePlus, title: "Kies “App installeren”", body: "Soms heet het “Toevoegen aan startscherm”. Bevestig met “Installeren”." },
];

function Steps({ items }: { items: typeof iphone }) {
  return (
    <ol className="grid gap-3">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-magenta text-sm font-bold text-white">{i + 1}</span>
          <div>
            <p className="flex items-center gap-2 font-semibold text-white">
              {s.title}
              <s.icon size={16} className="text-white/50" aria-hidden />
            </p>
            <p className="text-sm text-white/65">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InstallPage() {
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-indigo/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-xl mx-auto flex flex-col gap-8 text-white/70 leading-relaxed">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-3">Swyp op je beginscherm</h1>
            <p>
              Je hoeft niets te downloaden uit een winkel. Zet Swyp op je beginscherm en het opent als een gewone app, schermvullend en zonder
              adresbalk.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold text-white">iPhone</h2>
            <Steps items={iphone} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold text-white">Android</h2>
            <Steps items={android} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
            <p className="mb-1 font-semibold text-white">Goed om te weten</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Je logt één keer opnieuw in in de app op je beginscherm, want een iPhone houdt die gescheiden van Safari. Je tokens staan op je account en blijven bewaard.</li>
              <li>Pushmeldingen werken nog niet op deze manier. Die komen met de app uit de App Store.</li>
              <li>Lukt het niet, mail ons via de <Link href="/support" className="underline text-white">supportpagina</Link>.</li>
            </ul>
          </div>

          <Link href="/app" className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-indigo">
            Open Swyp
          </Link>
        </div>
      </section>
    </div>
  );
}

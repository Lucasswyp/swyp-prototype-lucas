import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "Support | Swyp",
  description: "Hulp bij Swyp: veelgestelde vragen, een probleem melden en contact opnemen.",
};

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Ik ben mijn wachtwoord vergeten",
    a: (
      <>
        Ga naar <Link href="/wachtwoord-vergeten" className="underline text-white">swyp.it/wachtwoord-vergeten</Link> en vul je e-mailadres in. Je krijgt een link om een nieuw wachtwoord te kiezen.
      </>
    ),
  },
  {
    q: "Hoe verwijder ik mijn account?",
    a: (
      <>
        Ga in de app naar Profiel, dan Instellingen en kies &quot;Account verwijderen&quot;. Meer uitleg staat op{" "}
        <Link href="/account-verwijderen" className="underline text-white">swyp.it/account-verwijderen</Link>. Je gegevens en berichten worden dan gewist.
      </>
    ),
  },
  {
    q: "Hoe werken Swyp Tokens?",
    a: "Je verdient tokens door video's te kijken, te liken, op te slaan, door te klikken, bedrijven te volgen en video's naar vrienden door te sturen. 1 token is €0,01 waard. Je wisselt ze in bij Rewards voor kortingen van bedrijven. Tokens hebben geen geldwaarde buiten Swyp.",
  },
  {
    q: "Mijn kortingscode werkt niet",
    a: "Bekijk je code onder Rewards, dan Mijn rewards. Staat de code er en weigert het bedrijf hem? Stuur ons een mail met de naam van het bedrijf en de code, dan zoeken we het uit.",
  },
  {
    q: "Hoe meld ik een video, bedrijf of bericht?",
    a: "Tik op de drie puntjes bij een video of in een gesprek en kies Rapporteren. Je kunt daar ook iemand blokkeren. We kijken meldingen zo snel mogelijk na, meestal binnen 24 uur.",
  },
  {
    q: "Ik krijg geen pushmeldingen",
    a: "Controleer op je iPhone onder Instellingen, dan Meldingen, dan Swyp of meldingen aan staan. Open daarna de app opnieuw.",
  },
  {
    q: "Ik ben een bedrijf en wil adverteren",
    a: (
      <>
        Meld je aan via <Link href="/business/signup" className="underline text-white">swyp.it/business/signup</Link>. Hulp nodig bij je campagne of codes? Mail ons.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-indigo/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-2xl mx-auto flex flex-col gap-8 text-white/70 leading-relaxed text-sm sm:text-base">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-3">Support</h1>
            <p>
              Hulp nodig, een fout gevonden of een idee? Mail ons op{" "}
              <a href="mailto:lucas@swyp.it" className="underline text-white">lucas@swyp.it</a>. We reageren meestal binnen één werkdag. Vermeld je
              gebruikersnaam en wat er misging; een screenshot helpt.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-xl font-bold text-white">Veelgestelde vragen</h2>
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-heading text-base font-bold text-white mb-1.5">{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>

          <p className="text-white/50">
            Zie ook ons <Link href="/privacy" className="underline">privacybeleid</Link> en de{" "}
            <Link href="/terms" className="underline">voorwaarden</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}

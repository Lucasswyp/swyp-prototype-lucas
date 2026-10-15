import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Account verwijderen | Swyp" };

export default function DeleteAccountPage() {
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
        <div className="max-w-2xl mx-auto flex flex-col gap-6 text-white/70 leading-relaxed text-sm sm:text-base">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">Account verwijderen</h1>
          <p>Je kunt je Swyp-account op elk moment zelf verwijderen. Dat werkt zo:</p>
          <ol className="list-decimal pl-5 flex flex-col gap-1.5">
            <li>Log in bij Swyp.</li>
            <li>Consumenten: ga naar Profiel, dan Instellingen. Bedrijven: ga naar Settings in het dashboard.</li>
            <li>Kies &quot;Account verwijderen&quot;, typ VERWIJDER en bevestig.</li>
          </ol>
          <p>
            Daarna worden je profiel, tegoed, opgeslagen producten en gevolgde bedrijven verwijderd. Bij een
            bedrijfsaccount verdwijnen ook je producten, campagnes, advertenties, video&apos;s en beloningen. Dit kan niet
            ongedaan worden gemaakt.
          </p>
          <p>
            Kom je er niet uit, of heb je geen toegang meer tot je account? Mail ons via{" "}
            <a href="mailto:lucas@swyp.it" className="underline text-white">
              lucas@swyp.it
            </a>{" "}
            vanaf het e-mailadres van je account, dan verwijderen wij het voor je.
          </p>
        </div>
      </section>
    </div>
  );
}

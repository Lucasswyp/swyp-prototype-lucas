import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function TermsPage() {
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
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold mb-2">Gebruiksvoorwaarden</h1>
          <p className="text-white/40 text-sm mb-10">Laatst bijgewerkt: 23 september 2026</p>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 mb-10">
            Concepttekst — nog niet juridisch gecontroleerd door een jurist. De bedrijfsgegevens hieronder kloppen,
            maar laat de tekst zelf nog nakijken voordat je &apos;m als definitieve voorwaarden gebruikt.
          </div>

          <div className="flex flex-col gap-8 text-white/70 leading-relaxed text-sm sm:text-base">
            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">1. Over deze voorwaarden</h2>
              <p>
                Deze voorwaarden gelden voor het gebruik van Swyp, aangeboden door Swyp V.O.F. (KVK 42132440,
                Sparresholm 145, 2133 BL Hoofddorp). Door een account aan te maken of Swyp te gebruiken, ga je akkoord
                met deze voorwaarden.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">2. Je account</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Je bent zelf verantwoordelijk voor het geheimhouden van je inloggegevens.</li>
                <li>Je gebruikersnaam en profielgegevens moeten kloppen en mogen niemand anders misleiden.</li>
                <li>Je moet minimaal 16 jaar oud zijn om een Swyp-account aan te maken.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">3. Swyp Tokens en beloningen</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Swyp Tokens hebben geen geldwaarde buiten het platform en zijn niet inwisselbaar voor contant geld.</li>
                <li>We kunnen de manier waarop Tokens verdiend of ingewisseld worden aanpassen om misbruik te voorkomen.</li>
                <li>
                  Bij misbruik (zoals nepaccounts, geautomatiseerd swipen of het omzeilen van beveiligingen) kunnen we
                  Tokens intrekken en je account schorsen of verwijderen.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">4. Berichten en gedrag</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Je bent zelf verantwoordelijk voor wat je naar anderen stuurt. Pest, bedreig of lastigval niemand en stuur geen illegale, seksuele of misleidende inhoud.</li>
                <li>Je krijgt Swyp Tokens voor het doorsturen van een video, maar niet voor het spammen van berichten of het gebruiken van meerdere accounts. We beperken het aantal beloonde keren per dag.</li>
                <li>Je kunt gebruikers en berichten melden en gebruikers blokkeren. Bij overtredingen kunnen we berichten verwijderen en accounts beperken of verwijderen.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">5. Adverteerders en producten</h2>
              <p>
                Swyp is een platform dat consumenten en bedrijven met elkaar in contact brengt. We zijn niet
                verantwoordelijk voor de kwaliteit, levering of inhoud van producten en aanbiedingen van bedrijven die
                op Swyp adverteren — geschillen daarover los je rechtstreeks met dat bedrijf op.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">6. Intellectueel eigendom</h2>
              <p>
                Alle rechten op de Swyp-app, het merk en de content die wij plaatsen, blijven bij Swyp V.O.F. Je mag
                Swyp niet kopiëren, namaken of reverse-engineeren zonder onze toestemming.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">7. Aansprakelijkheid</h2>
              <p>
                Swyp wordt aangeboden &quot;zoals het is&quot;. Voor zover wettelijk toegestaan zijn wij niet
                aansprakelijk voor indirecte schade die voortvloeit uit het gebruik van de app.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">8. Beëindiging</h2>
              <p>
                Je kunt je account op elk moment verwijderen. Wij kunnen jouw account schorsen of verwijderen bij
                overtreding van deze voorwaarden.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">9. Wijzigingen en toepasselijk recht</h2>
              <p>
                We kunnen deze voorwaarden van tijd tot tijd aanpassen. Op deze voorwaarden is Nederlands recht van
                toepassing.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">10. Contact</h2>
              <p>
                Vragen over deze voorwaarden? Mail naar{" "}
                <a href="mailto:lucas@swyp.it" className="text-white/70 underline">lucas@swyp.it</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function PrivacyPage() {
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
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold mb-2">Privacybeleid</h1>
          <p className="text-white/40 text-sm mb-10">Laatst bijgewerkt: 22 oktober 2026</p>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 mb-10">
            Concepttekst — nog niet juridisch gecontroleerd door een jurist. De bedrijfsgegevens hieronder kloppen,
            maar laat de tekst zelf nog nakijken voordat je &apos;m als definitief privacybeleid gebruikt.
          </div>

          <div className="flex flex-col gap-8 text-white/70 leading-relaxed text-sm sm:text-base">
            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">1. Wie wij zijn</h2>
              <p>
                Swyp (&quot;Swyp&quot;, &quot;wij&quot;, &quot;we&quot;) is de aanbieder van de Swyp-app en -website.
                Dit privacybeleid legt uit welke persoonsgegevens we verzamelen wanneer je Swyp gebruikt, waarom we
                dat doen, en welke rechten je hebt.
              </p>
              <p className="mt-2 text-white/50">
                Aanbieder: Swyp V.O.F. · KVK: 42132440 · Adres: Sparresholm 145, 2133 BL Hoofddorp · Contact:{" "}
                <a href="mailto:lucas@swyp.it" className="text-white/70 underline">lucas@swyp.it</a>
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">2. Welke gegevens we verzamelen</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Accountgegevens: naam, gebruikersnaam, e-mailadres, profielfoto.</li>
                <li>Profielgegevens: geslacht en geboortedatum. Je geboortedatum is verplicht om vast te stellen dat je minimaal 16 jaar bent. We vragen niet naar etniciteit of andere gevoelige gegevens.</li>
                <li>
                  Bij inloggen met Google of Apple: je naam en e-mailadres (en bij Google ook je profielfoto) zoals
                  bekend bij dat account. Swyp krijgt geen toegang tot je wachtwoord of andere diensten van Google of
                  Apple.
                </li>
                <li>
                  Gebruiksgegevens: welke advertenties je bekijkt, liket, bewaart of aanklikt, je Swyp Tokens-saldo,
                  je swipe-streak, en welke bedrijven/producten je volgt of opslaat.
                </li>
                <li>
                  Berichten: wat je naar andere gebruikers stuurt (tekst en doorgestuurde video&apos;s), je emoji-reacties,
                  wie je hebt geblokkeerd en meldingen die je zelf indient.
                </li>
                <li>
                  Pushmeldingen: als je meldingen toestaat, bewaren we een apparaat-token van Apple om je een melding te
                  kunnen sturen (bijvoorbeeld bij een nieuw bericht of een streak-herinnering).
                </li>
                <li>
                  Anonieme meetgegevens: bij het bekijken van advertenties registreren we een weergave of klik met een
                  willekeurig apparaat-ID dat niet aan je account gekoppeld is, om campagnestatistieken te kunnen tonen.
                </li>
                <li>Technische gegevens: IP-adres en basale apparaatgegevens, verzameld door onze hostingpartijen.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">3. Waarvoor we deze gegevens gebruiken</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Je account aanmaken, beveiligen en beheren.</li>
                <li>Je Swyp Tokens, streaks en beloningen correct bijhouden en uitkeren, ook voor het doorsturen van video&apos;s.</li>
                <li>Berichten tussen gebruikers mogelijk maken en je een pushmelding sturen als je een bericht krijgt.</li>
                <li>Advertenties en aanbevelingen tonen die aansluiten bij jouw interesses.</li>
                <li>Misbruik, fraude en spam opsporen en voorkomen.</li>
                <li>Je op de hoogte houden van belangrijke wijzigingen aan de dienst.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">4. Grondslag voor verwerking</h2>
              <p>
                We verwerken je gegevens omdat dit nodig is om de overeenkomst met jou (het gebruik van Swyp) uit te
                voeren, omdat we een gerechtvaardigd belang hebben (fraudepreventie, dienstverbetering), of omdat je
                hier expliciet toestemming voor hebt gegeven — dit laatste geldt in het bijzonder voor het veld
                geslacht.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">5. Delen met derden</h2>
              <p>We delen gegevens alleen met partijen die nodig zijn om Swyp te laten draaien:</p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
                <li><strong className="text-white/80">Supabase</strong> — database, authenticatie en bestandsopslag.</li>
                <li><strong className="text-white/80">Vercel</strong> — hosting van de website en app.</li>
                <li><strong className="text-white/80">Google / Apple</strong> — alleen wanneer je zelf kiest om met dat account in te loggen.</li>
                <li><strong className="text-white/80">Sentry</strong> — foutregistratie, zodat we technische problemen kunnen opsporen en oplossen.</li>
                <li><strong className="text-white/80">PostHog</strong> — productanalyse (welke schermen en knoppen gebruikt worden), zodat we Swyp kunnen verbeteren.</li>
                <li><strong className="text-white/80">Mux</strong> — opslag en afspelen van video&apos;s.</li>
                <li><strong className="text-white/80">Algolia</strong> — de zoekfunctie (bevat alleen openbare bedrijven, producten en advertenties, geen persoonsgegevens van gebruikers).</li>
                <li><strong className="text-white/80">Apple Push Notification service</strong> — het afleveren van pushmeldingen op iPhones.</li>
              </ul>
              <p className="mt-2">
                We verkopen je gegevens nooit aan derden. Bedrijven die op Swyp adverteren zien alleen geaggregeerde,
                niet-herleidbare statistieken over hun campagnes, tenzij je zelf een reward bij hen inwisselt. Zo zien
                ze hoeveel mensen een video bekeken, geliket, bewaard, aangeklikt of doorgestuurd hebben. Een
                verdeling naar leeftijdsgroep en geslacht tonen we pas vanaf 10 betrokken kijkers, en groepen kleiner
                dan 5 personen worden samengevoegd. Bedrijven zien nooit wie je bent en nooit je berichten.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">6. Bewaartermijn</h2>
              <p>
                We bewaren je gegevens zolang je account actief is. Je kunt je account zelf direct verwijderen in de
                app (Instellingen) of via{" "}
                <Link href="/account-verwijderen" className="underline text-white">
                  swyp.it/account-verwijderen
                </Link>
                ; daarbij worden je persoonsgegevens meteen gewist, tenzij we iets wettelijk langer moeten bewaren. Ook je
                berichten, apparaat-tokens en blokkades worden dan verwijderd. Anonieme meetgegevens over weergaven
                (zonder naam of account) kunnen we langer bewaren om campagnestatistieken van bedrijven te tonen.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">7. Berichten en veiligheid</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Berichten zijn alleen zichtbaar voor jou en de persoon met wie je chat. We lezen ze niet routinematig.</li>
                <li>
                  Berichten zijn niet end-to-end versleuteld. Als iemand een bericht of gebruiker meldt, kunnen wij dat
                  bericht bekijken om te beoordelen of de regels zijn overtreden.
                </li>
                <li>Je kunt iemand blokkeren: dan kunnen jullie elkaar niet meer vinden of berichten sturen.</li>
                <li>Deel geen gevoelige gegevens zoals wachtwoorden, bankgegevens of je adres in een bericht.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">8. Jouw rechten</h2>
              <p>
                Je hebt recht op inzage, correctie en verwijdering van je gegevens, en op bezwaar of beperking van de
                verwerking. Neem hiervoor contact op via{" "}
                <a href="mailto:lucas@swyp.it" className="text-white/70 underline">lucas@swyp.it</a>. Je kunt ook een
                klacht indienen bij de Autoriteit Persoonsgegevens.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">9. Wijzigingen</h2>
              <p>
                We kunnen dit privacybeleid van tijd tot tijd bijwerken. Belangrijke wijzigingen laten we via de app
                of per e-mail weten.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

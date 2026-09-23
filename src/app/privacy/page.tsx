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
          <p className="text-white/40 text-sm mb-10">Laatst bijgewerkt: 23 september 2026</p>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 mb-10">
            Concepttekst — nog niet juridisch gecontroleerd. Vul de placeholders (bedrijfsgegevens, KVK-nummer,
            adres) aan en laat deze tekst nakijken voordat je 'm als definitief privacybeleid gebruikt.
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
                Aanbieder: [bedrijfsnaam] · KVK: [KVK-nummer] · Adres: [adres] · Contact:{" "}
                <a href="mailto:lucas@swyp.it" className="text-white/70 underline">lucas@swyp.it</a>
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">2. Welke gegevens we verzamelen</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Accountgegevens: naam, gebruikersnaam, e-mailadres, profielfoto.</li>
                <li>Optionele profielgegevens: geslacht, geboortedatum, achtergrond — je kiest zelf of je deze invult.</li>
                <li>
                  Bij inloggen met Google: je naam, e-mailadres en profielfoto zoals bekend bij je Google-account.
                  Swyp krijgt geen toegang tot je Google-wachtwoord of andere Google-diensten.
                </li>
                <li>
                  Gebruiksgegevens: welke advertenties je bekijkt, liket, bewaart of aanklikt, je Swyp Tokens-saldo,
                  je swipe-streak, en welke bedrijven/producten je volgt of opslaat.
                </li>
                <li>Technische gegevens: apparaat-ID, IP-adres en basale apparaatgegevens, verzameld door onze hostingpartijen.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">3. Waarvoor we deze gegevens gebruiken</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Je account aanmaken, beveiligen en beheren.</li>
                <li>Je Swyp Tokens, streaks en beloningen correct bijhouden en uitkeren.</li>
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
                hier expliciet toestemming voor hebt gegeven — dit laatste geldt in het bijzonder voor de optionele
                velden geslacht, geboortedatum en achtergrond.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">5. Delen met derden</h2>
              <p>We delen gegevens alleen met partijen die nodig zijn om Swyp te laten draaien:</p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
                <li><strong className="text-white/80">Supabase</strong> — database, authenticatie en bestandsopslag.</li>
                <li><strong className="text-white/80">Vercel</strong> — hosting van de website en app.</li>
                <li><strong className="text-white/80">Google</strong> — alleen wanneer je zelf kiest om met je Google-account in te loggen.</li>
              </ul>
              <p className="mt-2">
                We verkopen je gegevens nooit aan derden. Bedrijven die op Swyp adverteren zien alleen geaggregeerde,
                niet-herleidbare statistieken over hun campagnes, tenzij je zelf een reward bij hen inwisselt.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">6. Bewaartermijn</h2>
              <p>
                We bewaren je gegevens zolang je account actief is. Vraag je je account te verwijderen, dan
                verwijderen of anonimiseren we je persoonsgegevens binnen een redelijke termijn, tenzij we iets
                wettelijk langer moeten bewaren.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">7. Jouw rechten</h2>
              <p>
                Je hebt recht op inzage, correctie en verwijdering van je gegevens, en op bezwaar of beperking van de
                verwerking. Neem hiervoor contact op via{" "}
                <a href="mailto:lucas@swyp.it" className="text-white/70 underline">lucas@swyp.it</a>. Je kunt ook een
                klacht indienen bij de Autoriteit Persoonsgegevens.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">8. Wijzigingen</h2>
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

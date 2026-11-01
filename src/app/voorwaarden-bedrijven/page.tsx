import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { BUSINESS_TERMS_VERSION, CAMPAIGN_PRICE_EUR, CAMPAIGN_TOKEN_BUDGET_EUR } from "@/lib/businessTerms";

export const metadata = {
  title: "Voorwaarden voor bedrijven | Swyp",
  description: "De afspraken tussen Swyp en bedrijven die adverteren: inhoud, campagnes, tokens, prijs en aansprakelijkheid.",
};

const H2 = "font-heading text-lg font-bold text-white mb-2";

export default function BusinessTermsPage() {
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
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold mb-2">Voorwaarden voor bedrijven</h1>
          <p className="text-white/40 text-sm mb-10">Versie {BUSINESS_TERMS_VERSION}</p>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 mb-10">
            Concepttekst: nog niet juridisch gecontroleerd door een jurist. De bedrijfsgegevens kloppen; laat de tekst nakijken voordat je hem als definitief
            gebruikt.
          </div>

          <div className="flex flex-col gap-8 text-white/70 leading-relaxed text-sm sm:text-base">
            <div>
              <h2 className={H2}>1. Wie wij zijn</h2>
              <p>
                Swyp V.O.F. (&quot;Swyp&quot;) · KVK 42132440 · Sparresholm 145, 2133 BL Hoofddorp ·{" "}
                <a href="mailto:lucas@swyp.it" className="underline text-white/80">lucas@swyp.it</a>. Deze voorwaarden gelden voor bedrijven die via Swyp
                adverteren (&quot;jij&quot;). Voor gebruikers van de app gelden de{" "}
                <Link href="/terms" className="underline text-white/80">gebruiksvoorwaarden</Link>.
              </p>
            </div>

            <div>
              <h2 className={H2}>2. Je account</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Je meldt je aan namens een bedrijf en bent bevoegd om dat bedrijf te binden.</li>
                <li>Je gegevens (bedrijfsnaam, plaats, contact) moeten kloppen. Je bent verantwoordelijk voor alles wat via je account gebeurt.</li>
                <li>Wij kunnen een bedrijf vragen zich te legitimeren, bijvoorbeeld met een KVK-uittreksel, voordat een campagne live gaat.</li>
              </ul>
            </div>

            <div>
              <h2 className={H2}>3. Jouw inhoud</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Je mag alleen video&apos;s, afbeeldingen en teksten uploaden waarvan je zelf de rechten hebt, inclusief muziek en de toestemming van mensen die in beeld zijn.</li>
                <li>Je geeft Swyp toestemming om je inhoud te tonen in de app, in zoekresultaten en in promotie van Swyp, zolang je campagne loopt.</li>
                <li>
                  Niet toegestaan: misleidende of onjuiste claims, illegale producten, inhoud die discrimineert, bedreigt of seksueel expliciet is, en
                  advertenties voor gokken, tabak of vapes. Voor alcohol gelden aanvullende afspraken; vraag ons eerst.
                </li>
                <li>
                  Elke advertentie wordt vooraf beoordeeld. Wij mogen een advertentie weigeren, offline halen of verwijderen als hij tegen deze regels of de wet
                  is, ook als hij eerder was goedgekeurd. Wij vertellen je waarom.
                </li>
              </ul>
            </div>

            <div>
              <h2 className={H2}>4. Campagnes en tokens</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>
                  Een campagne duurt maximaal 30 dagen. Je stelt een tokenbudget in. Kijkers verdienen tokens voor kijken, liken, bewaren, doorklikken en doorsturen;
                  1 token is €0,01. Zodra het budget op is, stopt de campagne vanzelf. Je kunt het budget bijvullen.
                </li>
                <li>Tokens zijn geen geld, hebben geen waarde buiten Swyp en zijn niet uit te betalen.</li>
                <li>Wij mogen de regels voor het verdienen van tokens aanpassen om misbruik te voorkomen, bijvoorbeeld met dagmaxima.</li>
                <li>Wij geven geen garantie op aantallen weergaven, kliks of verkopen. Swyp is een nieuw platform en de bereikcijfers zijn nog klein.</li>
              </ul>
            </div>

            <div>
              <h2 className={H2}>5. Beloningen en kortingscodes</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Een beloning die jij aanbiedt (bijvoorbeeld 10% korting) honoreer jij zelf, op de voorwaarden die bij de beloning staan.</li>
                <li>Een kijker die tokens inwisselt, krijgt een code. Jij controleert en markeert die in het dashboard als gebruikt. Een code werkt één keer.</li>
                <li>Heb je eigen codes geüpload en zijn ze op, dan kunnen kijkers die beloning niet meer inwisselen. Zorg dat je voorraad klopt.</li>
                <li>Swyp is geen partij bij de koop tussen jou en een klant en is niet verantwoordelijk voor levering, kwaliteit of klachten.</li>
              </ul>
            </div>

            <div>
              <h2 className={H2}>6. Prijs en betaling</h2>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>
                  Een campagne van 30 dagen kost €{CAMPAIGN_PRICE_EUR},00 exclusief btw, inclusief een tokenbudget van maximaal €{CAMPAIGN_TOKEN_BUDGET_EUR}. Bijvullen kost €1,49 per €1 tokenbudget, ook
                  exclusief btw.
                </li>
                <li>Lanceringspartners krijgen hun eerste campagne gratis en een tweede gratis als zij feedback geven, zoals vooraf afgesproken.</li>
                <li>Wij sturen een factuur. Betaal binnen 14 dagen. Bij niet op tijd betalen mogen wij je campagnes pauzeren.</li>
                <li>Een lopende campagne wordt niet terugbetaald, behalve als wij hem niet konden leveren.</li>
              </ul>
            </div>

            <div>
              <h2 className={H2}>7. Gegevens</h2>
              <p>
                Je ziet alleen aantallen: weergaven, likes, opslagen, kliks, doorgestuurd, en vanaf 10 betrokken kijkers een verdeling naar leeftijdsgroep en
                geslacht. Je krijgt geen namen, e-mailadressen of berichten van gebruikers. Gebruik de statistieken alleen voor je eigen campagnes en deel ze niet
                om personen te herleiden. Zie ook ons <Link href="/privacy" className="underline text-white/80">privacybeleid</Link>.
              </p>
            </div>

            <div>
              <h2 className={H2}>8. Aansprakelijkheid</h2>
              <p>
                Swyp is niet aansprakelijk voor indirecte schade of gederfde omzet. Is Swyp wel aansprakelijk, dan is dat beperkt tot het bedrag dat je in de
                laatste drie maanden aan Swyp hebt betaald. Dit geldt niet bij opzet of grove schuld. Je vrijwaart Swyp voor claims van derden over jouw inhoud
                of jouw aanbiedingen.
              </p>
            </div>

            <div>
              <h2 className={H2}>9. Duur en beëindiging</h2>
              <p>
                Je kunt je account en campagnes op elk moment stoppen, ook via{" "}
                <Link href="/account-verwijderen" className="underline text-white/80">swyp.it/account-verwijderen</Link>. Wij mogen een account of campagne
                beperken of beëindigen bij overtreding van deze voorwaarden, met opgave van reden. Al betaalde, al gestarte campagnes lopen af tenzij de
                overtreding dat onmogelijk maakt.
              </p>
            </div>

            <div>
              <h2 className={H2}>10. Wijzigingen en toepasselijk recht</h2>
              <p>
                Wij kunnen deze voorwaarden wijzigen; bij een inhoudelijke wijziging laten wij het je weten en vragen we opnieuw akkoord. Op deze voorwaarden is
                Nederlands recht van toepassing. Geschillen leggen we voor aan de bevoegde rechter in Nederland.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

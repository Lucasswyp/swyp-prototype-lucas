# App Store-inzending Swyp

Alles wat je nodig hebt om Swyp in App Store Connect te zetten, in de volgorde van het formulier. Stand: 22 oktober 2026, versie 1.0 (build 18).

Wat al in de app zit: privacy-manifest (`ios/App/App/PrivacyInfo.xcprivacy`), beschrijvingen bij camera en foto's, accountverwijdering in de app, Inloggen met Apple, melden en blokkeren, openbare supportpagina, privacybeleid en voorwaarden.

## 1. App-informatie

| Veld | Waarde |
| --- | --- |
| Naam | Swyp |
| Ondertitel (max 30) | Swipe. Spaar. Profiteer. |
| Bundle ID | it.swyp.app |
| Primaire categorie | Winkelen (Shopping) |
| Tweede categorie | Lifestyle |
| Support-URL | https://swyp.it/support |
| Marketing-URL | https://swyp.it |
| Privacybeleid-URL | https://swyp.it/privacy |
| Copyright | © 2026 Swyp V.O.F. |
| Prijs | Gratis |

**Zoekwoorden (exact 100 tekens, scheiden met komma's, zonder spaties):**

```
adverteren,korting,rewards,videos,deals,sparen,punten,winkelen,cashback,vrienden,tokens,aanbiedingen
```

Zet de naam van de app en de categorie niet in de zoekwoorden; Apple telt die al mee.

**Promotietekst (max 170, aanpasbaar zonder nieuwe versie):**

> Swipe door korte video's van bedrijven, verdien Swyp Tokens en wissel ze in voor echte kortingen. Stuur video's naar vrienden en verdien extra.

**Beschrijving (max 4000):**

> Swyp is de app waar adverteren eindelijk iets oplevert voor jou.
>
> Swipe door korte video's van bedrijven. Kijk, like, bewaar of klik door en verdien Swyp Tokens. Wissel je tokens in bij Rewards voor echte kortingen en aanbiedingen.
>
> HOE HET WERKT
> • Swipe door je feed met video's van bedrijven.
> • Verdien tokens voor kijken, liken, bewaren, doorklikken en bedrijven volgen.
> • Stuur een video naar een vriend en verdien extra tokens.
> • Wissel je tokens in voor kortingscodes van bedrijven.
> • Hou je streak vast: elke dag swipen levert een bonus op.
>
> BERICHTEN
> Stuur video's naar vrienden, chat met ze en reageer met een emoji. Je kunt gebruikers blokkeren en melden.
>
> VOOR BEDRIJVEN
> Adverteer met video, zet je eigen kortingscodes in en zie in je dashboard wat het oplevert. Meld je aan op swyp.it.
>
> JE PRIVACY
> Je moet minimaal 16 jaar zijn. We verkopen je gegevens niet. Je kunt je account en al je gegevens zelf in de app verwijderen.
>
> 1 Swyp Token is €0,01 waard binnen Swyp en niet uit te betalen als geld.

**Wat is er nieuw (versie 1.0):** `Eerste versie van Swyp. Veel plezier met swipen en sparen!`

## 2. Leeftijdsclassificatie

Vul de vragenlijst eerlijk in. Wat voor Swyp telt:

- **Door gebruikers gegenereerde inhoud / berichten tussen gebruikers:** ja (chat en doorgestuurde video's). Dat verhoogt de classificatie.
- **Onbeperkte toegang tot het web:** nee.
- **Gokken, loten of echt geld winnen:** nee. Tokens zijn geen geld en niet uit te betalen.
- **Alcohol, tabak, drugs, geweld, seksuele inhoud:** de app zelf bevat dat niet, maar bedrijven kunnen advertenties plaatsen. Alles gaat eerst langs moderatie (`/admin/ads`). Kies hier "zelden/matig" als je advertenties van bijvoorbeeld bars of restaurants verwacht.
- **Minimumleeftijd in de app zelf:** 16 (geboortedatum verplicht).

Verwacht een classificatie rond 13+ tot 16+. Kies niet lager om de reviewer te sussen: een onjuist antwoord is een reden voor afwijzing.

## 3. App Privacy (de voedingswaarde-labels)

Tracking: **Nee.** Swyp volgt gebruikers niet over andere apps of websites en gebruikt geen advertentie-ID.

Gegevens die aan de gebruiker gekoppeld zijn (komen overeen met `PrivacyInfo.xcprivacy`):

| Apple-categorie | Wat bij Swyp | Doel | Gekoppeld aan gebruiker | Tracking |
| --- | --- | --- | --- | --- |
| Contactgegevens, e-mailadres | e-mail bij aanmelden | App-functionaliteit | Ja | Nee |
| Contactgegevens, naam | naam en gebruikersnaam | App-functionaliteit | Ja | Nee |
| Identificatoren, gebruikers-ID | account-id | App-functionaliteit | Ja | Nee |
| Identificatoren, apparaat-ID | push-token | App-functionaliteit | Ja | Nee |
| Gebruikersinhoud, foto's of video's | profielfoto | App-functionaliteit | Ja | Nee |
| Gebruikersinhoud, overige | berichten en reacties | App-functionaliteit | Ja | Nee |
| Gebruik, productinteractie | kijken, liken, opslaan, klikken, volgen | App-functionaliteit en analyse | Ja | Nee |
| Overige gegevens | geslacht en geboortedatum | App-functionaliteit | Ja | Nee |

Niet gekoppeld aan de gebruiker:

| Apple-categorie | Wat | Doel |
| --- | --- | --- |
| Diagnostiek, crashgegevens | foutmeldingen (Sentry) | App-functionaliteit |
| Diagnostiek, prestatiegegevens | laadtijden (Sentry) | App-functionaliteit |

Let op: de anonieme meetgegevens over weergaven (willekeurig apparaat-ID, niet gekoppeld) hoeven niet als gekoppeld te worden opgegeven. Zoekopdrachten gaan naar Algolia; geef "Zoekgeschiedenis" niet gekoppeld op als je die instelling in Algolia aan hebt laten staan. Controleer dit voor je indient.

## 4. Notities voor de reviewer

Plak dit in "Notities voor beoordeling" en vul de demo-gegevens in (jij maakt dat account zelf aan en vult het wachtwoord zelf in):

> Swyp is een app waarin gebruikers video-advertenties van bedrijven bekijken en daarmee Swyp Tokens verdienen, die ze inwisselen voor kortingscodes. Tokens hebben geen geldwaarde en zijn niet uit te betalen.
>
> Demo-account (consument): [e-mail] / [wachtwoord]
> Demo-account (bedrijf): [e-mail] / [wachtwoord] via https://swyp.it/business/login
>
> Zo test je de belangrijkste dingen:
> 1. Open de feed (tabblad Home) en kijk een video bijna helemaal uit; je krijgt tokens (zie je saldo).
> 2. Tik op het deel-icoon en stuur een video naar de gebruiker "[tweede demo-gebruikersnaam]" (tabblad Berichten).
> 3. Rewards: wissel tokens in voor een kortingscode.
> 4. Account verwijderen: Profiel, Instellingen, Account verwijderen.
>
> Door gebruikers gegenereerde inhoud (richtlijn 1.2): gebruikers kunnen video's, bedrijven, berichten en gebruikers melden en gebruikers blokkeren (drie puntjes). Voorwaarden met regels voor gedrag staan op https://swyp.it/terms (onderdeel 4). Advertenties van bedrijven worden vooraf gemodereerd. Meldingen worden binnen 24 uur bekeken via lucas@swyp.it. Support: https://swyp.it/support.
>
> Inloggen: e-mail, Google en Inloggen met Apple. Minimumleeftijd is 16.

## 5. Risico: richtlijn 4.2 (minimale functionaliteit)

Swyp is een web-app in een iOS-schil (Capacitor). Apple wijst apps af die "alleen een website verpakt" zijn. Wat je kunt noemen in de notities, en wat er al in zit:

- Pushmeldingen (streak-herinnering en nieuwe berichten).
- Inloggen met Apple.
- Toegang tot camera en fotobibliotheek voor je profielfoto.
- Delen via het systeem en universele links (na build 18 en Associated Domains).
- Een eigen economie met tokens, beloningen en kortingscodes die niet op de website te gebruiken is zonder account.

Wil je dit risico verkleinen? De goedkoopste winst is haptische feedback bij liken en een tokenbonus, en een native share-sheet. Dat kan ik toevoegen, maar het vraagt een nieuwe build.

## 6. Exportcompliance

`ITSAppUsesNonExemptEncryption` staat op `false` in Info.plist: de app gebruikt alleen standaard HTTPS. Antwoord in App Store Connect: "Nee" op eigen versleuteling.

## 7. Schermafbeeldingen

Verplicht: 6,9 inch (1320 × 2868) en 6,5 inch (1284 × 2778). Minstens 3, het liefst 6. Gebruik echte video's met echte producten; met één testvideo ziet het er leeg uit. Voorstel:

1. **Feed:** "Swipe door video's en verdien tokens" (met een mooie video en een zichtbaar tokensaldo).
2. **Bedrijfsprofiel:** "Alle video's van een bedrijf op een rij".
3. **Zoeken:** "Vind video's bij wat je zoekt".
4. **Rewards:** "Wissel je tokens in voor echte kortingen".
5. **Berichten:** "Stuur video's naar vrienden en verdien extra".
6. **Streak en wallet:** "Elke dag swipen, elke dag een bonus".

Maak ze met je demo-account in de TestFlight-app op een iPhone 15 Pro Max of 16 Pro Max, of in de simulator. Tip: zodra er 5 tot 10 echte video's staan.

## 8. Stappen voor jou

Dingen die alleen met jouw logins kunnen:

1. **developer.apple.com, Certificates, Identifiers & Profiles, Identifiers, it.swyp.app:** zet "Associated Domains" aan en sla op (nodig voor universele links). Laat Xcode daarna automatisch het profiel vernieuwen.
2. **Build 18 uploaden** zoals build 17 (nieuw app-specifiek wachtwoord uit de sleutelhanger, nooit in de chat).
3. **App Store Connect:** nieuwe app, vul secties 1 tot 4 hierboven in, upload de schermafbeeldingen, kies build 18.
4. **Demo-accounts maken:** een consument, een tweede consument (om berichten te laten zien) en een bedrijf. Wachtwoorden vul jij zelf in.
5. **Juridisch:** privacybeleid en voorwaarden laten controleren voordat je indient (zie `docs/verwerkingsoverzicht.md`).
6. **Indienen voor review.** De eerste review duurt meestal 1 tot 2 dagen. Bij een afwijzing: zeg het, dan pak ik het punt op.

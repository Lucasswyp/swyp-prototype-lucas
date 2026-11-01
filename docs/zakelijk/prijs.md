# Prijs voor bedrijven (besluit 1 november 2026)

## Het tarief
**€149 per campagne van 30 dagen, exclusief btw.**
Daarin zit een tokenbudget van maximaal €100 (10.000 tokens) dat kijkers kunnen verdienen. De rest (€49) is de vergoeding voor Swyp.

| Onderdeel | Prijs (excl. btw) |
|---|---|
| Campagne van 30 dagen, tokenbudget tot €100 | €149,00 |
| Budget bijvullen | €1,49 per €1 tokenbudget (zelfde verhouding als het basistarief) |
| Betaaltermijn | 14 dagen |

Met btw (21%) betaalt een bedrijf voor één campagne €180,29.

## Wat is "tokenbudget"?
Kijkers verdienen tokens en wisselen die in bij het bedrijf voor een korting of aanbieding die het bedrijf zelf kiest. Het tokenbudget is de grens aan wat kijkers in totaal kunnen verdienen: is het op, dan stopt de campagne vanzelf. De korting zelf geeft het bedrijf aan de klant bij het afrekenen; Swyp rekent daar niets voor en keert geen geld uit.

## Lanceringspartners
- Eerste campagne van 30 dagen **gratis**.
- Een **tweede gratis** campagne als het bedrijf 15 minuten feedback geeft.
- Daarna het gewone tarief.

## Handmatig factureren (zolang er geen betaalsysteem is)
1. Open `docs/zakelijk/factuursjabloon.docx`, sla op onder het factuurnummer, bijvoorbeeld `2026-001 Bedrijfsnaam.docx`.
2. Vul de blokken tussen [haakjes] in: je btw-nummer, IBAN, factuurnummer, datums en de gegevens van het bedrijf.
3. Verwijder de regel "Korting lanceringspartner" bij een betalend bedrijf. Bij een lanceringspartner laat je hem staan: de factuur is dan €0. Vraag je boekhouder of je bij €0 een factuur wilt sturen of alleen een bevestiging.
4. Exporteer naar pdf en mail hem naar het bedrijf. Zet het bedrag, de datum en de status in je eigen administratie.
5. Een volgend factuurnummer is het vorige plus 1. Sla ze op volgorde op.

## Wat je nog zelf moet invullen of nakijken
- **Btw:** het sjabloon rekent met 21% btw. Ben je btw-plichtig voor deze diensten? Je boekhouder bevestigt dit. Zet je btw-nummer op het sjabloon.
- **IBAN en betaalgegevens** van Swyp V.O.F.
- **Algemene voorwaarden:** de voorwaarden voor bedrijven staan op swyp.it/voorwaarden-bedrijven (concept). Laat de jurist ze nakijken voor je er facturen mee verstuurt.
- **Opschonen:** het bedrag in het tarief staat ook in de voorwaarden en de one-pager. Wijzig je de prijs, pas dan `src/lib/businessTerms.ts` aan en laat mij de documenten bijwerken.

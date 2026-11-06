# Beheerroutine: wat je dagelijks, wekelijks en maandelijks doet

Dit is alles wat jij als beheerder van Swyp doet zodra er echte bedrijven zijn. Het kost samen ongeveer 15 minuten per dag.

## Elke dag (5 minuten)
1. **Video's goedkeuren:** swyp.it/admin/ads (log in met lucas@vanderstam.nl, dat is het beheerdersaccount). Wacht er iets, keur het goed of af. Je krijgt een dagelijkse mail als de mailkoppeling is ingesteld; anders kijk je zelf.
2. **Meldingen:** swyp.it/admin/reports. Handel meldingen af, binnen 24 uur.
3. **Support:** de mailbox. Antwoorden staan in `docs/support-proces.md`.

## Elke week (10 minuten)
1. **Cijfers per bedrijf:** vraag je lanceringspartners na 1 week naar hun indruk, en kijk in hun dashboard (met hun toestemming) hoeveel weergaven er zijn.
2. **Ruimte bij Mux:** dashboard.mux.com. Het gratis plan heeft 10 video's. Verwijderde campagnes ruimen hun video zelf op; zie je oude demo's staan, verwijder die zelf.
3. **Supabase:** supabase.com/dashboard, project "swyp". Kijk bij Usage of je onder de limieten blijft (vooral "cached egress" en opslag). Gaat het richting 80%, dan is het tijd voor het Pro-plan.
4. **Fouten:** Sentry (EU) op nieuwe fouten.

## Elke maand
1. **Facturen:** per bedrijf met een lopende campagne, volgens `docs/zakelijk/prijs.md` en het sjabloon `docs/zakelijk/factuursjabloon.docx`. Factuurnummer = vorige + 1, bewaar op volgorde.
2. **Btw-aangifte** met je boekhouder.
3. **Back-ups:** op het gratis plan zijn die er niet. Met Supabase Pro wel; tot dan is er geen terugweg bij een fout in de database.
4. **Wachtwoorden en toegang:** controleer wie nog toegang heeft tot Supabase, Vercel, Mux en GitHub.

## Bij een bedrijf dat stopt
Zet de campagne op "Afgerond" of gebruik de prullenbak in Campagnes: de video wordt dan ook bij Mux verwijderd. Cijfers blijven bewaard.

## Bij een melding van een datalek of misbruik
Noteer wat er gebeurd is en wanneer, zet het betreffende account op beperkt (of verberg de video), en neem contact op met je jurist. Een datalek met persoonsgegevens meld je binnen 72 uur bij de Autoriteit Persoonsgegevens; zie `docs/verwerkingsoverzicht.md` voor welke gegevens we bewaren.

## Wat Claude voor je doet
Bouwen, testen, schrijven, onderzoeken, de documenten en de simulaties. Productiewijzigingen (database, uitrollen, pushen) gebeuren alleen na jouw expliciete ja.

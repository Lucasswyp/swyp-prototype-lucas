# Verwerkingsoverzicht Swyp (voor de jurist)

Stand: 22 oktober 2026. Dit is een feitelijk overzicht van wat de app nu verwerkt, bedoeld als input voor de controle van het privacybeleid, de voorwaarden en een verwerkersovereenkomst. De teksten op swyp.it/privacy en swyp.it/terms zijn hierop afgestemd, maar nog niet juridisch gecontroleerd.

Verantwoordelijke: Swyp V.O.F., KVK 42132440, Sparresholm 145, 2133 BL Hoofddorp. Minimumleeftijd: 16 jaar (geboortedatum verplicht).

## Gegevens per categorie

| Categorie | Wat | Waarvoor | Waar | Bewaren |
| --- | --- | --- | --- | --- |
| Account | naam, gebruikersnaam, e-mail, profielfoto | account, inloggen | Supabase (database, auth, opslag) | tot het account wordt verwijderd |
| Profiel | geslacht, geboortedatum | leeftijdscontrole, geaggregeerde doelgroepcijfers | Supabase | tot verwijdering; geboortedatum is na invullen onveranderbaar |
| Inloggen via Google/Apple | naam, e-mail, (Google) foto | inloggen | Supabase Auth; Google/Apple als aanbieder | tot verwijdering |
| Punten | tokensaldo, streak, elke boeking (kijken, like, opslaan, klik, volgen, doorsturen, inwisselen) | beloningen uitkeren, misbruik voorkomen | Supabase | tot verwijdering |
| Opgeslagen en gevolgd | opgeslagen producten, gevolgde bedrijven, geblokkeerde bedrijven | functionaliteit | Supabase | tot verwijdering |
| Berichten | tekst, doorgestuurde video, emoji-reacties, geblokkeerde gebruikers, meldingen over berichten/gebruikers | chatten, doorsturen, veiligheid | Supabase (niet end-to-end versleuteld) | tot verwijdering van het account (verwijdert ook je verzonden berichten) |
| Pushmeldingen | apparaat-token (APNs) | melding bij nieuw bericht, streak-herinnering | Supabase; levering via Apple | tot verwijdering of tot Apple het token ongeldig meldt |
| Anonieme meetgegevens | weergave/klik/like/opslaan op een video met een willekeurig apparaat-ID, niet gekoppeld aan het account | campagnestatistieken voor bedrijven | Supabase | geen vaste termijn, nog te bepalen |
| Video's en afbeeldingen van bedrijven | geüploade video's en posters | tonen van advertenties | Mux en Supabase Storage | tot verwijdering door het bedrijf |
| Productanalyse | schermen en acties in de app (PostHog, EU) | productverbetering | PostHog (EU-regio) | volgens PostHog-instelling, nog te controleren |
| Foutmeldingen | technische fouten (Sentry) | storingen opsporen | Sentry (EU) | volgens Sentry-instelling |
| Feedback en testformulier | vrije tekst van gebruikers | verbeteren van de app | Supabase | geen vaste termijn, nog te bepalen |

## Wat bedrijven zien

- Aantallen per video en campagne: weergaven, uitkijken (80%), likes, opslagen, doorkliks, doorgestuurd.
- Doelgroep: aantal betrokken kijkers, en pas vanaf 10 betrokken kijkers een verdeling naar leeftijdsgroep en geslacht. Groepen kleiner dan 5 worden samengevoegd of weggelaten. Nooit namen, e-mailadressen of berichten.
- Bij het inwisselen van een reward ziet het bedrijf de code en de status, en een anonieme id, niet wie het is.

## Ontvangers (verwerkers)

Supabase (database en auth), Vercel (hosting), Mux (video), Algolia (zoeken, alleen openbare data), PostHog (analyse), Sentry (fouten), Apple (push en Apple-login), Google (Google-login). Er is nog geen e-mailprovider actief voor mailings (Resend staat gepland voor transactionele mail).

## Open punten voor de jurist

1. Grondslagen per verwerking bevestigen, vooral voor geslacht (toestemming) en de anonieme meetgegevens (gerechtvaardigd belang).
2. Bewaartermijnen vastleggen voor anonieme meetgegevens, feedback, analyse en foutmeldingen.
3. Verwerkersovereenkomsten en internationale doorgifte (Vercel, Mux, Apple, Google) nalopen.
4. Controleren of een DPIA nodig is (jongeren vanaf 16, berichten tussen gebruikers).
5. Voorwaarden voor adverteerders (bedrijven) en de overeenkomst voor bedrijfsaccounts schrijven; er zijn nog geen betalingen.
6. Notice-and-action voor meldingen van berichten (reactietermijn, wie beoordeelt).

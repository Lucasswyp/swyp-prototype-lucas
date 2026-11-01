# Swyp

Swipe door video-advertenties, verdien SWYP (1 punt = €0,01) en wissel die in voor echte voordelen bij bedrijven.
Dit is de webapp (Next.js) die ook als iOS-app (Capacitor) in TestFlight staat, plus het dashboard voor bedrijven.

Live: <https://swyp.it> · App: `/app` · Bedrijven: `/business` · Admin: `/admin/ads` (video's beoordelen) en `/admin/reports` (meldingen afhandelen)

## Starten

```bash
npm install
cp .env.example .env.local   # vul de sleutels in (zie hieronder)
npm run dev                  # http://localhost:3000
```

| Commando | Wat het doet |
| --- | --- |
| `npm run typecheck` | Genereert de routetypes en controleert TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit-tests (Vitest) |
| `npm run build` | Productiebouw (draait ook in CI met nepwaarden) |
| `npm run e2e` | Playwright-controles tegen de live site (`E2E_BASE_URL=http://localhost:3000 npm run e2e` voor lokaal). Draait ook elke ochtend via GitHub Actions (`smoke.yml`). Daarnaast controleert `uptime.yml` elk kwartier `/api/health` (site + database) |

Next.js is hier een nieuwere versie dan veel documentatie: lees `node_modules/next/dist/docs/` voor je iets aanpast (zie `AGENTS.md`).

## Omgevingsvariabelen

Lokaal in `.env.local`, in productie in Vercel (team `swyp1`, project `swyp-prototype-lucas`).

| Variabele | Waarvoor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (database, login) |
| `SUPABASE_SERVICE_ROLE_KEY` | Alleen op de server: passeert de beveiligingsregels. Nooit in de browser |
| `NEXT_PUBLIC_ALGOLIA_APP_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`, `ALGOLIA_WRITE_KEY` | Zoeken |
| `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` | Video-upload en -afspelen |
| `NEXT_PUBLIC_USE_MUX` | `true` = video's via Mux, anders Supabase Storage |
| `NEXT_PUBLIC_SENTRY_DSN` | Foutmeldingen |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Productstatistieken |
| `CRON_SECRET` | Beveiligt de geplande taken (`vercel.json`) |
| `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID` | Pushmeldingen naar iOS |

## Database (Supabase)

Het project heet **swyp** (PRODUCTION). Er is geen migratietool: de bestanden in `supabase/` worden met de hand in de SQL Editor gedraaid, in deze volgorde:
`schema`, `consumers`, `profiles`, `rewards`, `referrals`, `apple_auth`, `moderation`, `push`, `rate_limits`, `safety`, `storage_fix`, `security_hardening`, `feedback`, `reward_codes_and_budget`, `dm`, `exposure_and_caps`, `audience_summary`, `reports_moderation`, `message_filter`, `hide_demo`, `product_view_points`, daarna `exposure_lockdown` (pas na het uitrollen van de bijbehorende app-versie). Alle bestanden zijn herhaalbaar.

Werkwijze voor een wijziging op productie:
1. Test het eerst als `DO`-blok dat eindigt met `raise exception`, zodat alles wordt teruggedraaid.
2. Pas het daarna echt toe.
3. Een wijziging die de draaiende app kan breken gaat in twee stappen: eerst alles wat ernaast kan draaien, dan de nieuwe app uitrollen, dan pas de oude toegang dichtzetten.

## Uitrollen

Productie draait vanaf de Mac, niet vanuit Git:

```bash
npx vercel whoami        # moet de eigenaar van team swyp1 zijn
npx vercel --prod --yes
```

Staat de CLI op het verkeerde team (`credify`)? Dan `npx vercel logout` en `npx vercel login`.
De iOS-app laadt `https://swyp.it/app`, dus een webwijziging hoeft geen nieuwe build. Een nieuwe TestFlight-build is alleen nodig voor native wijzigingen (`ios/`, `capacitor.config.ts`, rechten).

## Wat er in zit

- Feed met video's (Mux, HLS), zoeken (Algolia) met verwante termen (`src/lib/relatedTermsData.ts`)
- Punten en beloningen met eigen kortingscodes, dagmaxima en budgetbewaking (server-kant, `supabase/`)
- Berichten: video's doorsturen (levert punten op), reacties, blokkeren, melden en schorsen, woordenfilter (`moderation_terms`), pushmelding (`supabase/dm.sql`, `src/app/app/messages`)
- Bedrijfsdashboard: campagnes, producten, beloningen, statistiek
- Veiligheid: beveiligingsheaders (CSP wordt afgedwongen, `next.config.ts`), rate limiting, moderatie, account verwijderen

## Release (iOS)

Alles voor de App Store-inzending (teksten, privacylabels, reviewnotities, stappen) staat in `docs/app-store.md`.

Builds gaan met `xcrun altool` naar TestFlight (team `5YNP5PZ27W`, bundle `it.swyp.app`). Gebruik een app-specifiek wachtwoord uit de sleutelhanger (`@keychain:AC_PASSWORD`), nooit in een script of in de chat.

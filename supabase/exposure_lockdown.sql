-- Stap 2 van 2 (na exposure_and_caps.sql EN na het uitrollen van de nieuwe app):
-- haalt de oude, te brede toegang weg. De oude app las nog rechtstreeks uit
-- `businesses` en `campaigns` en schreef zelf in `interactions`; zodra deze
-- stap draait werkt alleen de nieuwe app nog. Eén transactie; herhaalbaar.
begin;

-- Direct schrijven in de statistieken kan niet meer; alleen log_interaction().
drop policy if exists "public insert interactions" on interactions;
revoke insert, update, delete on interactions from anon, authenticated;

-- Campagnes en bedrijven zijn alleen nog leesbaar voor de eigenaar (en admins);
-- openbare gegevens komen uit de views campaign_rewards en public_businesses.
drop policy if exists "public read campaigns" on campaigns;
drop policy if exists "public read businesses" on businesses;

commit;

-- Basisfilter voor berichten (App Store-richtlijn 1.2 vraagt een manier om
-- aanstootgevende inhoud tegen te houden, naast melden en blokkeren).
--  * De woordenlijst staat in de tabel moderation_terms en is aan te passen zonder
--    nieuwe app: insert/delete in de SQL Editor.
--  * moderation_text_allowed() kijkt naar hele woorden of zinnen, negeert
--    hoofdletters, accenten, herhaalde letters ("niggerrr"), simpele
--    cijfertrucs ("n1gger") en losse letters ("k.y.s"). Het is bewust een basisfilter: het vangt de grofste
--    gevallen, meldingen en schorsen doen de rest.
--  * Wie zo'n bericht probeert te sturen krijgt reden 'not_allowed' terug.
-- Draai na dm.sql en reports_moderation.sql. Eén transactie; herhaalbaar.
begin;

create table if not exists moderation_terms (
  term text primary key check (term = lower(term) and char_length(term) between 3 and 60),
  added_at timestamptz not null default now()
);
alter table moderation_terms enable row level security;
-- Geen policies: alleen de database zelf (en jij in de SQL Editor) leest en schrijft hier.

-- Nederlands en Engels; alleen duidelijke scheldwoorden en bedreigingen. Geen woorden die
-- ook gewoon gebruikt worden (bijvoorbeeld "kanker" als ziekte of "homo" als woord).
insert into moderation_terms (term) values
  ('nikker'), ('nigger'), ('negerhoer'), ('kutneger'), ('kutmarokkaan'), ('kuttukker'), ('vuile neger'),
  ('kankerhoer'), ('kankerlijer'), ('kankerhoeren'), ('kankerlijers'), ('kutwijf'), ('kutwijven'), ('hoerenzoon'),
  ('flikkerlijer'), ('vuile homo'), ('smerige homo'), ('vuile jood'), ('vuile moslim'),
  ('faggot'), ('kike'), ('chink'), ('tranny'), ('retarded'),
  ('ik maak je dood'), ('ik vermoord je'), ('ik steek je neer'), ('ik schiet je dood'), ('ik sla je dood'),
  ('i will kill you'), ('i''ll kill you'), ('kill yourself'), ('kys'), ('ga dood'), ('hoop dat je doodgaat'),
  ('heil hitler'), ('sieg heil'), ('white power'), ('hitler had gelijk'), ('hitler was right'),
  ('stuur naaktfoto''s'), ('stuur naaktfotos'), ('send nudes'), ('stuur nudes')
on conflict do nothing;

-- Maakt tekst vergelijkbaar: kleine letters, zonder accenten, cijfertrucs terug naar
-- letters, alles behalve letters en spaties wordt een spatie en herhaalde letters
-- worden één letter.
create or replace function public.moderation_normalize(p_text text)
returns text
language sql immutable as $$
  select trim(regexp_replace(
    regexp_replace(
      regexp_replace(
        translate(
          translate(lower(coalesce(p_text, '')), 'áàäâãåéèëêíìïîóòöôõúùüûçñ', 'aaaaaaeeeeiiiioooooouuuucn'),
          '013457@$', 'oieastas'),
        '[^a-z ]', ' ', 'g'),
      '(.)\1+', '\1', 'g'),
    '\s+', ' ', 'g'));
$$;

create or replace function public.moderation_text_allowed(p_text text)
returns boolean
language sql stable security definer set search_path = public as $$
  with n as (
    select public.moderation_normalize(p_text) as plain
  ), v as (
    -- Ook de variant waarin losse letters aan elkaar zitten: "k y s" en "k.y.s" worden "kys".
    select plain,
           public.moderation_normalize(regexp_replace(plain, '\m([a-z]) (?=[a-z]\M)', '\1', 'g')) as joined
    from n
  )
  select not exists (
    select 1 from moderation_terms t, v
    where ' ' || v.plain  || ' ' like '% ' || public.moderation_normalize(t.term) || ' %'
       or ' ' || v.joined || ' ' like '% ' || public.moderation_normalize(t.term) || ' %'
  );
$$;
revoke execute on function public.moderation_text_allowed(text) from public, anon;
grant execute on function public.moderation_text_allowed(text) to authenticated;

-- Voordeur met filter; de bestaande functie wordt de kern.
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'dm_send_message_core') then
    alter function public.dm_send_message(uuid, text, text, uuid) rename to dm_send_message_core;
  end if;
end $$;

create or replace function public.dm_send_message(
  p_conversation_id uuid,
  p_kind text,
  p_body text default null,
  p_ad_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if p_body is not null and not public.moderation_text_allowed(p_body) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;
  return public.dm_send_message_core(p_conversation_id, p_kind, p_body, p_ad_id);
end;
$$;
revoke execute on function public.dm_send_message(uuid, text, text, uuid) from public, anon;
grant execute on function public.dm_send_message(uuid, text, text, uuid) to authenticated;
revoke execute on function public.dm_send_message_core(uuid, text, text, uuid) from public, anon, authenticated;

commit;

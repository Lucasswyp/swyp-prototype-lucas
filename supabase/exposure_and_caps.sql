-- Drie dingen die publiek of te misbruiken waren:
--  1. Iedereen kon zonder inlog weergaven/clicks in de statistieken van een
--     bedrijf schrijven. Nu loopt dat via log_interaction(): de server leidt
--     bedrijf en product zelf af, gooit dubbele events weg en begrenst per
--     apparaat. Direct schrijven in `interactions` kan niet meer.
--  2. Campagnebudgetten en doelgroepinstellingen waren voor iedereen leesbaar,
--     en `businesses` toonde het interne account-id. Nu ziet een bedrijf alleen
--     zijn eigen campagnes en rij; de app leest openbare gegevens uit twee
--     views (campaign_rewards, public_businesses).
--  3. Like, opslaan, klik en volgen hadden geen dagmaximum.
-- Stap 1 van 2: alles wat naast de oude app kan draaien. Stap 2 is
-- exposure_lockdown.sql en gaat pas na het uitrollen van de nieuwe app.
-- Eén transactie; veilig om opnieuw te draaien.
begin;

-- ---------------------------------------------------------------------------
-- 1. Statistieken alleen nog via de server
-- ---------------------------------------------------------------------------
create index if not exists interactions_device_created on interactions (device_id, created_at desc);
create index if not exists interactions_ad_event_created on interactions (ad_id, event_name, created_at desc);

create or replace function public.log_interaction(
  p_device_id text,
  p_event text,
  p_ad_id uuid,
  p_value numeric default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_device text := left(coalesce(p_device_id, ''), 64);
  v_business uuid;
  v_product uuid;
  v_window interval;
begin
  if char_length(v_device) < 8 then return; end if;
  if p_event is null or p_event not in ('impression', 'watch80', 'complete', 'like', 'save', 'click') then return; end if;

  -- Bedrijf en product komen van de advertentie zelf, nooit van de client.
  select business_id, product_id into v_business, v_product
  from ads where id = p_ad_id and moderation_status = 'approved';
  if v_business is null then return; end if;

  -- Hetzelfde apparaat telt een weergave per 30 minuten en de rest één keer per dag.
  v_window := case when p_event = 'impression' then interval '30 minutes' else interval '1 day' end;
  if exists (
    select 1 from interactions
    where device_id = v_device and ad_id = p_ad_id and event_name = p_event and created_at > now() - v_window
  ) then return; end if;

  -- Een apparaat dat de server overspoelt, of een advertentie die ineens veel
  -- weergaven krijgt, wordt afgekapt.
  if (select count(*) from interactions where device_id = v_device and created_at > now() - interval '1 minute') >= 60 then return; end if;
  if p_event = 'impression'
     and (select count(*) from interactions where ad_id = p_ad_id and event_name = 'impression' and created_at > now() - interval '1 minute') >= 600 then
    return;
  end if;

  insert into interactions (device_id, business_id, ad_id, product_id, event_name, value)
  values (
    v_device, v_business, p_ad_id, v_product, p_event,
    case when p_value is not null and p_value between 0 and 3600000 then p_value else null end
  );
end;
$$;
revoke execute on function public.log_interaction(text, text, uuid, numeric) from public;
grant execute on function public.log_interaction(text, text, uuid, numeric) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Campagnes en bedrijven niet meer voor iedereen leesbaar
-- ---------------------------------------------------------------------------
drop policy if exists "business reads own campaigns" on campaigns;
create policy "business reads own campaigns" on campaigns for select using (
  business_id in (select id from businesses where auth_user_id = auth.uid())
  or public.is_admin()
);

-- Alleen wat de app nodig heeft om te tonen wat een video oplevert.
create or replace view public.campaign_rewards as
  select c.id as campaign_id, c.reward_watch, c.reward_like, c.reward_save, c.reward_click
  from campaigns c
  where c.status = 'Active';
grant select on public.campaign_rewards to anon, authenticated;

drop policy if exists "business reads own row" on businesses;
create policy "business reads own row" on businesses for select using (
  auth_user_id = auth.uid() or public.is_admin()
);

-- Alles wat openbaar hoort te zijn, zonder het interne account-id.
create or replace view public.public_businesses as
  select id, name, logo_url, banner_url, category, location, website, description, verified, followers, created_at
  from businesses;
grant select on public.public_businesses to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Dagmaxima voor like, opslaan, klik en volgen
--    (kijken heeft al zijn eigen dempcurve, doorsturen heeft 5 per dag)
-- ---------------------------------------------------------------------------
create or replace function public.award_interaction(p_ad_id uuid, p_action text, p_watch_ms int default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_consumer uuid;
  v_cap int;
  v_today_count int;
begin
  if not public.ad_is_live(p_ad_id) then
    return jsonb_build_object('awarded', false, 'reason', 'campaign_ended');
  end if;

  v_cap := case p_action when 'like' then 30 when 'save' then 20 when 'click' then 20 else null end;
  if v_cap is not null then
    select id into v_consumer from consumers where auth_user_id = auth.uid();
    if v_consumer is not null then
      select count(*) into v_today_count
      from token_events
      where consumer_id = v_consumer and action = p_action
        and (created_at at time zone 'Europe/Amsterdam')::date = (now() at time zone 'Europe/Amsterdam')::date;
      if v_today_count >= v_cap then
        return jsonb_build_object('awarded', false, 'reason', 'daily_cap');
      end if;
    end if;
  end if;

  return public.award_interaction_core(p_ad_id, p_action, p_watch_ms);
end;
$$;

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'award_follow_core') then
    alter function public.award_follow(uuid) rename to award_follow_core;
  end if;
end $$;

create or replace function public.award_follow(p_company_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_consumer uuid;
  v_today_count int;
begin
  select id into v_consumer from consumers where auth_user_id = auth.uid();
  if v_consumer is not null then
    select count(*) into v_today_count
    from token_events
    where consumer_id = v_consumer and action = 'follow'
      and (created_at at time zone 'Europe/Amsterdam')::date = (now() at time zone 'Europe/Amsterdam')::date;
    if v_today_count >= 10 then
      return jsonb_build_object('awarded', false, 'reason', 'daily_cap');
    end if;
  end if;
  return public.award_follow_core(p_company_id);
end;
$$;
revoke execute on function public.award_follow_core(uuid) from public, anon, authenticated;

commit;

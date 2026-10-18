-- Kortingscodes van het bedrijf zelf, controle van een code bij het bedrijf,
-- en advertenties die stoppen als het budget op is. Eén transactie; veilig om
-- opnieuw te draaien.
begin;

-- ---------------------------------------------------------------------------
-- 1. Pool met kortingscodes per beloning
-- ---------------------------------------------------------------------------
create table if not exists reward_codes (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references rewards(id) on delete cascade,
  code text not null check (char_length(code) between 3 and 64),
  redemption_id uuid references redemptions(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reward_id, code)
);
create index if not exists reward_codes_available on reward_codes (reward_id, created_at) where redemption_id is null;
alter table reward_codes enable row level security;

drop policy if exists "business reads own reward codes" on reward_codes;
create policy "business reads own reward codes" on reward_codes for select using (
  reward_id in (
    select r.id from rewards r join businesses b on b.id = r.business_id where b.auth_user_id = auth.uid()
  )
);

-- Bedrijf uploadt codes (max 2000 per keer, dubbele en lege regels vallen weg).
create or replace function public.add_reward_codes(p_reward_id uuid, p_codes text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_added int;
  v_input int;
begin
  if not exists (
    select 1 from rewards r join businesses b on b.id = r.business_id
    where r.id = p_reward_id and b.auth_user_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_your_reward');
  end if;

  with cleaned as (
    select distinct trim(c) as code
    from unnest(coalesce(p_codes, '{}')) c
    where char_length(trim(c)) between 3 and 64
    limit 2000
  ), ins as (
    insert into reward_codes (reward_id, code)
    select p_reward_id, code from cleaned
    on conflict (reward_id, code) do nothing
    returning 1
  )
  select (select count(*) from ins), (select count(*) from cleaned) into v_added, v_input;

  return jsonb_build_object('ok', true, 'added', v_added, 'skipped', v_input - v_added);
end;
$$;

-- Aantallen per beloning voor het dashboard van het ingelogde bedrijf.
create or replace function public.get_reward_code_counts()
returns table (reward_id uuid, available int, claimed int)
language sql stable security definer set search_path = public as $$
  select rc.reward_id,
         count(*) filter (where rc.redemption_id is null)::int,
         count(*) filter (where rc.redemption_id is not null)::int
  from reward_codes rc
  join rewards r on r.id = rc.reward_id
  join businesses b on b.id = r.business_id
  where b.auth_user_id = auth.uid()
  group by rc.reward_id;
$$;

-- ---------------------------------------------------------------------------
-- 2. Inwisselen: gebruik een code uit de pool als die er is, anders een door
--    de server gemaakte code (de browser bepaalt de code niet meer).
-- ---------------------------------------------------------------------------
create or replace function public.redeem_reward(p_reward_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_cost int;
  v_balance int;
  v_redemption_id uuid;
  v_code text;
  v_pool boolean;
  v_pool_id uuid;
begin
  select id into v_consumer_id from consumers where auth_user_id = auth.uid();
  if v_consumer_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_consumer');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_consumer_id::text));

  select token_cost into v_cost from rewards where id = p_reward_id;
  if v_cost is null then
    return jsonb_build_object('ok', false, 'reason', 'reward_not_found');
  end if;
  if v_cost <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_reward');
  end if;

  select balance into v_balance from consumer_wallets where consumer_id = v_consumer_id;
  v_balance := coalesce(v_balance, 0);
  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance', 'balance', v_balance);
  end if;

  select exists(select 1 from reward_codes where reward_id = p_reward_id) into v_pool;
  if v_pool then
    select id, code into v_pool_id, v_code
    from reward_codes
    where reward_id = p_reward_id and redemption_id is null
    order by created_at
    limit 1
    for update skip locked;
    if v_pool_id is null then
      return jsonb_build_object('ok', false, 'reason', 'out_of_codes');
    end if;
  else
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;

  insert into token_events (consumer_id, reward_id, action, points)
  values (v_consumer_id, p_reward_id, 'redeem', -v_cost);

  update consumer_wallets set balance = balance - v_cost, updated_at = now()
  where consumer_id = v_consumer_id;

  insert into redemptions (reward_id, device_id, consumer_id, code)
  values (p_reward_id, v_consumer_id::text, v_consumer_id, v_code)
  returning id into v_redemption_id;

  if v_pool then
    update reward_codes set redemption_id = v_redemption_id, claimed_at = now() where id = v_pool_id;
  end if;

  return jsonb_build_object('ok', true, 'redemption_id', v_redemption_id, 'balance', v_balance - v_cost, 'code', v_code);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Het bedrijf controleert een code en markeert hem als gebruikt.
-- ---------------------------------------------------------------------------
create or replace function public.business_use_code(p_code text, p_mark_used boolean default false)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_status text;
  v_title text;
begin
  select rd.id, rd.status, rw.title into v_id, v_status, v_title
  from redemptions rd
  join rewards rw on rw.id = rd.reward_id
  join businesses b on b.id = rw.business_id
  where b.auth_user_id = auth.uid()
    and upper(rd.code) = upper(trim(p_code))
  order by rd.redeemed_at desc
  limit 1;

  if v_id is null then
    return jsonb_build_object('found', false);
  end if;
  if v_status = 'used' then
    return jsonb_build_object('found', true, 'status', 'used', 'title', v_title);
  end if;
  if p_mark_used then
    update redemptions set status = 'used' where id = v_id;
    return jsonb_build_object('found', true, 'status', 'used_now', 'title', v_title);
  end if;
  return jsonb_build_object('found', true, 'status', 'active', 'title', v_title);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Budget: bedrag dat een campagne heeft uitgekeerd (1 punt = EUR 0,01),
--    en wanneer een advertentie nog 'live' is.
-- ---------------------------------------------------------------------------
create or replace function public.campaign_spent_eur(p_campaign_id uuid, p_since date default null)
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(te.points), 0) / 100.0
  from token_events te
  join ads a on a.id = te.ad_id
  where a.campaign_id = p_campaign_id
    and te.points > 0
    and te.action in ('watch80', 'like', 'save', 'click')
    and (p_since is null or te.created_at >= p_since);
$$;

create or replace function public.ad_is_live(p_ad_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when a.campaign_id is null then true
    else exists (
      select 1 from campaigns c
      where c.id = a.campaign_id
        and c.status = 'Active'
        and (c.start_date is null or c.start_date <= (now() at time zone 'Europe/Amsterdam')::date)
        and (c.end_date is null or c.end_date >= (now() at time zone 'Europe/Amsterdam')::date)
        and (coalesce(c.total_budget, 0) <= 0 or public.campaign_spent_eur(c.id) < c.total_budget)
        and (coalesce(c.daily_budget, 0) <= 0
             or public.campaign_spent_eur(c.id, (now() at time zone 'Europe/Amsterdam')::date) < c.daily_budget)
    )
  end
  from ads a where a.id = p_ad_id;
$$;

-- Id's van advertenties die nu goedgekeurd én live zijn (voor de zoekindex).
create or replace function public.live_ad_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select a.id from ads a where a.moderation_status = 'approved' and public.ad_is_live(a.id);
$$;
revoke execute on function public.live_ad_ids() from public, anon, authenticated;
grant execute on function public.live_ad_ids() to service_role;

-- Consumenten zien alleen goedgekeurde, live advertenties; een bedrijf ziet
-- zijn eigen advertenties altijd, een admin alles.
drop policy if exists "read approved or own ads" on ads;
create policy "read approved or own ads" on ads for select using (
  (moderation_status = 'approved' and public.ad_is_live(id))
  or business_id in (select id from businesses where auth_user_id = auth.uid())
  or public.is_admin()
);

-- Geen punten meer voor een advertentie die niet live is. De bestaande logica
-- blijft ongewijzigd als award_interaction_core; alleen de voordeur is nieuw.
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'award_interaction_core') then
    alter function public.award_interaction(uuid, text, int) rename to award_interaction_core;
  end if;
end $$;

create or replace function public.award_interaction(p_ad_id uuid, p_action text, p_watch_ms int default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.ad_is_live(p_ad_id) then
    return jsonb_build_object('awarded', false, 'reason', 'campaign_ended');
  end if;
  return public.award_interaction_core(p_ad_id, p_action, p_watch_ms);
end;
$$;
revoke execute on function public.award_interaction_core(uuid, text, int) from public, anon, authenticated;

-- Zodra het totaalbudget op is, gaat de campagne vanzelf op 'Completed'.
create or replace function public.token_events_budget_check()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_campaign uuid;
  v_total numeric;
begin
  if new.ad_id is null or new.points <= 0 then
    return new;
  end if;
  select c.id, c.total_budget into v_campaign, v_total
  from ads a join campaigns c on c.id = a.campaign_id
  where a.id = new.ad_id;
  if v_campaign is not null and coalesce(v_total, 0) > 0
     and public.campaign_spent_eur(v_campaign) >= v_total then
    update campaigns set status = 'Completed' where id = v_campaign and status = 'Active';
  end if;
  return new;
end;
$$;

drop trigger if exists token_events_budget_check_trg on token_events;
create trigger token_events_budget_check_trg after insert on token_events
  for each row execute function public.token_events_budget_check();

-- Besteed bedrag per campagne voor het dashboard van het ingelogde bedrijf.
create or replace function public.get_campaign_spend()
returns table (campaign_id uuid, spent_eur numeric, spent_today_eur numeric)
language sql stable security definer set search_path = public as $$
  select c.id,
         public.campaign_spent_eur(c.id),
         public.campaign_spent_eur(c.id, (now() at time zone 'Europe/Amsterdam')::date)
  from campaigns c
  join businesses b on b.id = c.business_id
  where b.auth_user_id = auth.uid();
$$;

commit;

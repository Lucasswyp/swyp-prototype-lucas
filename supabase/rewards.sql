-- Swyp consumer reward economy: server-authoritative token ledger, streaks,
-- and the real (removable) save/follow lists. Run once in the Supabase SQL
-- Editor, after schema.sql and consumers.sql.
--
-- Design notes (see the "Swyp productieplan" doc for the full research):
--   - 1 token = EUR 0.01, fixed forever.
--   - Every earn is logged as an immutable row in `token_events`; a
--     `consumer_wallets.balance` column caches the running total so reads
--     don't need to re-sum history every time.
--   - All writes to token_events/consumer_wallets/consumer_streaks go
--     through `security definer` RPCs below, never direct client inserts —
--     RLS on those three tables only grants SELECT. The RPCs re-derive the
--     caller's identity from auth.uid() themselves, so a client can trigger
--     an award for ITSELF but can never forge an amount or another user's id.
--   - `saves` / `follows` are plain, fully-toggleable user data (the actual
--     "Saved" / "Following" lists) and are intentionally separate from the
--     one-time reward record in token_events: unsaving something never
--     claws back tokens already earned, and re-saving never pays out twice.

create table if not exists saves (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references consumers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  ad_id uuid references ads(id) on delete set null,
  created_at timestamptz default now(),
  unique (consumer_id, product_id)
);

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references consumers(id) on delete cascade,
  company_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz default now(),
  unique (consumer_id, company_id)
);

create table if not exists consumer_wallets (
  consumer_id uuid primary key references consumers(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists token_events (
  id bigint generated always as identity primary key,
  consumer_id uuid not null references consumers(id) on delete cascade,
  ad_id uuid references ads(id) on delete set null,
  company_id uuid references businesses(id) on delete set null,
  reward_id uuid references rewards(id) on delete set null,
  action text not null,
  points int not null,
  created_at timestamptz default now()
);

-- One award per (consumer, ad, action) for the four per-ad actions.
create unique index if not exists token_events_unique_per_ad_action
  on token_events (consumer_id, ad_id, action)
  where ad_id is not null and action in ('watch80', 'like', 'save', 'click');

-- One award per (consumer, company) for following.
create unique index if not exists token_events_unique_follow
  on token_events (consumer_id, company_id)
  where action = 'follow';

create index if not exists token_events_consumer_action_created
  on token_events (consumer_id, action, created_at);

create table if not exists consumer_streaks (
  consumer_id uuid primary key references consumers(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  freezes_available int not null default 1,
  last_active_date date,
  last_freeze_grant date,
  updated_at timestamptz default now()
);

-- `redemptions` (schema.sql) was designed for anonymous device_id redemptions;
-- a logged-in consumer's redemption gets its own nullable column instead of
-- overloading that text field.
alter table redemptions add column if not exists consumer_id uuid references consumers(id) on delete set null;

alter table saves enable row level security;
alter table follows enable row level security;
alter table consumer_wallets enable row level security;
alter table token_events enable row level security;
alter table consumer_streaks enable row level security;

drop policy if exists "consumer manage own saves" on saves;
create policy "consumer manage own saves" on saves for all
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()))
  with check (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

drop policy if exists "consumer manage own follows" on follows;
create policy "consumer manage own follows" on follows for all
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()))
  with check (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

drop policy if exists "consumer read own wallet" on consumer_wallets;
create policy "consumer read own wallet" on consumer_wallets for select
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

drop policy if exists "consumer read own token events" on token_events;
create policy "consumer read own token events" on token_events for select
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

drop policy if exists "consumer read own streak" on consumer_streaks;
create policy "consumer read own streak" on consumer_streaks for select
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- award_interaction: the one entry point for watch80 / like / save / click.
-- ---------------------------------------------------------------------------
create or replace function public.award_interaction(p_ad_id uuid, p_action text, p_watch_ms int default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_business_id uuid;
  v_campaign_id uuid;
  v_min int;
  v_max int;
  v_base_points int;
  v_points int;
  v_today date := current_date;
  v_today_watch_count int;
  v_damping numeric := 1;
  v_streak consumer_streaks%rowtype;
  v_streak_bonus int := 0;
  v_day_in_cycle int;
  v_new_balance int;
begin
  if p_action not in ('watch80', 'like', 'save', 'click') then
    return jsonb_build_object('awarded', false, 'reason', 'invalid_action');
  end if;

  select id into v_consumer_id from consumers where auth_user_id = auth.uid();
  if v_consumer_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'not_a_consumer');
  end if;

  select business_id, campaign_id into v_business_id, v_campaign_id from ads where id = p_ad_id;
  if v_business_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'ad_not_found');
  end if;

  -- Platform-wide guardrails: keep the watch >= click >= save >= like
  -- ordering intact no matter what a business sets on its own campaign.
  case p_action
    when 'watch80' then v_min := 10; v_max := 25;
    when 'click'   then v_min := 5;  v_max := 20;
    when 'save'    then v_min := 3;  v_max := 15;
    when 'like'    then v_min := 1;  v_max := 8;
  end case;

  if v_campaign_id is not null then
    select case p_action
      when 'watch80' then reward_watch
      when 'like' then reward_like
      when 'save' then reward_save
      when 'click' then reward_click
    end into v_base_points
    from campaigns where id = v_campaign_id;
  end if;

  v_base_points := coalesce(v_base_points,
    case p_action when 'watch80' then 15 when 'click' then 10 when 'save' then 8 when 'like' then 4 end);
  v_points := greatest(v_min, least(v_max, v_base_points));

  -- A real device cannot legitimately reach 80% of even the shortest clip in
  -- this feed in well under 4 real seconds — a bot firing the event without
  -- actually streaming the video will fail this floor.
  if p_action = 'watch80' and (p_watch_ms is null or p_watch_ms < 4000) then
    return jsonb_build_object('awarded', false, 'reason', 'implausible_watch_time');
  end if;

  -- Daily damping curve, applied to watch80 only: first 20 videos/day at full
  -- rate, next 20 at half, then nothing — this is what keeps a 5-hour grind
  -- session from earning meaningfully more than a normal 20-minute one.
  if p_action = 'watch80' then
    select count(*) into v_today_watch_count
    from token_events
    where consumer_id = v_consumer_id and action = 'watch80' and created_at >= v_today;

    if v_today_watch_count >= 40 then
      v_damping := 0;
    elsif v_today_watch_count >= 20 then
      v_damping := 0.5;
    end if;
    v_points := floor(v_points * v_damping);
  end if;

  begin
    insert into token_events (consumer_id, ad_id, company_id, action, points)
    values (v_consumer_id, p_ad_id, v_business_id, p_action, v_points);
  exception when unique_violation then
    return jsonb_build_object('awarded', false, 'reason', 'already_awarded');
  end;

  -- Streak bookkeeping runs off the first watch80 of the calendar day. A
  -- missed single day is covered by an automatic, free streak freeze — never
  -- a purchasable "repair", and breaking the streak entirely only resets the
  -- *counter*: no points or badges already earned are ever taken away.
  if p_action = 'watch80' and v_today_watch_count = 0 then
    perform pg_advisory_xact_lock(hashtext(v_consumer_id::text));

    select * into v_streak from consumer_streaks where consumer_id = v_consumer_id;

    if v_streak.consumer_id is null then
      insert into consumer_streaks (consumer_id, current_streak, longest_streak, freezes_available, last_active_date, last_freeze_grant)
      values (v_consumer_id, 1, 1, 1, v_today, v_today)
      returning * into v_streak;
    elsif v_streak.last_active_date = v_today then
      null; -- already counted today
    elsif v_streak.last_active_date = v_today - 1 then
      update consumer_streaks set
        current_streak = current_streak + 1,
        longest_streak = greatest(longest_streak, current_streak + 1),
        last_active_date = v_today,
        updated_at = now()
      where consumer_id = v_consumer_id
      returning * into v_streak;
    elsif v_streak.last_active_date = v_today - 2 and v_streak.freezes_available > 0 then
      update consumer_streaks set
        current_streak = current_streak + 1,
        longest_streak = greatest(longest_streak, current_streak + 1),
        freezes_available = freezes_available - 1,
        last_active_date = v_today,
        updated_at = now()
      where consumer_id = v_consumer_id
      returning * into v_streak;
    else
      update consumer_streaks set
        current_streak = 1,
        last_active_date = v_today,
        updated_at = now()
      where consumer_id = v_consumer_id
      returning * into v_streak;
    end if;

    -- Refill one free freeze per rolling week.
    if v_streak.last_freeze_grant is null or v_streak.last_freeze_grant <= v_today - 7 then
      update consumer_streaks set
        freezes_available = least(1, freezes_available + 1),
        last_freeze_grant = v_today
      where consumer_id = v_consumer_id
      returning * into v_streak;
    end if;

    -- Bonus recurs on a 7-day cycle rather than growing forever, so payouts
    -- stay bounded no matter how long a streak gets: day 1 of each cycle is
    -- the routine day, days 2-6 add a small bonus, day 7 is the milestone.
    v_day_in_cycle := ((v_streak.current_streak - 1) % 7) + 1;
    v_streak_bonus := case when v_day_in_cycle = 7 then 30 when v_day_in_cycle = 1 then 0 else 5 end;

    if v_streak_bonus > 0 then
      insert into token_events (consumer_id, action, points) values (v_consumer_id, 'streak_daily', v_streak_bonus);
    end if;
  end if;

  update consumer_wallets set balance = balance + v_points + v_streak_bonus, updated_at = now()
  where consumer_id = v_consumer_id
  returning balance into v_new_balance;

  if not found then
    insert into consumer_wallets (consumer_id, balance) values (v_consumer_id, v_points + v_streak_bonus)
    returning balance into v_new_balance;
  end if;

  return jsonb_build_object(
    'awarded', true,
    'points', v_points,
    'streak_bonus', v_streak_bonus,
    'balance', v_new_balance,
    'streak', coalesce(v_streak.current_streak, null)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- award_follow: one-time bonus the first time a consumer follows a business.
-- The actual (toggleable) follow relationship lives in `follows`, managed
-- directly by the client via RLS — this only ever fires the one-time reward.
-- ---------------------------------------------------------------------------
create or replace function public.award_follow(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_points int := 25;
  v_new_balance int;
begin
  select id into v_consumer_id from consumers where auth_user_id = auth.uid();
  if v_consumer_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'not_a_consumer');
  end if;

  begin
    insert into token_events (consumer_id, company_id, action, points)
    values (v_consumer_id, p_company_id, 'follow', v_points);
  exception when unique_violation then
    return jsonb_build_object('awarded', false, 'reason', 'already_awarded');
  end;

  update consumer_wallets set balance = balance + v_points, updated_at = now()
  where consumer_id = v_consumer_id
  returning balance into v_new_balance;

  if not found then
    insert into consumer_wallets (consumer_id, balance) values (v_consumer_id, v_points)
    returning balance into v_new_balance;
  end if;

  return jsonb_build_object('awarded', true, 'points', v_points, 'balance', v_new_balance);
end;
$$;

-- ---------------------------------------------------------------------------
-- redeem_reward: atomic balance check + spend, locked per-consumer so two
-- concurrent redemptions can't both pass the balance check and overdraw.
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

  select balance into v_balance from consumer_wallets where consumer_id = v_consumer_id;
  v_balance := coalesce(v_balance, 0);

  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance', 'balance', v_balance);
  end if;

  insert into token_events (consumer_id, reward_id, action, points)
  values (v_consumer_id, p_reward_id, 'redeem', -v_cost);

  update consumer_wallets set balance = balance - v_cost, updated_at = now()
  where consumer_id = v_consumer_id;

  insert into redemptions (reward_id, device_id, consumer_id, code)
  values (p_reward_id, v_consumer_id::text, v_consumer_id, p_code)
  returning id into v_redemption_id;

  return jsonb_build_object('ok', true, 'redemption_id', v_redemption_id, 'balance', v_balance - v_cost);
end;
$$;

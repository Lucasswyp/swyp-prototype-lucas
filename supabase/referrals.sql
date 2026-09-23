-- Referral program: every consumer gets a short shareable code; redeeming
-- someone else's code once pays both sides in Swyp Tokens. Run once in the
-- Supabase SQL Editor, after consumers.sql and rewards.sql. Safe to re-run.

alter table consumers add column if not exists referral_code text;
alter table consumers add column if not exists referred_by uuid references consumers(id) on delete set null;

create unique index if not exists consumers_referral_code_unique
  on consumers (referral_code)
  where referral_code is not null;

-- Backfill existing rows that predate this column (every future row gets one
-- from handle_new_consumer() below). Collisions are astronomically unlikely
-- at this table's size, but the unique index still protects against one.
update consumers
set referral_code = upper(left(replace(gen_random_uuid()::text, '-', ''), 7))
where referral_code is null;

-- handle_new_consumer() (consumers.sql) already generates everything else a
-- new row needs — this adds a referral_code alongside it, generated the same
-- way as the Google-signup username fallback (a random fragment, retried on
-- collision by the same exception handler that already exists there).
create or replace function public.handle_new_consumer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_is_email_signup boolean := new.raw_user_meta_data ? 'username';
  v_is_google_signup boolean := new.raw_app_meta_data->>'provider' = 'google';
  v_name text;
  v_username_base text;
  v_username text;
  v_avatar_url text;
  v_referral_code text;
begin
  if not (v_is_email_signup or v_is_google_signup) then
    return new;
  end if;

  if v_is_email_signup then
    v_name := new.raw_user_meta_data->>'name';
    v_username_base := new.raw_user_meta_data->>'username';
    v_username := v_username_base;
  else
    v_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    v_avatar_url := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
    v_username_base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    if length(v_username_base) < 3 then
      v_username_base := v_username_base || '_user';
    end if;
    v_username_base := left(v_username_base, 14);
    v_username := v_username_base || '_' || left(replace(new.id::text, '-', ''), 5);
  end if;

  v_referral_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 7));

  begin
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity, avatar_url, profile_completed, referral_code)
    values (
      new.id, v_name, v_username,
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity',
      v_avatar_url,
      not v_is_google_signup,
      v_referral_code
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;
  exception when unique_violation then
    v_username := v_username_base || '_' || left(replace(gen_random_uuid()::text, '-', ''), 5);
    v_referral_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 7));
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity, avatar_url, profile_completed, referral_code)
    values (
      new.id, v_name, v_username,
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity',
      v_avatar_url,
      not v_is_google_signup,
      v_referral_code
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;
  end;

  if v_consumer_id is not null then
    insert into public.consumer_wallets (consumer_id, balance) values (v_consumer_id, 20);
    insert into public.token_events (consumer_id, action, points) values (v_consumer_id, 'welcome_bonus', 20);
  end if;

  return new;
end;
$$;

-- apply_referral: callable once per consumer, from the client, right after
-- login — not baked into handle_new_consumer() above, because Google's OAuth
-- redirect never round-trips arbitrary client data the way email signUp()'s
-- options.data does. The client instead stashes the code from ?ref=... in
-- localStorage before the OAuth handshake and calls this once a session
-- exists (see src/lib/referral.ts), which works identically for every signup
-- path — email, Google, native or web.
create or replace function public.apply_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_already_referred uuid;
  v_referrer_id uuid;
  -- Both sides get the same amount — simpler to explain in the UI than an
  -- asymmetric split, and generous enough (half a euro each) to be worth
  -- sharing without making the loop trivially farmable at scale.
  v_reward int := 50;
  v_new_balance int;
begin
  select id, referred_by into v_consumer_id, v_already_referred
    from consumers where auth_user_id = auth.uid();

  if v_consumer_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'not_a_consumer');
  end if;
  if v_already_referred is not null then
    return jsonb_build_object('awarded', false, 'reason', 'already_referred');
  end if;
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('awarded', false, 'reason', 'invalid_code');
  end if;

  select id into v_referrer_id from consumers where referral_code = upper(trim(p_code));
  if v_referrer_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'code_not_found');
  end if;
  if v_referrer_id = v_consumer_id then
    return jsonb_build_object('awarded', false, 'reason', 'self_referral');
  end if;

  update consumers set referred_by = v_referrer_id where id = v_consumer_id;

  insert into token_events (consumer_id, action, points) values (v_consumer_id, 'referral_bonus', v_reward);
  update consumer_wallets set balance = balance + v_reward, updated_at = now()
  where consumer_id = v_consumer_id
  returning balance into v_new_balance;
  if not found then
    insert into consumer_wallets (consumer_id, balance) values (v_consumer_id, v_reward)
    returning balance into v_new_balance;
  end if;

  insert into token_events (consumer_id, action, points) values (v_referrer_id, 'referral_reward', v_reward);
  update consumer_wallets set balance = balance + v_reward, updated_at = now()
  where consumer_id = v_referrer_id;
  if not found then
    insert into consumer_wallets (consumer_id, balance) values (v_referrer_id, v_reward);
  end if;

  return jsonb_build_object('awarded', true, 'points', v_reward, 'balance', v_new_balance);
end;
$$;

-- get_referral_stats: a consumer can only ever SELECT their own row (see
-- consumers.sql RLS), so counting how many people *they* referred needs a
-- security-definer RPC rather than loosening that policy to expose other
-- consumers' rows.
create or replace function public.get_referral_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_consumer_id uuid;
  v_code text;
  v_count int;
begin
  select id, referral_code into v_consumer_id, v_code from consumers where auth_user_id = auth.uid();
  if v_consumer_id is null then
    return jsonb_build_object('referralCode', null, 'referredCount', 0);
  end if;
  select count(*) into v_count from consumers where referred_by = v_consumer_id;
  return jsonb_build_object('referralCode', v_code, 'referredCount', v_count);
end;
$$;

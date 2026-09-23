create table if not exists consumers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table consumers add column if not exists username text;
alter table consumers add column if not exists gender text;
alter table consumers add column if not exists birthdate date;
alter table consumers add column if not exists ethnicity text;
-- Email signups already chose their own username (and can add a photo any
-- time via edit-profile), but Google signups only ever get an auto-generated
-- handle and no photo — this flags those accounts so the client can send
-- them to /app/complete-profile once, before the feed, instead of leaving
-- them stuck with a "lucas_c4cd0"-style handle they never chose.
alter table consumers add column if not exists profile_completed boolean not null default true;

alter table consumers enable row level security;

drop policy if exists "consumer read own row" on consumers;
create policy "consumer read own row" on consumers for select using (auth_user_id = auth.uid());
drop policy if exists "consumer update own row" on consumers;
create policy "consumer update own row" on consumers for update using (auth_user_id = auth.uid());

-- Consumer signup (src/app/get-started/user/page.tsx) calls supabase.auth.signUp()
-- with name/username/gender/birthdate/ethnicity in options.data. This trigger is
-- the only thing that turns that into a real `consumers` row — without it, a
-- signed-up consumer has no row here and every reward RPC below silently no-ops
-- (they all resolve the consumer via `auth_user_id = auth.uid()`).
--
-- Also fires for "Ga verder met Google" sign-ins: Google's OAuth metadata has
-- no `username` key at all, so it used to fall straight through this
-- function's guard — that account would be fully logged in with no
-- `consumers` row, and every like/save/watch/follow tap would silently
-- return `not_a_consumer` forever, with nothing in the UI explaining why.
-- Business signups (src/app/api/auth/signup-business/route.ts) pass no
-- metadata at all via admin.createUser(), so they still fall through both
-- branches and never get a stray consumers row.
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
    -- Google's own picture, pre-filled as a starting point — the consumer
    -- can still change it on the forced complete-profile step.
    v_avatar_url := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
    v_username_base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    if length(v_username_base) < 3 then
      v_username_base := v_username_base || '_user';
    end if;
    -- Google gives no handle at all, so derive one from the email local-part
    -- plus a short id fragment to make a first-try collision unlikely. Only
    -- this synthetic branch is truncated to 14 chars to leave room for the
    -- suffix — a real chosen username (email-signup branch) keeps its full,
    -- already-validated length (up to 20 chars).
    v_username_base := left(v_username_base, 14);
    v_username := v_username_base || '_' || left(replace(new.id::text, '-', ''), 5);
  end if;

  begin
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity, avatar_url, profile_completed)
    values (
      new.id, v_name, v_username,
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity',
      v_avatar_url,
      not v_is_google_signup
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;
  exception when unique_violation then
    -- The username collided — a genuine race on the email-signup path (the
    -- client already checked availability moments earlier) or bad luck on
    -- the generated Google handle. Retry once with a random suffix instead
    -- of letting the exception abort the whole auth.users insert, which
    -- previously surfaced to the user as an opaque "Database error saving
    -- new user" with no way to recover or pick a different name.
    v_username := v_username_base || '_' || left(replace(gen_random_uuid()::text, '-', ''), 5);
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity, avatar_url, profile_completed)
    values (
      new.id, v_name, v_username,
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity',
      v_avatar_url,
      not v_is_google_signup
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;
  end;

  -- Endowed-progress welcome bonus: a new consumer starts already partway
  -- toward their first reward instead of at zero (Nunes & Drèze 2006 — a
  -- pre-stamped loyalty card nearly doubles completion vs. an empty one of
  -- the same real length).
  if v_consumer_id is not null then
    insert into public.consumer_wallets (consumer_id, balance) values (v_consumer_id, 20);
    insert into public.token_events (consumer_id, action, points) values (v_consumer_id, 'welcome_bonus', 20);
  end if;

  return new;
end;
$$;

-- Fires on insert AND whenever raw_app_meta_data/raw_user_meta_data change,
-- not just on the very first row. Google sign-in metadata isn't always
-- present in the exact same statement that creates the auth.users row (it
-- can land moments later as an update) — an insert-only trigger would look
-- like it does nothing for those accounts. handle_new_consumer()'s own
-- `on conflict (auth_user_id) do nothing` makes re-firing safe, so no
-- duplicate row or second welcome bonus is possible.
drop trigger if exists on_auth_user_created_consumer on auth.users;
create trigger on_auth_user_created_consumer
  after insert or update of raw_app_meta_data, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_consumer();

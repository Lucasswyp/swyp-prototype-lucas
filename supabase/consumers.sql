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
-- Guarded by `? 'username'` so business signups (which don't pass that key)
-- never get a stray consumers row.
create or replace function public.handle_new_consumer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
begin
  if new.raw_user_meta_data ? 'username' then
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity'
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;

    -- Endowed-progress welcome bonus: a new consumer starts already partway
    -- toward their first reward instead of at zero (Nunes & Drèze 2006 — a
    -- pre-stamped loyalty card nearly doubles completion vs. an empty one of
    -- the same real length).
    if v_consumer_id is not null then
      insert into public.consumer_wallets (consumer_id, balance) values (v_consumer_id, 20);
      insert into public.token_events (consumer_id, action, points) values (v_consumer_id, 'welcome_bonus', 20);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_consumer on auth.users;
create trigger on_auth_user_created_consumer
  after insert on auth.users
  for each row execute function public.handle_new_consumer();

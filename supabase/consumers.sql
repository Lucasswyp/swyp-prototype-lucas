create table if not exists consumers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table consumers enable row level security;

drop policy if exists "consumer read own row" on consumers;
create policy "consumer read own row" on consumers for select using (auth_user_id = auth.uid());
drop policy if exists "consumer update own row" on consumers;
create policy "consumer update own row" on consumers for update using (auth_user_id = auth.uid());

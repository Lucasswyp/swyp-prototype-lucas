-- Reporting and blocking — a consumer can flag an ad/business as
-- inappropriate, and can block a business so its ads stop appearing in
-- their feed entirely. Mirrors the existing `follows` table's shape/RLS
-- pattern (see supabase/rewards.sql).

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references consumers(id) on delete cascade,
  target_type text not null check (target_type in ('ad', 'business')),
  target_id uuid not null,
  reason text not null,
  details text,
  created_at timestamptz default now()
);
alter table reports enable row level security;

drop policy if exists "consumer insert own reports" on reports;
create policy "consumer insert own reports" on reports for insert
  with check (reporter_id in (select id from consumers where auth_user_id = auth.uid()));

create table if not exists blocked_businesses (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references consumers(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz default now(),
  unique (consumer_id, business_id)
);
alter table blocked_businesses enable row level security;

drop policy if exists "consumer manage own blocks" on blocked_businesses;
create policy "consumer manage own blocks" on blocked_businesses for all
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()))
  with check (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

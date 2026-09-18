-- Swyp shared backend schema
-- Run this once in Supabase SQL Editor.

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  banner_url text,
  category text,
  location text,
  website text,
  description text,
  verified boolean default false,
  followers int default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric not null default 0,
  old_price numeric,
  category text,
  url text,
  rating numeric default 4.5,
  highlights text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  objective text,
  status text default 'Draft',
  daily_budget numeric default 0,
  total_budget numeric default 0,
  start_date date,
  end_date date,
  targeting jsonb default '{}',
  reward_watch int default 1,
  reward_like int default 2,
  reward_save int default 3,
  reward_click int default 2,
  created_at timestamptz default now()
);

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  video_url text not null,
  poster_url text,
  caption text,
  category text,
  cta_label text default 'Bekijk product',
  created_at timestamptz default now()
);

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  category text,
  token_cost int not null default 100,
  money_value numeric,
  terms text,
  stock int default 100,
  start_date date,
  end_date date,
  redemption_method text default 'code',
  created_at timestamptz default now()
);

create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid references rewards(id) on delete cascade,
  device_id text not null,
  code text not null,
  status text default 'active',
  redeemed_at timestamptz default now()
);

create table if not exists interactions (
  id bigint generated always as identity primary key,
  device_id text not null,
  business_id uuid references businesses(id) on delete cascade,
  ad_id uuid references ads(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  event_name text not null,
  value numeric,
  created_at timestamptz default now()
);

alter table businesses enable row level security;
alter table products enable row level security;
alter table campaigns enable row level security;
alter table ads enable row level security;
alter table rewards enable row level security;
alter table redemptions enable row level security;
alter table interactions enable row level security;

-- Public (consumer app) read access
drop policy if exists "public read businesses" on businesses;
create policy "public read businesses" on businesses for select using (true);
drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (true);
drop policy if exists "public read campaigns" on campaigns;
create policy "public read campaigns" on campaigns for select using (true);
drop policy if exists "public read ads" on ads;
create policy "public read ads" on ads for select using (true);
drop policy if exists "public read rewards" on rewards;
create policy "public read rewards" on rewards for select using (true);
drop policy if exists "public read redemptions" on redemptions;
create policy "public read redemptions" on redemptions for select using (true);
drop policy if exists "public insert redemptions" on redemptions;
create policy "public insert redemptions" on redemptions for insert with check (true);
drop policy if exists "public update redemptions" on redemptions;
create policy "public update redemptions" on redemptions for update using (true);
drop policy if exists "public insert interactions" on interactions;
create policy "public insert interactions" on interactions for insert with check (true);
drop policy if exists "public read interactions" on interactions;
create policy "public read interactions" on interactions for select using (true);

-- Business owners manage their own rows
drop policy if exists "business update own row" on businesses;
create policy "business update own row" on businesses for update using (auth_user_id = auth.uid());

drop policy if exists "business insert own products" on products;
create policy "business insert own products" on products for insert with check (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business update own products" on products;
create policy "business update own products" on products for update using (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business delete own products" on products;
create policy "business delete own products" on products for delete using (business_id in (select id from businesses where auth_user_id = auth.uid()));

drop policy if exists "business insert own campaigns" on campaigns;
create policy "business insert own campaigns" on campaigns for insert with check (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business update own campaigns" on campaigns;
create policy "business update own campaigns" on campaigns for update using (business_id in (select id from businesses where auth_user_id = auth.uid()));

drop policy if exists "business insert own ads" on ads;
create policy "business insert own ads" on ads for insert with check (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business update own ads" on ads;
create policy "business update own ads" on ads for update using (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business delete own ads" on ads;
create policy "business delete own ads" on ads for delete using (business_id in (select id from businesses where auth_user_id = auth.uid()));

drop policy if exists "business insert own rewards" on rewards;
create policy "business insert own rewards" on rewards for insert with check (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business update own rewards" on rewards;
create policy "business update own rewards" on rewards for update using (business_id in (select id from businesses where auth_user_id = auth.uid()));
drop policy if exists "business delete own rewards" on rewards;
create policy "business delete own rewards" on rewards for delete using (business_id in (select id from businesses where auth_user_id = auth.uid()));

-- Realtime: let the consumer app see business changes instantly instead of
-- waiting for the 20s polling fallback.
alter publication supabase_realtime add table businesses, products, ads, campaigns, rewards;

-- Video storage bucket
insert into storage.buckets (id, name, public)
values ('ad-videos', 'ad-videos', true)
on conflict (id) do nothing;

drop policy if exists "public read ad-videos" on storage.objects;
create policy "public read ad-videos" on storage.objects for select using (bucket_id = 'ad-videos');
drop policy if exists "business upload ad-videos" on storage.objects;
create policy "business upload ad-videos" on storage.objects for insert with check (bucket_id = 'ad-videos' and auth.role() = 'authenticated');
drop policy if exists "business update ad-videos" on storage.objects;
create policy "business update ad-videos" on storage.objects for update using (bucket_id = 'ad-videos' and auth.role() = 'authenticated');
drop policy if exists "business delete ad-videos" on storage.objects;
create policy "business delete ad-videos" on storage.objects for delete using (bucket_id = 'ad-videos' and auth.role() = 'authenticated');

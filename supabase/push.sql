-- Native push notification device tokens (APNs, via @capacitor/push-notifications).
-- Run once in the Supabase SQL Editor, after consumers.sql and rewards.sql.
--
-- A consumer can have several tokens (multiple devices, or a reinstalled
-- app getting a new token from Apple) — nothing here ever deletes a stale
-- token automatically; the send job (src/app/api/cron/streak-reminder)
-- prunes a token the moment APNs reports it as no longer valid.
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references consumers(id) on delete cascade,
  token text not null,
  platform text not null default 'ios',
  created_at timestamptz default now(),
  unique (consumer_id, token)
);

alter table push_tokens enable row level security;

-- The client only ever registers/removes its own token; reading and sending
-- pushes happens exclusively through the service-role key from the cron
-- job, so there's no SELECT policy for regular consumers.
drop policy if exists "consumer insert own push token" on push_tokens;
create policy "consumer insert own push token" on push_tokens for insert
  with check (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

drop policy if exists "consumer delete own push token" on push_tokens;
create policy "consumer delete own push token" on push_tokens for delete
  using (consumer_id in (select id from consumers where auth_user_id = auth.uid()));

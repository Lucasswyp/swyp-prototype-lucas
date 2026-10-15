-- Feedback van testers. Alleen de server (service role) schrijft en leest;
-- geen enkele client-policy, dus niemand kan feedback van anderen zien.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null default 'overig' check (kind in ('bug', 'idee', 'overig')),
  message text not null check (char_length(message) between 3 and 2000),
  page text,
  user_agent text
);

alter table feedback enable row level security;

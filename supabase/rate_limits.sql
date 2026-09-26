-- Simple fixed-window rate limiter, backed by Postgres instead of an
-- in-memory counter (which wouldn't be shared across separate serverless
-- function instances) or a new external service (Upstash etc.) just for
-- this. Good enough at Swyp's current traffic; revisit if that changes.
create table if not exists rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);
alter table rate_limits enable row level security;
-- No client policies at all — this is only ever touched via the
-- security-definer RPC below, called from server-side API routes using the
-- anon/service key, never directly from the browser.

create or replace function check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_window_start timestamptz;
  v_count int;
begin
  insert into rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else rate_limits.window_start
        end
  returning window_start, count into v_window_start, v_count;

  return v_count <= p_max;
end;
$$;

grant execute on function check_rate_limit(text, int, int) to anon, authenticated;

-- Ad moderation gate: new ads must be reviewed before they reach the
-- consumer feed, instead of going live the instant a business publishes a
-- campaign. Existing ads (already live before this migration) are
-- grandfathered in as approved so nothing already shipping disappears.

alter table ads add column if not exists moderation_status text not null default 'pending';
alter table ads drop constraint if exists ads_moderation_status_check;
alter table ads add constraint ads_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

-- One-time backfill: everything that already existed when this migration
-- runs is presumed fine (it was already live in production). Only ads
-- created after this point start out 'pending' via the column default above.
update ads set moderation_status = 'approved' where moderation_status = 'pending';

-- ---------------------------------------------------------------------------
-- Minimal admin allowlist — just enough to gate the review screen. No app
-- role/permissions system; a handful of trusted emails is plenty at this
-- stage, and this list is only ever readable through the security-definer
-- functions below (no direct select policy).
-- ---------------------------------------------------------------------------
create table if not exists admins (
  auth_user_id uuid primary key references auth.users(id) on delete cascade
);
alter table admins enable row level security;

create or replace function is_admin()
returns boolean
language sql security definer set search_path = public as $$
  select exists(select 1 from admins where auth_user_id = auth.uid());
$$;

create or replace function get_pending_ads()
returns table (
  id uuid,
  video_url text,
  poster_url text,
  caption text,
  category text,
  cta_label text,
  business_name text,
  product_name text,
  created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select a.id, a.video_url, a.poster_url, a.caption, a.category, a.cta_label,
           b.name, p.name, a.created_at
    from ads a
    join businesses b on b.id = a.business_id
    join products p on p.id = a.product_id
    where a.moderation_status = 'pending'
    order by a.created_at asc;
end;
$$;

create or replace function set_ad_moderation_status(p_ad_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;
  update ads set moderation_status = p_status where id = p_ad_id;
end;
$$;

grant execute on function is_admin() to authenticated;
grant execute on function get_pending_ads() to authenticated;
grant execute on function set_ad_moderation_status(uuid, text) to authenticated;

insert into admins (auth_user_id)
select id from auth.users where email = 'lucas@swyp.it'
on conflict do nothing;

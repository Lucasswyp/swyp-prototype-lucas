-- Real account features: unique usernames and profile photos.
-- Run once in the Supabase SQL Editor, after consumers.sql.

alter table consumers add column if not exists avatar_url text;

-- Case-insensitive uniqueness: "LucasS" and "lucass" are the same handle.
-- Partial (username not null) so existing/future null usernames never
-- collide with each other under the index.
create unique index if not exists consumers_username_unique
  on consumers (lower(username))
  where username is not null;

-- Callable by anon/authenticated alike so the signup form and the edit-
-- profile form can both check availability before submitting, without
-- needing a read policy that would expose the whole consumers table.
create or replace function public.is_username_taken(p_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from consumers where lower(username) = lower(p_username)
  );
$$;

-- Profile photo storage. Path convention: {auth_user_id}/avatar.<ext>, so the
-- RLS policies below can key off auth.uid() directly without a subquery.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "consumer manage own avatar" on storage.objects;
create policy "consumer manage own avatar" on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Lets a logged-in consumer update their own name/username/avatar from an
-- edit-profile screen (the existing consumers.sql only granted select+update
-- using auth_user_id = auth.uid(), which already covers this — restated here
-- for clarity now that the app actually exercises the update path).
drop policy if exists "consumer update own row" on consumers;
create policy "consumer update own row" on consumers for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

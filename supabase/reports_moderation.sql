-- Meldingen afhandelen (App Store-richtlijn 1.2: gemelde inhoud moet snel
-- bekeken en zo nodig verwijderd, en de overtreder moet geweerd kunnen worden).
--  * reports krijgt een status (open, actioned, dismissed) en wie het afhandelde.
--  * Een admin ziet de open meldingen met de gemelde inhoud erbij en kan: negeren,
--    een bericht verwijderen, een gebruiker schorsen of een advertentie afkeuren.
--  * Een geschorste gebruiker kan niet meer chatten, reageren of gevonden worden.
-- Eén transactie; veilig om opnieuw te draaien. Draai dm.sql eerst.
begin;

alter table reports add column if not exists status text not null default 'open';
alter table reports drop constraint if exists reports_status_check;
alter table reports add constraint reports_status_check check (status in ('open', 'actioned', 'dismissed'));
alter table reports add column if not exists handled_at timestamptz;
alter table reports add column if not exists handled_by uuid references auth.users(id) on delete set null;
alter table reports add column if not exists note text;
create index if not exists reports_status_created on reports (status, created_at);

alter table consumers add column if not exists suspended_at timestamptz;

-- Eén plek bepaalt wie nog "bestaat" voor berichten: een geschorste gebruiker
-- krijgt overal not_a_consumer terug en ziet geen gesprekken meer.
create or replace function public.dm_me()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from consumers where auth_user_id = auth.uid() and suspended_at is null;
$$;

-- Geschorste gebruikers zijn niet te vinden en er kan geen gesprek mee gestart worden.
create or replace function public.dm_search_consumers(p_query text)
returns table (id uuid, username text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select c.id, c.username, c.avatar_url
  from consumers c
  where public.dm_me() is not null
    and char_length(regexp_replace(trim(coalesce(p_query, '')), '^@', '')) >= 2
    and c.id <> public.dm_me()
    and c.username is not null
    and c.profile_completed
    and c.suspended_at is null
    and not public.dm_is_blocked(c.id, public.dm_me())
    and starts_with(lower(c.username), lower(regexp_replace(trim(p_query), '^@', '')))
  order by c.username
  limit 15;
$$;

create or replace function public.dm_get_or_create_conversation(p_other uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.dm_me();
  v_id uuid;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_consumer');
  end if;
  if p_other is null or p_other = v_me then
    return jsonb_build_object('ok', false, 'reason', 'invalid_user');
  end if;
  if not exists (select 1 from consumers where id = p_other and suspended_at is null) then
    return jsonb_build_object('ok', false, 'reason', 'user_not_found');
  end if;
  if public.dm_is_blocked(v_me, p_other) then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;

  insert into conversations (user_a, user_b)
  values (least(v_me, p_other), greatest(v_me, p_other))
  on conflict (user_a, user_b) do update set user_a = excluded.user_a
  returning id into v_id;

  return jsonb_build_object('ok', true, 'conversation_id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Alleen voor admins
-- ---------------------------------------------------------------------------
create or replace function public.get_open_reports()
returns table (
  id uuid,
  created_at timestamptz,
  target_type text,
  target_id uuid,
  reason text,
  details text,
  reporter_username text,
  context jsonb
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select r.id, r.created_at, r.target_type, r.target_id, r.reason, r.details, rc.username,
    case r.target_type
      when 'message' then (
        select jsonb_build_object('body', m.body, 'kind', m.kind, 'sender_id', m.sender_id,
                                  'sender_username', sc.username, 'sent_at', m.created_at,
                                  'suspended', sc.suspended_at is not null)
        from messages m join consumers sc on sc.id = m.sender_id where m.id = r.target_id)
      when 'user' then (
        select jsonb_build_object('username', u.username, 'suspended', u.suspended_at is not null)
        from consumers u where u.id = r.target_id)
      when 'ad' then (
        select jsonb_build_object('caption', a.caption, 'business', b.name, 'status', a.moderation_status)
        from ads a join businesses b on b.id = a.business_id where a.id = r.target_id)
      when 'business' then (
        select jsonb_build_object('name', b.name) from businesses b where b.id = r.target_id)
    end
  from reports r
  left join consumers rc on rc.id = r.reporter_id
  where r.status = 'open'
  order by r.created_at asc
  limit 200;
end;
$$;

create or replace function public.resolve_report(p_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  rep reports%rowtype;
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_action is null or p_action not in ('dismiss', 'remove_message', 'remove_and_suspend', 'suspend_user', 'reject_ad') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_action');
  end if;

  select * into rep from reports where id = p_id and status = 'open' for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_action in ('remove_message', 'remove_and_suspend') then
    if rep.target_type <> 'message' then
      return jsonb_build_object('ok', false, 'reason', 'wrong_target');
    end if;
    select sender_id into v_user from messages where id = rep.target_id;
    delete from messages where id = rep.target_id;
    if p_action = 'remove_and_suspend' and v_user is not null then
      update consumers set suspended_at = coalesce(suspended_at, now()) where id = v_user;
    end if;
  elsif p_action = 'suspend_user' then
    if rep.target_type = 'user' then
      v_user := rep.target_id;
    elsif rep.target_type = 'message' then
      select sender_id into v_user from messages where id = rep.target_id;
    else
      return jsonb_build_object('ok', false, 'reason', 'wrong_target');
    end if;
    if v_user is null then
      return jsonb_build_object('ok', false, 'reason', 'target_gone');
    end if;
    update consumers set suspended_at = coalesce(suspended_at, now()) where id = v_user;
  elsif p_action = 'reject_ad' then
    if rep.target_type <> 'ad' then
      return jsonb_build_object('ok', false, 'reason', 'wrong_target');
    end if;
    update ads set moderation_status = 'rejected' where id = rep.target_id;
  end if;

  update reports set
    status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end,
    handled_at = now(),
    handled_by = auth.uid(),
    note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_id;

  return jsonb_build_object('ok', true, 'action', p_action);
end;
$$;

create or replace function public.get_suspended_users()
returns table (id uuid, username text, suspended_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query select c.id, c.username, c.suspended_at from consumers c where c.suspended_at is not null order by c.suspended_at desc;
end;
$$;

create or replace function public.set_user_suspended(p_consumer uuid, p_suspended boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update consumers set suspended_at = case when p_suspended then coalesce(suspended_at, now()) else null end where id = p_consumer;
  return jsonb_build_object('ok', found, 'suspended', p_suspended);
end;
$$;

revoke execute on function public.get_open_reports() from public, anon;
revoke execute on function public.resolve_report(uuid, text, text) from public, anon;
revoke execute on function public.get_suspended_users() from public, anon;
revoke execute on function public.set_user_suspended(uuid, boolean) from public, anon;
grant execute on function public.get_open_reports() to authenticated;
grant execute on function public.resolve_report(uuid, text, text) to authenticated;
grant execute on function public.get_suspended_users() to authenticated;
grant execute on function public.set_user_suspended(uuid, boolean) to authenticated;

commit;

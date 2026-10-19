-- Berichten (DM) tussen consumenten: tekst sturen, video's doorsturen,
-- reageren met een emoji, blokkeren en melden. Een video doorsturen levert de
-- afzender punten op (max 5 betaalde shares per dag, één keer per video) en
-- wordt als 'share' vastgelegd zodat het bedrijf het in het dashboard ziet.
-- Eén transactie; veilig om opnieuw te draaien.
begin;

-- ---------------------------------------------------------------------------
-- 1. Tabellen. Schrijven gaat alleen via de functies hieronder; de client mag
--    met RLS alleen lezen wat bij zijn eigen gesprekken hoort.
-- ---------------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references consumers(id) on delete cascade,
  user_b uuid not null references consumers(id) on delete cascade,
  a_last_read timestamptz not null default now(),
  b_last_read timestamptz not null default now(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists conversations_user_a on conversations (user_a, last_message_at desc);
create index if not exists conversations_user_b on conversations (user_b, last_message_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references consumers(id) on delete cascade,
  kind text not null check (kind in ('text', 'video')),
  body text check (body is null or char_length(body) <= 1000),
  ad_id uuid references ads(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  check (kind = 'video' or (body is not null and char_length(trim(body)) > 0))
);
create index if not exists messages_conversation_created on messages (conversation_id, created_at desc);
create index if not exists messages_sender_created on messages (sender_id, created_at desc);

create table if not exists message_reactions (
  message_id uuid not null references messages(id) on delete cascade,
  consumer_id uuid not null references consumers(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, consumer_id)
);

create table if not exists dm_blocks (
  blocker_id uuid not null references consumers(id) on delete cascade,
  blocked_id uuid not null references consumers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table conversations enable row level security;
alter table messages enable row level security;
alter table message_reactions enable row level security;
alter table dm_blocks enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Hulpfuncties
-- ---------------------------------------------------------------------------
create or replace function public.dm_me()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from consumers where auth_user_id = auth.uid();
$$;

create or replace function public.dm_in_conversation(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversations c
    where c.id = p_conversation_id and public.dm_me() in (c.user_a, c.user_b)
  );
$$;

create or replace function public.dm_is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dm_blocks
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

drop policy if exists "read own conversations" on conversations;
create policy "read own conversations" on conversations for select
  using (public.dm_me() in (user_a, user_b));

drop policy if exists "read messages of own conversations" on messages;
create policy "read messages of own conversations" on messages for select
  using (public.dm_in_conversation(conversation_id));

drop policy if exists "read reactions of own conversations" on message_reactions;
create policy "read reactions of own conversations" on message_reactions for select
  using (exists (select 1 from messages m where m.id = message_id and public.dm_in_conversation(m.conversation_id)));

drop policy if exists "read own dm blocks" on dm_blocks;
create policy "read own dm blocks" on dm_blocks for select
  using (blocker_id = public.dm_me());

-- Berichten en reacties live doorgeven aan de app.
do $$
begin
  begin alter publication supabase_realtime add table messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table message_reactions; exception when duplicate_object then null; end;
end $$;

-- Meldingen mogen nu ook over een bericht of een gebruiker gaan.
alter table reports drop constraint if exists reports_target_type_check;
alter table reports add constraint reports_target_type_check
  check (target_type in ('ad', 'business', 'message', 'user'));

-- ---------------------------------------------------------------------------
-- 3. Gebruikers zoeken en gesprekken
-- ---------------------------------------------------------------------------
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
  if not exists (select 1 from consumers where id = p_other) then
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

create or replace function public.dm_conversation_info(p_conversation_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me uuid := public.dm_me();
  v_conv conversations%rowtype;
  v_other consumers%rowtype;
begin
  select * into v_conv from conversations where id = p_conversation_id and v_me in (user_a, user_b);
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'conversation_not_found');
  end if;
  select * into v_other from consumers where id = case when v_conv.user_a = v_me then v_conv.user_b else v_conv.user_a end;
  return jsonb_build_object(
    'ok', true,
    'me', v_me,
    'other_id', v_other.id,
    'other_username', v_other.username,
    'other_avatar_url', v_other.avatar_url,
    'i_blocked', exists (select 1 from dm_blocks where blocker_id = v_me and blocked_id = v_other.id),
    'blocked_me', exists (select 1 from dm_blocks where blocker_id = v_other.id and blocked_id = v_me)
  );
end;
$$;

create or replace function public.dm_list_conversations()
returns table (
  conversation_id uuid,
  other_id uuid,
  other_username text,
  other_avatar_url text,
  last_kind text,
  last_body text,
  last_sender_is_me boolean,
  last_message_at timestamptz,
  unread_count int
)
language sql stable security definer set search_path = public as $$
  select c.id,
         o.id,
         o.username,
         o.avatar_url,
         lm.kind,
         lm.body,
         lm.sender_id = me.id,
         lm.created_at,
         (select count(*)::int from messages m
           where m.conversation_id = c.id
             and m.sender_id <> me.id
             and m.created_at > case when c.user_a = me.id then c.a_last_read else c.b_last_read end)
  from (select public.dm_me() as id) me
  join conversations c on me.id in (c.user_a, c.user_b)
  join consumers o on o.id = case when c.user_a = me.id then c.user_b else c.user_a end
  join lateral (
    select m.kind, m.body, m.sender_id, m.created_at
    from messages m where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) lm on true
  where not exists (select 1 from dm_blocks b where b.blocker_id = me.id and b.blocked_id = o.id)
  order by lm.created_at desc
  limit 100;
$$;

create or replace function public.dm_unread_total()
returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(unread_count), 0)::int from public.dm_list_conversations();
$$;

create or replace function public.dm_mark_read(p_conversation_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.dm_me();
  v_rows int;
begin
  update conversations set
    a_last_read = case when user_a = v_me then clock_timestamp() else a_last_read end,
    b_last_read = case when user_b = v_me then clock_timestamp() else b_last_read end
  where id = p_conversation_id and v_me in (user_a, user_b);
  get diagnostics v_rows = row_count;
  return jsonb_build_object('ok', v_rows > 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Bericht sturen. Een video doorsturen geeft de afzender punten.
-- ---------------------------------------------------------------------------
create or replace function public.dm_send_message(
  p_conversation_id uuid,
  p_kind text,
  p_body text default null,
  p_ad_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.dm_me();
  v_conv conversations%rowtype;
  v_other uuid;
  v_body text := nullif(trim(coalesce(p_body, '')), '');
  v_msg_id uuid;
  v_business uuid;
  v_product uuid;
  v_today date := (now() at time zone 'Europe/Amsterdam')::date;
  v_points constant int := 12;
  v_daily_cap constant int := 5;
  v_shares_today int;
  v_balance int;
  v_awarded boolean := false;
  v_award_reason text := null;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_consumer');
  end if;
  if p_kind is null or p_kind not in ('text', 'video') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_kind');
  end if;

  select * into v_conv from conversations where id = p_conversation_id and v_me in (user_a, user_b);
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'conversation_not_found');
  end if;
  v_other := case when v_conv.user_a = v_me then v_conv.user_b else v_conv.user_a end;

  if public.dm_is_blocked(v_me, v_other) then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;
  if v_body is not null and char_length(v_body) > 1000 then
    return jsonb_build_object('ok', false, 'reason', 'too_long');
  end if;
  if p_kind = 'text' and v_body is null then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_me::text));

  if (select count(*) from messages where sender_id = v_me and created_at > now() - interval '1 minute') >= 20 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  if p_kind = 'video' then
    select a.business_id, a.product_id into v_business, v_product
    from ads a
    where a.id = p_ad_id and a.moderation_status = 'approved' and public.ad_is_live(a.id);
    if v_business is null then
      return jsonb_build_object('ok', false, 'reason', 'ad_not_available');
    end if;
  else
    p_ad_id := null;
  end if;

  insert into messages (conversation_id, sender_id, kind, body, ad_id)
  values (p_conversation_id, v_me, p_kind, v_body, p_ad_id)
  returning id into v_msg_id;

  update conversations set
    last_message_at = clock_timestamp(),
    a_last_read = case when user_a = v_me then clock_timestamp() else a_last_read end,
    b_last_read = case when user_b = v_me then clock_timestamp() else b_last_read end
  where id = p_conversation_id;

  if p_kind = 'video' then
    -- Het bedrijf ziet elke doorgestuurde video in zijn dashboard.
    insert into interactions (device_id, business_id, ad_id, product_id, event_name)
    values (v_me::text, v_business, p_ad_id, v_product, 'share');

    select count(*) into v_shares_today
    from token_events
    where consumer_id = v_me and action = 'share'
      and (created_at at time zone 'Europe/Amsterdam')::date = v_today;

    if v_shares_today >= v_daily_cap then
      v_award_reason := 'daily_cap';
    else
      begin
        insert into token_events (consumer_id, ad_id, company_id, action, points)
        values (v_me, p_ad_id, v_business, 'share', v_points);
        v_awarded := true;
      exception when unique_violation then
        v_award_reason := 'already_awarded';
      end;
    end if;

    if v_awarded then
      update consumer_wallets set balance = balance + v_points, updated_at = now()
      where consumer_id = v_me
      returning balance into v_balance;
      if not found then
        insert into consumer_wallets (consumer_id, balance) values (v_me, v_points)
        returning balance into v_balance;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'message_id', v_msg_id,
    'awarded', v_awarded,
    'points', case when v_awarded then v_points else 0 end,
    'balance', v_balance,
    'award_reason', v_award_reason
  );
end;
$$;

-- Eén punt per video per afzender, en niet meer dan 5 betaalde shares per dag.
create unique index if not exists token_events_unique_share
  on token_events (consumer_id, ad_id)
  where action = 'share' and ad_id is not null;

-- Reageren met een emoji: nog een keer dezelfde emoji haalt hem weg, een andere
-- emoji vervangt de vorige.
create or replace function public.dm_react(p_message_id uuid, p_emoji text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.dm_me();
  v_conv conversations%rowtype;
  v_existing text;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_consumer');
  end if;
  -- Unicode-escapes in plaats van losse emoji: zo kan geen kopieer/plak-stap of
  -- tekenset de lijst beschadigen. Moet gelijk blijven aan src/lib/dm.ts.
  if p_emoji is null or p_emoji <> all (array[
    U&'\+01F44D', U&'\2764\FE0F', U&'\+01F602', U&'\+01F525', U&'\+01F62E',
    U&'\+01F622', U&'\+01F44E', U&'\+01F60D', U&'\+01F4AF'
  ]) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_emoji');
  end if;

  select c.* into v_conv
  from messages m join conversations c on c.id = m.conversation_id
  where m.id = p_message_id and v_me in (c.user_a, c.user_b);
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'message_not_found');
  end if;
  if public.dm_is_blocked(v_conv.user_a, v_conv.user_b) then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;

  select emoji into v_existing from message_reactions where message_id = p_message_id and consumer_id = v_me;
  if v_existing = p_emoji then
    delete from message_reactions where message_id = p_message_id and consumer_id = v_me;
    return jsonb_build_object('ok', true, 'action', 'removed');
  end if;

  insert into message_reactions (message_id, consumer_id, emoji)
  values (p_message_id, v_me, p_emoji)
  on conflict (message_id, consumer_id) do update set emoji = excluded.emoji, created_at = now();
  return jsonb_build_object('ok', true, 'action', case when v_existing is null then 'added' else 'changed' end);
end;
$$;

-- Blokkeren: er kan dan niets meer tussen jullie gestuurd worden.
create or replace function public.dm_block(p_other uuid, p_block boolean default true)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.dm_me();
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_consumer');
  end if;
  if p_other is null or p_other = v_me then
    return jsonb_build_object('ok', false, 'reason', 'invalid_user');
  end if;
  if p_block then
    insert into dm_blocks (blocker_id, blocked_id) values (v_me, p_other) on conflict do nothing;
  else
    delete from dm_blocks where blocker_id = v_me and blocked_id = p_other;
  end if;
  return jsonb_build_object('ok', true, 'blocked', p_block);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Een share telt mee in het uitgekeerde budget van de campagne.
-- ---------------------------------------------------------------------------
create or replace function public.campaign_spent_eur(p_campaign_id uuid, p_since date default null)
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(te.points), 0) / 100.0
  from token_events te
  join ads a on a.id = te.ad_id
  where a.campaign_id = p_campaign_id
    and te.points > 0
    and te.action in ('watch80', 'like', 'save', 'click', 'share')
    and (p_since is null or te.created_at >= p_since);
$$;

-- ---------------------------------------------------------------------------
-- 6. Rechten: alleen ingelogde gebruikers.
-- ---------------------------------------------------------------------------
revoke execute on function public.dm_search_consumers(text) from public, anon;
revoke execute on function public.dm_get_or_create_conversation(uuid) from public, anon;
revoke execute on function public.dm_conversation_info(uuid) from public, anon;
revoke execute on function public.dm_list_conversations() from public, anon;
revoke execute on function public.dm_unread_total() from public, anon;
revoke execute on function public.dm_mark_read(uuid) from public, anon;
revoke execute on function public.dm_send_message(uuid, text, text, uuid) from public, anon;
revoke execute on function public.dm_react(uuid, text) from public, anon;
revoke execute on function public.dm_block(uuid, boolean) from public, anon;
grant execute on function public.dm_search_consumers(text) to authenticated;
grant execute on function public.dm_get_or_create_conversation(uuid) to authenticated;
grant execute on function public.dm_conversation_info(uuid) to authenticated;
grant execute on function public.dm_list_conversations() to authenticated;
grant execute on function public.dm_unread_total() to authenticated;
grant execute on function public.dm_mark_read(uuid) to authenticated;
grant execute on function public.dm_send_message(uuid, text, text, uuid) to authenticated;
grant execute on function public.dm_react(uuid, text) to authenticated;
grant execute on function public.dm_block(uuid, boolean) to authenticated;

commit;

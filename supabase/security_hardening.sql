-- Security hardening: closes the ways a signed-in user could grant themselves
-- tokens, approve their own ads, or read other businesses' data. Run once in
-- the Supabase SQL Editor, after all earlier files. Safe to re-run.
-- Runs as one transaction: either everything applies or nothing does.

begin;

-- ---------------------------------------------------------------------------
-- 1. Rewards must cost something. A negative token_cost made redeem_reward()
--    ADD tokens to the redeemer's wallet. NOT VALID checks new/changed rows
--    without failing on any old row; see security_hardening_check.sql.
-- ---------------------------------------------------------------------------
alter table rewards drop constraint if exists rewards_token_cost_positive;
alter table rewards add constraint rewards_token_cost_positive check (token_cost > 0) not valid;

create or replace function public.redeem_reward(p_reward_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_cost int;
  v_balance int;
  v_redemption_id uuid;
begin
  select id into v_consumer_id from consumers where auth_user_id = auth.uid();
  if v_consumer_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_consumer');
  end if;

  if p_code is null or length(p_code) < 4 or length(p_code) > 32 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_consumer_id::text));

  select token_cost into v_cost from rewards where id = p_reward_id;
  if v_cost is null then
    return jsonb_build_object('ok', false, 'reason', 'reward_not_found');
  end if;
  if v_cost <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_reward');
  end if;

  select balance into v_balance from consumer_wallets where consumer_id = v_consumer_id;
  v_balance := coalesce(v_balance, 0);

  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance', 'balance', v_balance);
  end if;

  insert into token_events (consumer_id, reward_id, action, points)
  values (v_consumer_id, p_reward_id, 'redeem', -v_cost);

  update consumer_wallets set balance = balance - v_cost, updated_at = now()
  where consumer_id = v_consumer_id;

  insert into redemptions (reward_id, device_id, consumer_id, code)
  values (p_reward_id, v_consumer_id::text, v_consumer_id, p_code)
  returning id into v_redemption_id;

  return jsonb_build_object('ok', true, 'redemption_id', v_redemption_id, 'balance', v_balance - v_cost);
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Consumers: the update policy let a user write ANY column of their own
--    row, including referred_by (clear it, call apply_referral again, collect
--    50 tokens each round). Only the columns the app actually edits stay
--    writable; the security-definer RPCs are unaffected.
-- ---------------------------------------------------------------------------
revoke update on consumers from anon, authenticated;
grant update (name, username, avatar_url, profile_completed, birthdate) on consumers to authenticated;

-- The age gate is only meaningful if a birthdate can't be rewritten later.
create or replace function public.consumers_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and old.birthdate is not null and new.birthdate is distinct from old.birthdate then
    new.birthdate := old.birthdate;
  end if;
  return new;
end;
$$;

drop trigger if exists consumers_guard_trg on consumers;
create trigger consumers_guard_trg before update on consumers
  for each row execute function public.consumers_guard();

-- ---------------------------------------------------------------------------
-- 3. Ads: a business could set its own ad to 'approved', or swap the video
--    after approval. Only an admin (or the service role / SQL editor, where
--    auth.uid() is null) may change moderation_status; editing the video,
--    caption or product sends an ad back to review.
-- ---------------------------------------------------------------------------
create or replace function public.ads_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.moderation_status := 'pending';
  else
    new.moderation_status := old.moderation_status;
    if new.video_url is distinct from old.video_url
       or new.caption is distinct from old.caption
       or new.product_id is distinct from old.product_id then
      new.moderation_status := 'pending';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ads_guard_trg on ads;
create trigger ads_guard_trg before insert or update on ads
  for each row execute function public.ads_guard();

-- Pending and rejected ads were readable by everyone through the API even
-- though the feed filtered them client-side. Now only the owner and admins
-- see them; everyone else sees approved ads.
drop policy if exists "public read ads" on ads;
drop policy if exists "read approved or own ads" on ads;
create policy "read approved or own ads" on ads for select using (
  moderation_status = 'approved'
  or business_id in (select id from businesses where auth_user_id = auth.uid())
  or public.is_admin()
);

-- ---------------------------------------------------------------------------
-- 4. Businesses: the update policy covered the whole row, including the
--    verified badge and the follower count.
-- ---------------------------------------------------------------------------
create or replace function public.businesses_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.verified := old.verified;
  new.followers := old.followers;
  new.auth_user_id := old.auth_user_id;
  return new;
end;
$$;

drop trigger if exists businesses_guard_trg on businesses;
create trigger businesses_guard_trg before update on businesses
  for each row execute function public.businesses_guard();

-- ---------------------------------------------------------------------------
-- 5. Interactions were readable by anyone. Inserting stays open (anonymous
--    viewers log impressions); reading is limited to the owning business.
-- ---------------------------------------------------------------------------
drop policy if exists "public read interactions" on interactions;
drop policy if exists "business reads own interactions" on interactions;
create policy "business reads own interactions" on interactions for select using (
  business_id in (select id from businesses where auth_user_id = auth.uid())
  or public.is_admin()
);

-- ---------------------------------------------------------------------------
-- 6. Redemptions are created only by redeem_reward(); nothing in the app
--    inserts them directly, so the open insert policy only enabled spam.
-- ---------------------------------------------------------------------------
drop policy if exists "public insert redemptions" on redemptions;

-- ---------------------------------------------------------------------------
-- 7. The rate limiter is called from the server with the service role only.
-- ---------------------------------------------------------------------------
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;

commit;

-- Nieuwe beloning: "product bekeken" (de knop "Bekijk product" in de feed), 5 punten,
-- één keer per video per gebruiker, maximaal 20 per dag. Los van "click": dat blijft de
-- doorklik naar de winkel (10 punten). De 5 punten tellen mee in het campagnebudget.
-- Draai na exposure_and_caps.sql. Eén transactie; herhaalbaar.
begin;

create unique index if not exists token_events_unique_view
  on token_events (consumer_id, ad_id) where action = 'view' and ad_id is not null;

-- Budget: ook 'view' telt mee als uitgekeerd.
create or replace function public.campaign_spent_eur(p_campaign_id uuid, p_since date default null)
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(te.points), 0) / 100.0
  from token_events te
  join ads a on a.id = te.ad_id
  where a.campaign_id = p_campaign_id
    and te.points > 0
    and te.action in ('watch80', 'like', 'save', 'click', 'share', 'view')
    and (p_since is null or te.created_at >= p_since);
$$;

-- Voordeur: dagmaxima als eerder, plus de nieuwe actie 'view'.
create or replace function public.award_interaction(p_ad_id uuid, p_action text, p_watch_ms int default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c_view_points constant int := 5;
  v_consumer uuid;
  v_cap int;
  v_today_count int;
  v_business uuid;
  v_balance int;
begin
  if not public.ad_is_live(p_ad_id) then
    return jsonb_build_object('awarded', false, 'reason', 'campaign_ended');
  end if;

  v_cap := case p_action when 'like' then 30 when 'save' then 20 when 'click' then 20 when 'view' then 20 else null end;
  if v_cap is not null or p_action = 'view' then
    select id into v_consumer from consumers where auth_user_id = auth.uid();
    if v_consumer is not null and v_cap is not null then
      select count(*) into v_today_count
      from token_events
      where consumer_id = v_consumer and action = p_action
        and (created_at at time zone 'Europe/Amsterdam')::date = (now() at time zone 'Europe/Amsterdam')::date;
      if v_today_count >= v_cap then
        return jsonb_build_object('awarded', false, 'reason', 'daily_cap');
      end if;
    end if;
  end if;

  if p_action = 'view' then
    if v_consumer is null then
      return jsonb_build_object('awarded', false, 'reason', 'not_a_consumer');
    end if;
    select business_id into v_business from ads where id = p_ad_id;
    if v_business is null then
      return jsonb_build_object('awarded', false, 'reason', 'ad_not_found');
    end if;
    perform pg_advisory_xact_lock(hashtext(v_consumer::text));
    begin
      insert into token_events (consumer_id, ad_id, company_id, action, points)
      values (v_consumer, p_ad_id, v_business, 'view', c_view_points);
    exception when unique_violation then
      return jsonb_build_object('awarded', false, 'reason', 'already_awarded');
    end;
    update consumer_wallets set balance = balance + c_view_points, updated_at = now()
    where consumer_id = v_consumer
    returning balance into v_balance;
    if not found then
      insert into consumer_wallets (consumer_id, balance) values (v_consumer, c_view_points)
      returning balance into v_balance;
    end if;
    return jsonb_build_object('awarded', true, 'points', c_view_points, 'balance', v_balance);
  end if;

  return public.award_interaction_core(p_ad_id, p_action, p_watch_ms);
end;
$$;

commit;

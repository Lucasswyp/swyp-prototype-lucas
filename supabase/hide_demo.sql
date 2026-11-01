-- Verzonnen demobedrijven (NØRR, Bloom & Bean, Hotel Lumen, FormaFit) verbergen,
-- omkeerbaar. Een bedrijf met hidden = true is onzichtbaar voor iedereen behalve
-- de eigenaar: niet in zoeken, bedrijfspagina's, producten, rewards of de feed,
-- en zijn beloningen zijn niet in te wisselen.
-- Terugzetten: update businesses set hidden = false where name in (...);
-- Draai na exposure_and_caps.sql en reward_codes_and_budget.sql. Eén transactie; herhaalbaar.
begin;

alter table businesses add column if not exists hidden boolean not null default false;

-- Wie mag een bedrijf zien? Iedereen, tenzij het verborgen is.
create or replace function public.business_visible(p_business uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses b where b.id = p_business and not b.hidden);
$$;
grant execute on function public.business_visible(uuid) to anon, authenticated;

create or replace view public.public_businesses as
  select id, name, logo_url, banner_url, category, location, website, description, verified, followers, created_at
  from businesses
  where not hidden;
grant select on public.public_businesses to anon, authenticated;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (
  public.business_visible(business_id)
  or business_id in (select id from businesses where auth_user_id = auth.uid())
);

drop policy if exists "public read rewards" on rewards;
create policy "public read rewards" on rewards for select using (
  public.business_visible(business_id)
  or business_id in (select id from businesses where auth_user_id = auth.uid())
);

drop policy if exists "read approved or own ads" on ads;
create policy "read approved or own ads" on ads for select using (
  (moderation_status = 'approved' and public.ad_is_live(id) and public.business_visible(business_id))
  or business_id in (select id from businesses where auth_user_id = auth.uid())
  or public.is_admin()
);

-- Inwisselen kan niet voor een beloning van een verborgen bedrijf, ook niet met een rechtstreeks id.
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'redeem_reward_core') then
    alter function public.redeem_reward(uuid, text) rename to redeem_reward_core;
  end if;
end $$;

create or replace function public.redeem_reward(p_reward_id uuid, p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rewards r where r.id = p_reward_id and public.business_visible(r.business_id)) then
    return jsonb_build_object('ok', false, 'reason', 'reward_not_found');
  end if;
  return public.redeem_reward_core(p_reward_id, p_code);
end;
$$;
revoke execute on function public.redeem_reward(uuid, text) from public, anon;
grant execute on function public.redeem_reward(uuid, text) to authenticated;
revoke execute on function public.redeem_reward_core(uuid, text) from public, anon, authenticated;

-- De demobedrijven zelf.
update businesses set hidden = true where name in ('NØRR', 'Bloom & Bean', 'Hotel Lumen', 'FormaFit');

commit;

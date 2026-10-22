-- Echte doelgroepcijfers voor het bedrijfsdashboard (vervangt de demo-cijfers).
-- Een bedrijf ziet alleen geaggregeerde aantallen van kijkers die iets deden
-- met zijn video's (kijken tot 80%, liken, opslaan, doorklikken, doorsturen,
-- volgen), nooit wie het zijn. Privacy: onder de 10 betrokken kijkers komt er
-- helemaal geen verdeling terug, en elke groep kleiner dan 5 gaat in "Overig".
-- Eén transactie; veilig om opnieuw te draaien.
begin;

-- Intern: de betrokken kijkers van één bedrijf, alleen leeftijd en geslacht.
-- Niet aanroepbaar door gebruikers; alleen get_audience_summary() gebruikt hem.
create or replace function public.audience_people(p_business uuid)
returns table (gender text, age int)
language sql stable security definer set search_path = public as $$
  select nullif(trim(c.gender), ''),
         case when c.birthdate is null then null else extract(year from age(current_date, c.birthdate))::int end
  from consumers c
  where c.id in (
    select te.consumer_id from token_events te
    where te.company_id = p_business
      and te.action in ('watch80', 'like', 'save', 'click', 'share', 'follow')
  );
$$;
revoke execute on function public.audience_people(uuid) from public, anon, authenticated;

create or replace function public.get_audience_summary()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  c_min_total constant int := 10;
  c_min_group constant int := 5;
  v_biz uuid;
  v_total int;
  v_age jsonb;
  v_gender jsonb;
begin
  select id into v_biz from businesses where auth_user_id = auth.uid();
  if v_biz is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_business');
  end if;

  select count(*) into v_total from public.audience_people(v_biz);
  if v_total < c_min_total then
    return jsonb_build_object('ok', true, 'engaged', v_total, 'minimum', c_min_total, 'enough', false);
  end if;

  -- Leeftijd in groepen; groepen onder de ondergrens worden samengevoegd.
  with b as (
    select case
             when age < 18 then '16-17'
             when age < 25 then '18-24'
             when age < 35 then '25-34'
             when age < 45 then '35-44'
             else '45+'
           end as label,
           count(*) as n
    from public.audience_people(v_biz) where age is not null group by 1
  ), shown as (
    select label, n from b where n >= c_min_group
  ), rest as (
    select coalesce(sum(n), 0) as n from b where n < c_min_group
  )
  select coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by label) from shown), '[]'::jsonb)
         || case when (select n from rest) >= c_min_group then jsonb_build_array(jsonb_build_object('label', 'Overig', 'count', (select n from rest))) else '[]'::jsonb end
  into v_age;

  with g as (
    select gender as label, count(*) as n from public.audience_people(v_biz) where gender is not null group by 1
  ), shown as (
    select label, n from g where n >= c_min_group
  ), rest as (
    select coalesce(sum(n), 0) as n from g where n < c_min_group
  )
  select coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc) from shown), '[]'::jsonb)
         || case when (select n from rest) >= c_min_group then jsonb_build_array(jsonb_build_object('label', 'Overig', 'count', (select n from rest))) else '[]'::jsonb end
  into v_gender;

  return jsonb_build_object('ok', true, 'engaged', v_total, 'minimum', c_min_total, 'enough', true, 'age', v_age, 'gender', v_gender);
end;
$$;

revoke execute on function public.get_audience_summary() from public, anon;
grant execute on function public.get_audience_summary() to authenticated;

commit;

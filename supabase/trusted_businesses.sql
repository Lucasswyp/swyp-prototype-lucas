-- Vertrouwde bedrijven: video's van een bedrijf in trusted_businesses worden meteen goedgekeurd,
-- alle andere bedrijven blijven eerst gecontroleerd worden (App Store-richtlijn 1.2: advertenties
-- worden vooraf gemodereerd). De lijst staat in een eigen tabel zonder policies: een bedrijf kan
-- zichzelf er dus niet in zetten; alleen jij via de SQL Editor.
--
-- Meer bedrijven vertrouwen:   insert into trusted_businesses (business_id) select id from businesses where name = '...';
-- Weer laten controleren:      delete from trusted_businesses where business_id = '...';
-- Draai na schema.sql. Eén transactie; herhaalbaar.
begin;

create table if not exists trusted_businesses (
  business_id uuid primary key references businesses(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table trusted_businesses enable row level security;

create or replace function public.auto_approve_trusted_ads()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from trusted_businesses t where t.business_id = new.business_id) then
    new.moderation_status := 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists ads_auto_approve on ads;
create trigger ads_auto_approve
  before insert on ads
  for each row execute function public.auto_approve_trusted_ads();

insert into trusted_businesses (business_id)
select id from businesses where name = 'Lucas Bedrijf'
on conflict do nothing;

-- Wat al wachtte bij een vertrouwd bedrijf, nu goedkeuren.
update ads set moderation_status = 'approved'
where moderation_status = 'pending'
  and business_id in (select business_id from trusted_businesses);

commit;

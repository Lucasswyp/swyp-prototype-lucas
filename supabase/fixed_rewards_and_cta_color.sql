-- Twee dingen:
--  1. Kleur van de knop onder een video (ads.cta_color, bijvoorbeeld '#7B3DFF'). Leeg betekent wit.
--  2. Vaste beloningen voor iedereen: kijken (80%), liken, bewaren en doorklikken leveren bij elke
--     campagne hetzelfde op en bedrijven kunnen dat niet meer zelf instellen. Een trigger dwingt de
--     waarden af, ook als iemand de database rechtstreeks aanspreekt. Bestaande campagnes worden gelijkgetrokken.
-- Draai na rewards.sql. Eén transactie; herhaalbaar.
begin;

alter table ads add column if not exists cta_color text;
alter table ads drop constraint if exists ads_cta_color_check;
alter table ads add constraint ads_cta_color_check check (cta_color is null or cta_color ~ '^#[0-9A-Fa-f]{6}$');

create or replace function public.force_fixed_campaign_rewards()
returns trigger
language plpgsql as $$
begin
  new.reward_watch := 15;
  new.reward_like := 4;
  new.reward_save := 8;
  new.reward_click := 10;
  return new;
end;
$$;

drop trigger if exists campaigns_fixed_rewards on campaigns;
create trigger campaigns_fixed_rewards
  before insert or update on campaigns
  for each row execute function public.force_fixed_campaign_rewards();

-- Bestaande campagnes naar de vaste waarden (de trigger doet het werk).
update campaigns set reward_watch = 15
where reward_watch is distinct from 15 or reward_like is distinct from 4
   or reward_save is distinct from 8 or reward_click is distinct from 10;

commit;

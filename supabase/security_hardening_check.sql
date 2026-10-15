-- Read-only checks to run BEFORE and AFTER security_hardening.sql.

-- Rewards that would let someone mint tokens (must be empty).
select id, business_id, title, token_cost from rewards where token_cost <= 0;

-- Current policies on the tables the migration touches.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('ads', 'businesses', 'consumers', 'interactions', 'redemptions', 'rewards', 'campaigns')
order by tablename, policyname;

-- Column privileges on consumers for the API roles.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'consumers'
  and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE'
order by grantee, column_name;

-- Triggers in place.
select event_object_table, trigger_name from information_schema.triggers
where trigger_schema = 'public' and trigger_name in ('ads_guard_trg', 'businesses_guard_trg', 'consumers_guard_trg');

-- Existing unusual balances (a very large wallet may mean the redeem bug was already used).
select consumer_id, balance from consumer_wallets order by balance desc limit 10;

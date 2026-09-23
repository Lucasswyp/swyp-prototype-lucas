-- handle_new_consumer() only ever checked raw_app_meta_data->>'provider' =
-- 'google' to decide whether a signup needs the synthetic-username / avatar
-- fallback + forced complete-profile step. Apple sign-in (via
-- signInWithIdToken, see src/lib/appleAuth.ts) lands here with the same
-- shape of metadata as Google — an email and nothing else useful for a
-- username, no chosen `username` key in raw_user_meta_data — so without this
-- fix it would fall into the email-signup branch, try to read a
-- `raw_user_meta_data->>'username'` that was never set, and insert a
-- consumer row with a null username.
create or replace function public.handle_new_consumer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer_id uuid;
  v_is_email_signup boolean := new.raw_user_meta_data ? 'username';
  v_is_social_signup boolean := new.raw_app_meta_data->>'provider' in ('google', 'apple');
  v_name text;
  v_username_base text;
  v_username text;
  v_avatar_url text;
  v_referral_code text;
begin
  if not (v_is_email_signup or v_is_social_signup) then
    return new;
  end if;

  if v_is_email_signup then
    v_name := new.raw_user_meta_data->>'name';
    v_username_base := new.raw_user_meta_data->>'username';
    v_username := v_username_base;
  else
    v_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    v_avatar_url := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
    v_username_base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    if length(v_username_base) < 3 then
      v_username_base := v_username_base || '_user';
    end if;
    v_username_base := left(v_username_base, 14);
    v_username := v_username_base || '_' || left(replace(new.id::text, '-', ''), 5);
  end if;

  v_referral_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 7));

  begin
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity, avatar_url, profile_completed, referral_code)
    values (
      new.id, v_name, v_username,
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity',
      v_avatar_url,
      not v_is_social_signup,
      v_referral_code
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;
  exception when unique_violation then
    v_username := v_username_base || '_' || left(replace(gen_random_uuid()::text, '-', ''), 5);
    v_referral_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 7));
    insert into public.consumers (auth_user_id, name, username, gender, birthdate, ethnicity, avatar_url, profile_completed, referral_code)
    values (
      new.id, v_name, v_username,
      new.raw_user_meta_data->>'gender',
      nullif(new.raw_user_meta_data->>'birthdate', '')::date,
      new.raw_user_meta_data->>'ethnicity',
      v_avatar_url,
      not v_is_social_signup,
      v_referral_code
    )
    on conflict (auth_user_id) do nothing
    returning id into v_consumer_id;
  end;

  if v_consumer_id is not null then
    insert into public.consumer_wallets (consumer_id, balance) values (v_consumer_id, 20);
    insert into public.token_events (consumer_id, action, points) values (v_consumer_id, 'welcome_bonus', 20);
  end if;

  return new;
end;
$$;

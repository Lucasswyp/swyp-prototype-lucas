-- Etniciteit wordt niet meer gevraagd (AVG artikel 9). Wis wat er al staat;
-- de kolom blijft voorlopig bestaan zodat de aanmeldtriggers blijven werken.
update consumers set ethnicity = null where ethnicity is not null;
update auth.users set raw_user_meta_data = raw_user_meta_data - 'ethnicity'
where raw_user_meta_data ? 'ethnicity';

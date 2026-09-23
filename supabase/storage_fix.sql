-- The original ad-videos storage policies (supabase/schema.sql) only checked
-- `auth.role() = 'authenticated'` for insert/update/delete — any logged-in
-- user, consumer or business, could write or overwrite ANY object in the
-- bucket, not just their own. Upload path convention is
-- {businessId}/{uuid}.{ext} (src/lib/data.ts uploadAdVideo), so scope the
-- policy to the business that owns that folder.

drop policy if exists "business upload ad-videos" on storage.objects;
create policy "business upload ad-videos" on storage.objects for insert
  with check (
    bucket_id = 'ad-videos'
    and (storage.foldername(name))[1]::uuid in (
      select id from businesses where auth_user_id = auth.uid()
    )
  );

drop policy if exists "business update ad-videos" on storage.objects;
create policy "business update ad-videos" on storage.objects for update
  using (
    bucket_id = 'ad-videos'
    and (storage.foldername(name))[1]::uuid in (
      select id from businesses where auth_user_id = auth.uid()
    )
  );

drop policy if exists "business delete ad-videos" on storage.objects;
create policy "business delete ad-videos" on storage.objects for delete
  using (
    bucket_id = 'ad-videos'
    and (storage.foldername(name))[1]::uuid in (
      select id from businesses where auth_user_id = auth.uid()
    )
  );

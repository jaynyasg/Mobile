-- Profile bio, link, and avatar bucket for community chat.
-- Apply in the Supabase SQL editor for project oykwxnzlpxbrfcoejawt after supabase/community.sql.
-- Idempotent. Does not drop tables. Review before running.

alter table public.community_profiles add column if not exists bio text;
alter table public.community_profiles add column if not exists link text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'community_profiles_bio_len') then
    alter table public.community_profiles
      add constraint community_profiles_bio_len check (bio is null or char_length(bio) <= 280);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'community_profiles_link_len') then
    alter table public.community_profiles
      add constraint community_profiles_link_len check (link is null or char_length(link) <= 200);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists community_media_read on storage.objects;
create policy community_media_read on storage.objects
for select to public
using (bucket_id = 'community-media');

drop policy if exists community_media_insert on storage.objects;
create policy community_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'community-media'
  and public.community_can_participate(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists community_media_update on storage.objects;
create policy community_media_update on storage.objects
for update to authenticated
using (
  bucket_id = 'community-media'
  and public.community_can_participate(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'community-media'
  and public.community_can_participate(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists community_media_delete on storage.objects;
create policy community_media_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'community-media'
  and public.community_can_participate(auth.uid())
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.community_is_staff(auth.uid())
  )
);

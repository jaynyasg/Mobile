-- TATEL community: posts, comments, likes, one group chat, profiles, reports.
-- Idempotent. Creates only community_* objects, storage policies for community-media,
-- and a trigger on auth.users. Does not alter or drop existing public tables.
--
-- Apply in the Supabase SQL editor for project oykwxnzlpxbrfcoejawt, as one script.

-- Participation gate. Every community policy calls this.
-- Today: any signed-in user. Later: replace the body with the ticket check below.
create or replace function public.community_can_participate(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select uid is not null
    and exists (select 1 from auth.users where id = uid);
  -- Ticket holders later (one-function change). Example only, not active:
  -- select uid is not null
  --   and exists (
  --     select 1
  --     from public.rsvp_requests as request
  --     join auth.users as account on account.id = uid
  --     where request.email is not null
  --       and lower(request.email) = lower(account.email)
  --   );
$$;

create or replace function public.community_is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(uid, 'admin') or public.has_role(uid, 'moderator');
$$;

revoke all on function public.community_can_participate(uuid) from public;
revoke all on function public.community_is_staff(uuid) from public;
grant execute on function public.community_can_participate(uuid) to authenticated;
grant execute on function public.community_is_staff(uuid) to authenticated;

create table if not exists public.community_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  title text check (title is null or char_length(title) <= 80),
  company text check (company is null or char_length(company) <= 80),
  bio text check (bio is null or char_length(bio) <= 280),
  link text check (link is null or char_length(link) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null default 'general' check (kind in ('general', 'island', 'session')),
  scope_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.community_profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  photo_url text,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.community_profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.community_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.community_rooms (id) on delete cascade,
  author_id uuid not null references public.community_profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.community_profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);
create index if not exists community_likes_post_idx on public.community_likes (post_id);
create index if not exists community_messages_room_idx on public.community_messages (room_id, created_at desc);
create index if not exists community_reports_target_idx on public.community_reports (target_type, target_id);
create index if not exists community_rooms_kind_idx on public.community_rooms (kind, scope_id);

alter table public.community_likes replica identity full;

create or replace function public.community_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_profiles_updated on public.community_profiles;
create trigger community_profiles_updated
before update on public.community_profiles
for each row execute function public.community_set_updated_at();

create or replace function public.community_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  if public.community_is_staff(auth.uid()) then
    return new;
  end if;
  if tg_table_name = 'community_posts' then
    select count(*) into recent from public.community_posts
      where author_id = new.author_id and created_at > now() - interval '1 minute';
  elsif tg_table_name = 'community_comments' then
    select count(*) into recent from public.community_comments
      where author_id = new.author_id and created_at > now() - interval '1 minute';
  elsif tg_table_name = 'community_messages' then
    select count(*) into recent from public.community_messages
      where author_id = new.author_id and created_at > now() - interval '1 minute';
  else
    return new;
  end if;
  if recent >= 8 then
    raise exception 'community rate limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists community_posts_rate on public.community_posts;
create trigger community_posts_rate before insert on public.community_posts
for each row execute function public.community_rate_limit();

drop trigger if exists community_comments_rate on public.community_comments;
create trigger community_comments_rate before insert on public.community_comments
for each row execute function public.community_rate_limit();

drop trigger if exists community_messages_rate on public.community_messages;
create trigger community_messages_rate before insert on public.community_messages
for each row execute function public.community_rate_limit();

create or replace function public.community_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_profiles (id, display_name)
  values (new.id, left(split_part(coalesce(new.email, 'guest'), '@', 1), 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists community_on_auth_user_created on auth.users;
create trigger community_on_auth_user_created
after insert on auth.users
for each row execute function public.community_handle_new_user();

insert into public.community_rooms (slug, name, kind)
values ('general', 'Everyone', 'general')
on conflict (slug) do nothing;

alter table public.community_profiles enable row level security;
alter table public.community_rooms enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_reports enable row level security;

grant select, insert, update, delete on public.community_profiles to authenticated;
grant select on public.community_rooms to authenticated;
grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, update, delete on public.community_comments to authenticated;
grant select, insert, delete on public.community_likes to authenticated;
grant select, insert, update, delete on public.community_messages to authenticated;
grant select, insert on public.community_reports to authenticated;

drop policy if exists community_profiles_select on public.community_profiles;
create policy community_profiles_select on public.community_profiles
for select to authenticated
using (public.community_can_participate(auth.uid()));

drop policy if exists community_profiles_insert on public.community_profiles;
create policy community_profiles_insert on public.community_profiles
for insert to authenticated
with check (id = auth.uid() and public.community_can_participate(auth.uid()));

drop policy if exists community_profiles_update on public.community_profiles;
create policy community_profiles_update on public.community_profiles
for update to authenticated
using (id = auth.uid() and public.community_can_participate(auth.uid()))
with check (id = auth.uid() and public.community_can_participate(auth.uid()));

drop policy if exists community_rooms_select on public.community_rooms;
create policy community_rooms_select on public.community_rooms
for select to authenticated
using (public.community_can_participate(auth.uid()));

drop policy if exists community_rooms_insert on public.community_rooms;
create policy community_rooms_insert on public.community_rooms
for insert to authenticated
with check (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()));

drop policy if exists community_posts_select on public.community_posts;
create policy community_posts_select on public.community_posts
for select to authenticated
using (
  public.community_can_participate(auth.uid())
  and (hidden = false or author_id = auth.uid() or public.community_is_staff(auth.uid()))
);

drop policy if exists community_posts_insert on public.community_posts;
create policy community_posts_insert on public.community_posts
for insert to authenticated
with check (author_id = auth.uid() and public.community_can_participate(auth.uid()));

drop policy if exists community_posts_update on public.community_posts;
create policy community_posts_update on public.community_posts
for update to authenticated
using (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()))
with check (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()));

drop policy if exists community_posts_delete on public.community_posts;
create policy community_posts_delete on public.community_posts
for delete to authenticated
using (public.community_can_participate(auth.uid()) and (author_id = auth.uid() or public.community_is_staff(auth.uid())));

drop policy if exists community_comments_select on public.community_comments;
create policy community_comments_select on public.community_comments
for select to authenticated
using (
  public.community_can_participate(auth.uid())
  and (hidden = false or author_id = auth.uid() or public.community_is_staff(auth.uid()))
);

drop policy if exists community_comments_insert on public.community_comments;
create policy community_comments_insert on public.community_comments
for insert to authenticated
with check (author_id = auth.uid() and public.community_can_participate(auth.uid()));

drop policy if exists community_comments_update on public.community_comments;
create policy community_comments_update on public.community_comments
for update to authenticated
using (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()))
with check (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()));

drop policy if exists community_comments_delete on public.community_comments;
create policy community_comments_delete on public.community_comments
for delete to authenticated
using (public.community_can_participate(auth.uid()) and (author_id = auth.uid() or public.community_is_staff(auth.uid())));

drop policy if exists community_likes_select on public.community_likes;
create policy community_likes_select on public.community_likes
for select to authenticated
using (public.community_can_participate(auth.uid()));

drop policy if exists community_likes_insert on public.community_likes;
create policy community_likes_insert on public.community_likes
for insert to authenticated
with check (user_id = auth.uid() and public.community_can_participate(auth.uid()));

drop policy if exists community_likes_delete on public.community_likes;
create policy community_likes_delete on public.community_likes
for delete to authenticated
using (public.community_can_participate(auth.uid()) and (user_id = auth.uid() or public.community_is_staff(auth.uid())));

drop policy if exists community_messages_select on public.community_messages;
create policy community_messages_select on public.community_messages
for select to authenticated
using (
  public.community_can_participate(auth.uid())
  and (hidden = false or author_id = auth.uid() or public.community_is_staff(auth.uid()))
);

drop policy if exists community_messages_insert on public.community_messages;
create policy community_messages_insert on public.community_messages
for insert to authenticated
with check (author_id = auth.uid() and public.community_can_participate(auth.uid()));

drop policy if exists community_messages_update on public.community_messages;
create policy community_messages_update on public.community_messages
for update to authenticated
using (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()))
with check (public.community_is_staff(auth.uid()) and public.community_can_participate(auth.uid()));

drop policy if exists community_messages_delete on public.community_messages;
create policy community_messages_delete on public.community_messages
for delete to authenticated
using (public.community_can_participate(auth.uid()) and (author_id = auth.uid() or public.community_is_staff(auth.uid())));

drop policy if exists community_reports_select on public.community_reports;
create policy community_reports_select on public.community_reports
for select to authenticated
using (
  public.community_can_participate(auth.uid())
  and (reporter_id = auth.uid() or public.community_is_staff(auth.uid()))
);

drop policy if exists community_reports_insert on public.community_reports;
create policy community_reports_insert on public.community_reports
for insert to authenticated
with check (reporter_id = auth.uid() and public.community_can_participate(auth.uid()));

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

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_posts'
  ) then
    alter publication supabase_realtime add table public.community_posts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_comments'
  ) then
    alter publication supabase_realtime add table public.community_comments;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_likes'
  ) then
    alter publication supabase_realtime add table public.community_likes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end $$;

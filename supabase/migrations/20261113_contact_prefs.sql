-- Notification choices. Each person edits only their own row. Admins can read every row.
-- Apply in the Supabase SQL editor after review. The app does not run this file.
-- Phone stays empty until a later sign-in change collects it.

create table if not exists public.contact_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  alerts_opt_in boolean not null default false,
  marketing_opt_in boolean not null default false,
  phone text null,
  updated_at timestamptz not null default now()
);

alter table public.contact_prefs enable row level security;

drop policy if exists contact_prefs_select on public.contact_prefs;
create policy contact_prefs_select on public.contact_prefs
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists contact_prefs_insert on public.contact_prefs;
create policy contact_prefs_insert on public.contact_prefs
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists contact_prefs_update on public.contact_prefs;
create policy contact_prefs_update on public.contact_prefs
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.contact_prefs to authenticated;

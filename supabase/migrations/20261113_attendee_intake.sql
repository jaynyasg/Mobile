-- Question answers from Your path. Organizers can read them; each person edits only their own row.
-- Apply in the Supabase SQL editor after review. The app does not run this file.

create table if not exists public.attendee_intake (
  user_id uuid primary key references auth.users (id) on delete cascade,
  has_pass text not null check (has_pass in ('have', 'not-yet', 'unsure')),
  areas text[] not null default '{}',
  needs_stay text not null check (needs_stay in ('yes', 'booked', 'browsing')),
  updated_at timestamptz not null default now()
);

alter table public.attendee_intake enable row level security;

drop policy if exists attendee_intake_select on public.attendee_intake;
create policy attendee_intake_select on public.attendee_intake
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists attendee_intake_insert on public.attendee_intake;
create policy attendee_intake_insert on public.attendee_intake
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists attendee_intake_update on public.attendee_intake;
create policy attendee_intake_update on public.attendee_intake
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

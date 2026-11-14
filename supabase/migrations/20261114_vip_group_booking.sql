-- VIP group bookings. Do not apply this from the app repo. Review it, then apply it in Supabase.
-- Clients cannot read or write these tables. The tatel-vip-booking edge function uses the service role.

create table public.vip_group_bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_email text,
  host_user_id uuid,
  host_name text,
  host_phone text,
  boat_preference text not null check (boat_preference in ('full_boat', 'shared')),
  created_at timestamptz not null default now(),
  deadline timestamptz not null,
  status text not null default 'open' check (status in ('open', 'filled', 'expired')),
  notified_3d boolean not null default false,
  notified_deadline boolean not null default false
);

create table public.vip_group_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.vip_group_bookings (id) on delete cascade,
  stripe_session_id text not null unique,
  quantity integer not null check (quantity between 1 and 8),
  status text not null check (status in ('reserved', 'paid', 'released')),
  payer_email text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  paid_at timestamptz
);

create index vip_group_payments_booking_idx on public.vip_group_payments (booking_id);

alter table public.vip_group_bookings enable row level security;
alter table public.vip_group_payments enable row level security;

revoke all on public.vip_group_bookings from public, anon, authenticated;
revoke all on public.vip_group_payments from public, anon, authenticated;

create or replace function public.vip_release_expired(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.vip_group_payments
  set status = 'released'
  where booking_id = target
    and status = 'reserved'
    and expires_at is not null
    and expires_at <= now();
$$;

create or replace function public.vip_refresh_status(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  paid integer;
  ends timestamptz;
begin
  select coalesce(sum(quantity), 0) into paid
  from public.vip_group_payments
  where booking_id = target and status = 'paid';
  select deadline into ends from public.vip_group_bookings where id = target;
  if paid >= 8 then
    update public.vip_group_bookings set status = 'filled' where id = target;
  elsif ends <= now() then
    update public.vip_group_bookings set status = 'expired' where id = target and status <> 'filled';
  end if;
end;
$$;

create or replace function public.vip_booking_snapshot(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.vip_group_bookings%rowtype;
  paid integer;
  held integer;
  payers jsonb;
begin
  perform public.vip_release_expired(target);
  perform public.vip_refresh_status(target);
  select * into booking from public.vip_group_bookings where id = target;
  select coalesce(sum(quantity), 0) into paid
  from public.vip_group_payments
  where booking_id = target and status = 'paid';
  select coalesce(sum(quantity), 0) into held
  from public.vip_group_payments
  where booking_id = target and status = 'reserved' and expires_at > now();
  select coalesce(jsonb_agg(jsonb_build_object('email', payer_email, 'quantity', quantity) order by paid_at), '[]'::jsonb)
  into payers
  from public.vip_group_payments
  where booking_id = target and status = 'paid';
  return jsonb_build_object(
    'id', booking.id,
    'code', booking.code,
    'boatPreference', booking.boat_preference,
    'status', booking.status,
    'paidShares', paid,
    'reservedShares', held,
    'remaining', greatest(0, 8 - paid - held),
    'deadline', booking.deadline,
    'createdAt', booking.created_at,
    'hostName', booking.host_name,
    'hostEmail', booking.host_email,
    'hostPhone', booking.host_phone,
    'payers', payers
  );
end;
$$;

create or replace function public.vip_booking_rpc(action text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.vip_group_bookings%rowtype;
  payment public.vip_group_payments%rowtype;
  host_id uuid;
  paid integer;
  held integer;
  qty integer;
  was_filled boolean;
begin
  if action = 'create' then
    if payload->>'boatPreference' not in ('full_boat', 'shared') then
      return jsonb_build_object('error', 'preference');
    end if;
    if coalesce(payload->>'code', '') !~ '^[a-z0-9]{8,12}$' then
      return jsonb_build_object('error', 'code');
    end if;
    begin
      host_id := nullif(payload->>'hostUserId', '')::uuid;
    exception when invalid_text_representation then
      host_id := null;
    end;
    insert into public.vip_group_bookings (
      code, host_email, host_user_id, host_name, host_phone, boat_preference, deadline
    ) values (
      payload->>'code',
      nullif(payload->>'hostEmail', ''),
      host_id,
      nullif(payload->>'hostName', ''),
      nullif(payload->>'hostPhone', ''),
      payload->>'boatPreference',
      now() + interval '14 days'
    )
    returning * into booking;
    return public.vip_booking_snapshot(booking.id);
  end if;

  if action = 'get' then
    select * into booking from public.vip_group_bookings where code = payload->>'code';
    if not found then return jsonb_build_object('error', 'missing'); end if;
    return public.vip_booking_snapshot(booking.id);
  end if;

  if action = 'reserve' then
    begin
      qty := (payload->>'quantity')::integer;
    exception when others then
      return jsonb_build_object('error', 'quantity');
    end;
    if qty < 1 or qty > 8 then return jsonb_build_object('error', 'quantity'); end if;
    select * into booking from public.vip_group_bookings where code = payload->>'code' for update;
    if not found then return jsonb_build_object('error', 'missing'); end if;
    if coalesce(payload->>'sessionId', '') = '' then return jsonb_build_object('error', 'session'); end if;
    perform public.vip_release_expired(booking.id);
    select coalesce(sum(quantity), 0) into paid from public.vip_group_payments where booking_id = booking.id and status = 'paid';
    select coalesce(sum(quantity), 0) into held
    from public.vip_group_payments
    where booking_id = booking.id and status = 'reserved' and expires_at > now();
    if paid >= 8 or booking.deadline <= now() then
      perform public.vip_refresh_status(booking.id);
      return jsonb_build_object('error', 'closed');
    end if;
    if paid + held + qty > 8 then return jsonb_build_object('error', 'full'); end if;
    insert into public.vip_group_payments (booking_id, stripe_session_id, quantity, status, payer_email, expires_at)
    values (
      booking.id,
      payload->>'sessionId',
      qty,
      'reserved',
      nullif(payload->>'payerEmail', ''),
      coalesce((payload->>'expiresAt')::timestamptz, now() + interval '30 minutes')
    );
    return public.vip_booking_snapshot(booking.id);
  end if;

  if action = 'release' then
    update public.vip_group_payments
    set status = 'released'
    where stripe_session_id = payload->>'sessionId' and status = 'reserved';
    return jsonb_build_object('ok', true);
  end if;

  if action = 'record' then
    select * into payment from public.vip_group_payments where stripe_session_id = payload->>'sessionId' for update;
    if found and payment.status = 'paid' then
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object('applied', false, 'justFilled', false);
    end if;
    if found and payment.status = 'reserved' then
      select status = 'filled' into was_filled from public.vip_group_bookings where id = payment.booking_id;
      update public.vip_group_payments
      set status = 'paid', paid_at = now(), payer_email = coalesce(nullif(payload->>'payerEmail', ''), payer_email)
      where id = payment.id;
      perform public.vip_refresh_status(payment.booking_id);
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object(
        'applied', true,
        'justFilled', (select status = 'filled' and not coalesce(was_filled, false) from public.vip_group_bookings where id = payment.booking_id)
      );
    end if;
    if found and payment.status = 'released' then
      begin
        qty := (payload->>'quantity')::integer;
      exception when others then
        return jsonb_build_object('error', 'quantity');
      end;
      perform public.vip_release_expired(payment.booking_id);
      select coalesce(sum(quantity), 0) into paid
      from public.vip_group_payments
      where booking_id = payment.booking_id and status = 'paid';
      select coalesce(sum(quantity), 0) into held
      from public.vip_group_payments
      where booking_id = payment.booking_id and status = 'reserved' and expires_at > now();
      if qty < 1 or qty > 8 or paid + held + qty > 8 then return jsonb_build_object('error', 'full'); end if;
      select status = 'filled' into was_filled from public.vip_group_bookings where id = payment.booking_id;
      update public.vip_group_payments
      set status = 'paid', quantity = qty, paid_at = now(), payer_email = coalesce(nullif(payload->>'payerEmail', ''), payer_email)
      where id = payment.id;
      perform public.vip_refresh_status(payment.booking_id);
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object(
        'applied', true,
        'justFilled', (select status = 'filled' and not coalesce(was_filled, false) from public.vip_group_bookings where id = payment.booking_id)
      );
    end if;
    begin
      qty := (payload->>'quantity')::integer;
    exception when others then
      return jsonb_build_object('error', 'quantity');
    end;
    select * into booking from public.vip_group_bookings where id = nullif(payload->>'bookingId', '')::uuid for update;
    if not found then return jsonb_build_object('error', 'missing'); end if;
    perform public.vip_release_expired(booking.id);
    select coalesce(sum(quantity), 0) into paid from public.vip_group_payments where booking_id = booking.id and status = 'paid';
    select coalesce(sum(quantity), 0) into held
    from public.vip_group_payments
    where booking_id = booking.id and status = 'reserved' and expires_at > now();
    if qty < 1 or qty > 8 or paid + held + qty > 8 then return jsonb_build_object('error', 'full'); end if;
    insert into public.vip_group_payments (booking_id, stripe_session_id, quantity, status, payer_email, paid_at)
    values (booking.id, payload->>'sessionId', qty, 'paid', nullif(payload->>'payerEmail', ''), now());
    was_filled := booking.status = 'filled';
    perform public.vip_refresh_status(booking.id);
    return public.vip_booking_snapshot(booking.id) || jsonb_build_object(
      'applied', true,
      'justFilled', (select status = 'filled' and not was_filled from public.vip_group_bookings where id = booking.id)
    );
  end if;

  if action = 'due' then
    return coalesce((
      select jsonb_agg(public.vip_booking_snapshot(id) || jsonb_build_object('kind', kind))
      from (
        select id,
          case
            when deadline <= now() and not notified_deadline then 'deadline'
            when deadline - interval '3 days' <= now() and deadline > now() and not notified_3d then 'three_days'
            else null
          end as kind
        from public.vip_group_bookings
        where status <> 'filled'
      ) waiting
      where kind is not null
    ), '[]'::jsonb);
  end if;

  if action = 'mark' then
    if payload->>'kind' = 'three_days' then
      update public.vip_group_bookings set notified_3d = true where code = payload->>'code';
    elsif payload->>'kind' = 'deadline' then
      update public.vip_group_bookings set notified_deadline = true where code = payload->>'code';
    else
      return jsonb_build_object('error', 'kind');
    end if;
    return jsonb_build_object('ok', true);
  end if;

  return jsonb_build_object('error', 'action');
end;
$$;

revoke all on function public.vip_release_expired(uuid) from public, anon, authenticated;
revoke all on function public.vip_refresh_status(uuid) from public, anon, authenticated;
revoke all on function public.vip_booking_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.vip_booking_rpc(text, jsonb) from public, anon, authenticated;
grant execute on function public.vip_booking_rpc(text, jsonb) to service_role;

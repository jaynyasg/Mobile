-- Additive follow-up. 20261114_vip_group_booking.sql is already applied.
-- A collected payment that no longer fits is stored as needs_refund instead of being rejected.
-- The share hold defaults to 40 minutes so it outlives a 30-minute Checkout Session.

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'vip_group_payments'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%';
  if constraint_name is not null then
    execute format('alter table public.vip_group_payments drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.vip_group_payments
  add constraint vip_group_payments_status_check
  check (status in ('reserved', 'paid', 'released', 'needs_refund'));

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
      coalesce((payload->>'expiresAt')::timestamptz, now() + interval '40 minutes')
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
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object('applied', false, 'justFilled', false, 'needsRefund', false);
    end if;
    if found and payment.status = 'needs_refund' then
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object('applied', false, 'justFilled', false, 'needsRefund', false);
    end if;
    if found and payment.status = 'reserved' then
      select status = 'filled' into was_filled from public.vip_group_bookings where id = payment.booking_id;
      update public.vip_group_payments
      set status = 'paid', paid_at = now(), payer_email = coalesce(nullif(payload->>'payerEmail', ''), payer_email)
      where id = payment.id;
      perform public.vip_refresh_status(payment.booking_id);
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object(
        'applied', true,
        'justFilled', (select status = 'filled' and not coalesce(was_filled, false) from public.vip_group_bookings where id = payment.booking_id),
        'needsRefund', false
      );
    end if;

    begin
      qty := (payload->>'quantity')::integer;
    exception when others then
      return jsonb_build_object('error', 'quantity');
    end;
    if qty < 1 or qty > 8 then return jsonb_build_object('error', 'quantity'); end if;

    if found then
      perform public.vip_release_expired(payment.booking_id);
      select coalesce(sum(quantity), 0) into paid
      from public.vip_group_payments
      where booking_id = payment.booking_id and status = 'paid';
      select coalesce(sum(quantity), 0) into held
      from public.vip_group_payments
      where booking_id = payment.booking_id and status = 'reserved' and expires_at > now();
      if paid + held + qty > 8 then
        update public.vip_group_payments
        set status = 'needs_refund', quantity = qty, paid_at = now(), payer_email = coalesce(nullif(payload->>'payerEmail', ''), payer_email)
        where id = payment.id;
        return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object('applied', false, 'justFilled', false, 'needsRefund', true);
      end if;
      select status = 'filled' into was_filled from public.vip_group_bookings where id = payment.booking_id;
      update public.vip_group_payments
      set status = 'paid', quantity = qty, paid_at = now(), payer_email = coalesce(nullif(payload->>'payerEmail', ''), payer_email)
      where id = payment.id;
      perform public.vip_refresh_status(payment.booking_id);
      return public.vip_booking_snapshot(payment.booking_id) || jsonb_build_object(
        'applied', true,
        'justFilled', (select status = 'filled' and not coalesce(was_filled, false) from public.vip_group_bookings where id = payment.booking_id),
        'needsRefund', false
      );
    end if;

    select * into booking from public.vip_group_bookings where id = nullif(payload->>'bookingId', '')::uuid for update;
    if not found then return jsonb_build_object('error', 'missing'); end if;
    perform public.vip_release_expired(booking.id);
    select coalesce(sum(quantity), 0) into paid from public.vip_group_payments where booking_id = booking.id and status = 'paid';
    select coalesce(sum(quantity), 0) into held
    from public.vip_group_payments
    where booking_id = booking.id and status = 'reserved' and expires_at > now();
    if paid + held + qty > 8 then
      insert into public.vip_group_payments (booking_id, stripe_session_id, quantity, status, payer_email, paid_at)
      values (booking.id, payload->>'sessionId', qty, 'needs_refund', nullif(payload->>'payerEmail', ''), now());
      return public.vip_booking_snapshot(booking.id) || jsonb_build_object('applied', false, 'justFilled', false, 'needsRefund', true);
    end if;
    insert into public.vip_group_payments (booking_id, stripe_session_id, quantity, status, payer_email, paid_at)
    values (booking.id, payload->>'sessionId', qty, 'paid', nullif(payload->>'payerEmail', ''), now());
    was_filled := booking.status = 'filled';
    perform public.vip_refresh_status(booking.id);
    return public.vip_booking_snapshot(booking.id) || jsonb_build_object(
      'applied', true,
      'justFilled', (select status = 'filled' and not was_filled from public.vip_group_bookings where id = booking.id),
      'needsRefund', false
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

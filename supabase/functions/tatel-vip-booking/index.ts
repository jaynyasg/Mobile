import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders as sdkCorsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { invalidBookingField } from './validate.ts';

const headers = {
  ...sdkCorsHeaders,
  'Access-Control-Allow-Origin': 'https://tatel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
  Vary: 'Origin',
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const secret = Deno.env.get('VIP_BOOKING_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !supabaseUrl || !serviceKey) return reply(503, { error: 'unavailable' });
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return reply(401, { error: 'secret' });

  let body: { action?: unknown; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'invalid' });
  }
  if (typeof body.action !== 'string' || !body.payload || typeof body.payload !== 'object') {
    return reply(400, { error: 'invalid' });
  }
  const invalid = invalidBookingField(body.payload as Record<string, unknown>);
  if (invalid) return reply(400, { error: invalid });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc('vip_booking_rpc', { action: body.action, payload: body.payload });
  if (error) return reply(502, { error: 'unavailable' });
  const record = data as { error?: string } | null;
  if (record?.error === 'missing') return reply(404, record);
  if (record?.error) return reply(400, record);
  return reply(200, data);
});

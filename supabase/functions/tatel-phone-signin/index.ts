import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';
import { corsHeaders as sdkCorsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { decidePhoneAccount, samePhone, type PhoneIdentity } from './account.ts';
import { fetchSecureTokenCerts, verifyFirebaseIdToken } from './token.ts';

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

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function identityOf(user: User): PhoneIdentity {
  return { id: user.id, email: user.email ?? null, phone: user.phone ?? null };
}

async function listUsers(client: SupabaseClient): Promise<User[] | null> {
  const users: User[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
  return users;
}

/** Same session mint as tatel-quick-signin: admin magic link, then verify the token hash. */
async function mintSession(client: SupabaseClient, email: string) {
  const { data: link, error: linkError } = await client.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) return null;
  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  if (error || !data.session) return null;
  return data.session;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'invalid' });
  }
  const record = body && typeof body === 'object' ? body as { idToken?: unknown; email?: unknown } : {};
  const email = normalizeEmail(record.email);
  const idToken = typeof record.idToken === 'string' ? record.idToken.trim() : '';
  if (!email || !idToken) return reply(400, { error: 'invalid' });

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return reply(502, { error: 'unavailable' });

  let claims;
  try {
    const certs = await fetchSecureTokenCerts(fetch);
    claims = await verifyFirebaseIdToken(idToken, { now: Date.now(), certs });
  } catch {
    return reply(401, { error: 'token' });
  }
  if (!claims) return reply(401, { error: 'token' });

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const users = await listUsers(client);
    if (!users) return reply(502, { error: 'unavailable' });
    const authPhone = users.find((user) => samePhone(user.phone, claims.phone)) ?? null;
    const emailAccount = users.find((user) => user.email?.toLowerCase() === email) ?? null;
    const prefs = await client.from('contact_prefs').select('user_id').eq('phone', claims.phone);
    const prefRows = prefs.error ? [] : prefs.data ?? [];
    if (prefRows.length > 1) return reply(403, { error: 'mismatch' });
    const prefId = prefRows[0]?.user_id as string | undefined;
    const prefUser = prefId ? users.find((user) => user.id === prefId) ?? null : null;
    if (prefId && !prefUser) {
      const { data, error } = await client.auth.admin.getUserById(prefId);
      if (error || !data.user) return reply(403, { error: 'mismatch' });
      users.push(data.user);
    }
    const contactUser = prefId ? users.find((user) => user.id === prefId) ?? null : null;
    const decision = decidePhoneAccount({
      verifiedPhone: claims.phone,
      enteredEmail: email,
      contact: contactUser ? identityOf(contactUser) : null,
      authPhone: authPhone ? identityOf(authPhone) : null,
      emailAccount: emailAccount ? identityOf(emailAccount) : null,
    });
    if (!decision.ok) return reply(403, { error: 'mismatch' });

    let userId = decision.mode === 'existing' ? decision.userId : '';
    if (decision.mode === 'create') {
      const { data, error } = await client.auth.admin.createUser({
        email: decision.sessionEmail,
        phone: decision.phone,
        phone_confirm: true,
        email_confirm: false,
      });
      const taken = error?.code === 'email_exists' || error?.code === 'user_already_exists' || error?.code === 'phone_exists';
      if (error || !data.user) return reply(taken ? 403 : 502, { error: taken ? 'mismatch' : 'unavailable' });
      userId = data.user.id;
    } else {
      const existing = users.find((user) => user.id === userId);
      if (existing && !samePhone(existing.phone, decision.phone)) {
        await client.auth.admin.updateUserById(userId, { phone: decision.phone, phone_confirm: true });
      }
      if (existing && !existing.email) {
        const { error } = await client.auth.admin.updateUserById(userId, { email: decision.sessionEmail });
        if (error) return reply(403, { error: 'mismatch' });
      }
    }

    const session = await mintSession(client, decision.sessionEmail);
    if (!session) return reply(502, { error: 'unavailable' });
    await client.from('contact_prefs').upsert(
      { user_id: userId, phone: decision.phone, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    return reply(200, {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user,
    });
  } catch {
    return reply(502, { error: 'unavailable' });
  }
});

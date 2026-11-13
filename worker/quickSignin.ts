export interface QuickSignInEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  QUICK_SIGNIN_EMAILS?: string;
}

export interface RateBook {
  hits: Map<string, number[]>;
}

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function emailAllowlist(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function allowQuickSignIn(email: string, raw: string | undefined): boolean {
  return emailAllowlist(raw).has(email);
}

export function consumeRate(book: RateBook, key: string, now: number): boolean {
  const recent = (book.hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= LIMIT) {
    book.hits.set(key, recent);
    return false;
  }
  recent.push(now);
  book.hits.set(key, recent);
  return true;
}

export function clientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface LinkResponse {
  properties?: { hashed_token?: string };
  hashed_token?: string;
  msg?: string;
  error_description?: string;
  message?: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface SessionResponse {
  access_token?: string;
  refresh_token?: string;
  msg?: string;
  error_description?: string;
  message?: string;
}

async function readJson(response: Response): Promise<LinkResponse & SessionResponse> {
  try {
    return (await response.json()) as LinkResponse & SessionResponse;
  } catch {
    return {};
  }
}

async function generateLink(env: QuickSignInEnv, email: string, fetchImpl: FetchLike): Promise<string> {
  const response = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  const body = await readJson(response);
  const token = body.properties?.hashed_token || body.hashed_token;
  if (!response.ok || !token) {
    const missing = /not found|user/i.test(`${body.msg ?? ""} ${body.message ?? ""} ${body.error_description ?? ""}`);
    if (response.status === 404 || response.status === 422 || missing) {
      const created = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, email_confirm: true }),
      });
      if (!created.ok && created.status !== 422) return "";
      const again = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "magiclink", email }),
      });
      const second = await readJson(again);
      return second.properties?.hashed_token || second.hashed_token || "";
    }
    return "";
  }
  return token;
}

export async function quickSignIn(request: Request, env: QuickSignInEnv, fetchImpl: FetchLike = fetch, book: RateBook = sharedBook, now = Date.now()): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "unavailable" }, 503);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "email" }, 400);
  }
  const email = normalizeEmail(payload && typeof payload === "object" ? (payload as { email?: unknown }).email : null);
  if (!email) return json({ error: "email" }, 400);
  if (!consumeRate(book, clientKey(request), now)) return json({ error: "rate" }, 429);
  if (!allowQuickSignIn(email, env.QUICK_SIGNIN_EMAILS)) return json({ error: "code" }, 403);

  const tokenHash = await generateLink(env, email, fetchImpl);
  if (!tokenHash) return json({ error: "unavailable" }, 502);
  const verified = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", token_hash: tokenHash }),
  });
  const session = await readJson(verified);
  if (!verified.ok || !session.access_token || !session.refresh_token) return json({ error: "unavailable" }, 502);
  return json({ access_token: session.access_token, refresh_token: session.refresh_token }, 200);
}

const sharedBook: RateBook = { hits: new Map() };

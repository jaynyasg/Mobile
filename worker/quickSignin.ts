export interface QuickSignInEnv {
  SUPABASE_URL?: string;
}

export const QUICK_SIGNIN_PATH = "/functions/v1/tatel-quick-signin";

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

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface SessionResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

async function readJson(response: Response): Promise<SessionResponse> {
  try {
    return (await response.json()) as SessionResponse;
  } catch {
    return {};
  }
}

export function quickSignInUrl(base: string): string {
  return `${base.replace(/\/$/, "")}${QUICK_SIGNIN_PATH}`;
}

export async function quickSignIn(
  request: Request,
  env: QuickSignInEnv,
  fetchImpl: FetchLike = fetch,
  book: RateBook = sharedBook,
  now = Date.now(),
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (!env.SUPABASE_URL) return json({ error: "unavailable" }, 503);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "email" }, 400);
  }
  const email = normalizeEmail(payload && typeof payload === "object" ? (payload as { email?: unknown }).email : null);
  if (!email) return json({ error: "email" }, 400);
  if (!consumeRate(book, clientKey(request), now)) return json({ error: "rate" }, 429);

  const response = await fetchImpl(quickSignInUrl(env.SUPABASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://tatel.app" },
    body: JSON.stringify({ email }),
  });
  const session = await readJson(response);
  if (response.status === 403) return json({ error: "code" }, 403);
  if (!response.ok || !session.access_token || !session.refresh_token) return json({ error: "unavailable" }, 502);
  return json({ access_token: session.access_token, refresh_token: session.refresh_token }, 200);
}

const sharedBook: RateBook = { hits: new Map() };

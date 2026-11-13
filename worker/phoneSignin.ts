import { clientKey, consumeRate, normalizeEmail, type QuickSignInEnv, type RateBook } from "./quickSignin";

export const PHONE_SIGNIN_PATH = "/functions/v1/tatel-phone-signin";

export interface PhoneSignInEnv extends QuickSignInEnv {}

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

function looksLikeJwt(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const token = value.trim();
  return token.length > 0 && token.length < 8192 && token.split(".").length === 3;
}

export function phoneSignInUrl(base: string): string {
  return `${base.replace(/\/$/, "")}${PHONE_SIGNIN_PATH}`;
}

const sharedBook: RateBook = { hits: new Map() };

export async function phoneSignIn(
  request: Request,
  env: PhoneSignInEnv,
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
    return json({ error: "invalid" }, 400);
  }
  const record = payload && typeof payload === "object" ? (payload as { email?: unknown; idToken?: unknown }) : {};
  const email = normalizeEmail(record.email);
  const idToken = looksLikeJwt(record.idToken) ? record.idToken.trim() : "";
  if (!email || !idToken) return json({ error: "invalid" }, 400);
  if (!consumeRate(book, clientKey(request), now)) return json({ error: "rate" }, 429);

  const response = await fetchImpl(phoneSignInUrl(env.SUPABASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://tatel.app" },
    body: JSON.stringify({ email, idToken }),
  });
  let session: SessionResponse = {};
  try {
    session = (await response.json()) as SessionResponse;
  } catch {
    session = {};
  }
  if (response.status === 403) return json({ error: "mismatch" }, 403);
  if (response.status === 401) return json({ error: "token" }, 401);
  if (!response.ok || !session.access_token || !session.refresh_token) return json({ error: "unavailable" }, 502);
  return json({ access_token: session.access_token, refresh_token: session.refresh_token }, 200);
}

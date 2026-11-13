import { clientKey, consumeRate, normalizeEmail, type RateBook } from "./quickSignin";

/** Current Checkout Session API. `embedded` was renamed to `embedded_page`. */
export const STRIPE_API_VERSION = "2026-03-25.dahlia";
export const STRIPE_UI_MODE = "embedded_page";
export const CHECKOUT_RETURN_URL = "https://tatel.app/passport?checkout=return&session_id={CHECKOUT_SESSION_ID}";

/** Live catalog prices. Override with STRIPE_PRICE_BEACH, STRIPE_PRICE_BOAT, and STRIPE_PRICE_VIP. */
export const DEFAULT_PASS_PRICES = {
  beach: "price_1UbToMRqnFhvQ1qEsP0qj1b8",
  boat: "price_1UbToRRqnFhvQ1qEqvHiOHHo",
  vip: "price_1UbToURqnFhvQ1qEunY1AOnL",
} as const;

export const PASS_QUANTITY = { beach: 1, boat: 1, vip: 8 } as const;

export type PassTier = keyof typeof DEFAULT_PASS_PRICES;

export interface CheckoutEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_BEACH?: string;
  STRIPE_PRICE_BOAT?: string;
  STRIPE_PRICE_VIP?: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const sharedBook: RateBook = { hits: new Map() };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function passTier(value: unknown): PassTier | null {
  if (value === "beach" || value === "boat" || value === "vip") return value;
  return null;
}

export function passPrices(env: CheckoutEnv): Record<PassTier, { price: string; quantity: number }> {
  return {
    beach: { price: env.STRIPE_PRICE_BEACH?.trim() || DEFAULT_PASS_PRICES.beach, quantity: PASS_QUANTITY.beach },
    boat: { price: env.STRIPE_PRICE_BOAT?.trim() || DEFAULT_PASS_PRICES.boat, quantity: PASS_QUANTITY.boat },
    vip: { price: env.STRIPE_PRICE_VIP?.trim() || DEFAULT_PASS_PRICES.vip, quantity: PASS_QUANTITY.vip },
  };
}

/** Server-owned Checkout Session fields. Client amounts and quantities are ignored. */
export function checkoutFields(tier: PassTier, email: string | null, prices = passPrices({})): Record<string, string> {
  const offer = prices[tier];
  const fields: Record<string, string> = {
    mode: "payment",
    ui_mode: STRIPE_UI_MODE,
    "line_items[0][price]": offer.price,
    "line_items[0][quantity]": String(offer.quantity),
    return_url: CHECKOUT_RETURN_URL,
    "metadata[event]": "tatel_2027",
    "metadata[tier]": tier,
    "branding_settings[display_name]": "TATEL",
    "branding_settings[background_color]": "#071421",
    "branding_settings[button_color]": "#FFE08A",
    "branding_settings[border_style]": "rounded",
  };
  if (email) fields.customer_email = email;
  return fields;
}

function formBody(fields: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) params.set(key, value);
  return params.toString();
}

function stripeHeaders(secret: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${secret}`);
  headers.set("Stripe-Version", STRIPE_API_VERSION);
  return headers;
}

export async function createPassCheckout(
  request: Request,
  env: CheckoutEnv,
  fetchImpl: FetchLike = fetch,
  book: RateBook = sharedBook,
  now = Date.now(),
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (!env.STRIPE_SECRET_KEY) return json({ error: "unavailable" }, 503);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "tier" }, 400);
  }
  const record = payload && typeof payload === "object" ? (payload as { tier?: unknown; email?: unknown }) : {};
  const tier = passTier(record.tier);
  if (!tier) return json({ error: "tier" }, 400);
  if (!consumeRate(book, `checkout:${clientKey(request)}`, now)) return json({ error: "rate" }, 429);
  const email = normalizeEmail(record.email);
  const fields = checkoutFields(tier, email, passPrices(env));
  const response = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: stripeHeaders(env.STRIPE_SECRET_KEY, { "Content-Type": "application/x-www-form-urlencoded" }),
    body: formBody(fields),
  });
  let session: { id?: string; client_secret?: string } = {};
  try {
    session = (await response.json()) as { id?: string; client_secret?: string };
  } catch {
    session = {};
  }
  if (!response.ok || !session.id || !session.client_secret) return json({ error: "unavailable" }, 502);
  return json({ clientSecret: session.client_secret, sessionId: session.id }, 200);
}

export async function readPassCheckout(
  request: Request,
  env: CheckoutEnv,
  fetchImpl: FetchLike = fetch,
): Promise<Response> {
  if (request.method !== "GET") return json({ error: "method" }, 405);
  if (!env.STRIPE_SECRET_KEY) return json({ error: "unavailable" }, 503);
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: "session" }, 400);
  const response = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    method: "GET",
    headers: stripeHeaders(env.STRIPE_SECRET_KEY),
  });
  let session: { status?: string; payment_status?: string; metadata?: { tier?: string } } = {};
  try {
    session = (await response.json()) as { status?: string; payment_status?: string; metadata?: { tier?: string } };
  } catch {
    session = {};
  }
  if (!response.ok || (session.status !== "complete" && session.status !== "open" && session.status !== "expired")) {
    return json({ error: "unavailable" }, 502);
  }
  return json({
    status: session.status,
    paymentStatus: session.payment_status ?? null,
    tier: passTier(session.metadata?.tier),
  }, 200);
}

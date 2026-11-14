import { DEFAULT_PASS_PRICES, STRIPE_API_VERSION, STRIPE_UI_MODE } from "./checkout";
import { clientKey, consumeRate, normalizeEmail, type RateBook } from "./quickSignin";
import {
  HOLD_MS,
  SESSION_MS,
  TEAM_NOTIFY_EMAIL,
  TEAM_NOTIFY_FROM,
  boatPreference,
  emailsOnCreate,
  filledEmail,
  paymentEmail,
  progressLine,
  refundEmail,
  reminderEmail,
  verifyStripeSignature,
  type TeamEmail,
} from "../src/logic/vipGroup";
import { remoteVipStore, type VipRecord, type VipStore } from "./vipStore";

export interface MailMessage {
  to: string;
  from: string | { email: string; name?: string };
  subject: string;
  text?: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<{ messageId: string }>;
}

export interface VipEnv {
  SUPABASE_URL?: string;
  VIP_SIGNING_PRIVATE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_VIP?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  TEAM_NOTIFY_EMAIL?: string;
  TEAM_NOTIFY_FROM?: string;
  EMAIL?: MailSender;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface VipDeps {
  fetchImpl?: FetchLike;
  store?: VipStore;
  mail?: MailSender;
  now?: number;
  book?: RateBook;
}

const sharedBook: RateBook = { hits: new Map() };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function formBody(fields: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) params.set(key, value);
  return params.toString();
}

function stripeHeaders(secret: string): Headers {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${secret}`);
  headers.set("Stripe-Version", STRIPE_API_VERSION);
  headers.set("Content-Type", "application/x-www-form-urlencoded");
  return headers;
}

export function bookingCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function uuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

export function publicBooking(record: VipRecord) {
  return {
    code: record.code,
    boatPreference: record.boatPreference,
    status: record.status,
    paidShares: record.paidShares,
    reservedShares: record.reservedShares,
    remaining: record.remaining,
    deadline: record.deadline,
    createdAt: record.createdAt,
    progress: progressLine(record.paidShares),
    url: `https://tatel.app/pass/vip/${record.code}`,
  };
}

export function shareCheckoutFields(input: {
  price: string;
  quantity: number;
  bookingId: string;
  bookingCode: string;
  email: string | null;
  expiresAt: number;
}): Record<string, string> {
  const fields: Record<string, string> = {
    mode: "payment",
    ui_mode: STRIPE_UI_MODE,
    "line_items[0][price]": input.price,
    "line_items[0][quantity]": String(input.quantity),
    expires_at: String(input.expiresAt),
    return_url: `https://tatel.app/pass/vip/${input.bookingCode}?checkout=return&session_id={CHECKOUT_SESSION_ID}`,
    "metadata[event]": "tatel_2027",
    "metadata[tier]": "vip",
    "metadata[booking_id]": input.bookingId,
    "metadata[booking_code]": input.bookingCode,
    "metadata[shares]": String(input.quantity),
    "payment_intent_data[metadata][event]": "tatel_2027",
    "payment_intent_data[metadata][tier]": "vip",
    "payment_intent_data[metadata][booking_id]": input.bookingId,
    "payment_intent_data[metadata][booking_code]": input.bookingCode,
    "payment_intent_data[metadata][shares]": String(input.quantity),
    "branding_settings[display_name]": "TATEL",
    "branding_settings[background_color]": "#071421",
    "branding_settings[button_color]": "#FFE08A",
    "branding_settings[border_style]": "rounded",
  };
  if (input.email) fields.customer_email = input.email;
  return fields;
}

export async function deliverTeamEmail(env: VipEnv, message: TeamEmail, mail?: MailSender): Promise<boolean> {
  const sender = mail ?? env.EMAIL;
  if (!sender?.send) return false;
  const to = env.TEAM_NOTIFY_EMAIL?.trim() || TEAM_NOTIFY_EMAIL;
  const from = env.TEAM_NOTIFY_FROM?.trim() || TEAM_NOTIFY_FROM;
  try {
    await sender.send({
      to,
      from: { email: from, name: "TATEL" },
      subject: message.subject,
      text: message.text,
    });
    return true;
  } catch {
    return false;
  }
}

async function sendAll(env: VipEnv, messages: TeamEmail[], mail?: MailSender): Promise<void> {
  for (const message of messages) await deliverTeamEmail(env, message, mail);
}

function facts(record: VipRecord) {
  return {
    code: record.code,
    boatPreference: record.boatPreference,
    hostName: record.hostName,
    hostEmail: record.hostEmail,
    hostPhone: record.hostPhone,
    paidShares: record.paidShares,
    deadline: record.deadline,
    createdAt: record.createdAt,
    payers: record.payers,
  };
}

function storeFor(env: VipEnv, deps: VipDeps): VipStore | null {
  return deps.store ?? remoteVipStore(env, deps.fetchImpl);
}

export async function handleVipRequest(request: Request, env: VipEnv, deps: VipDeps = {}): Promise<Response> {
  const url = new URL(request.url);
  const now = deps.now ?? Date.now();
  const store = storeFor(env, deps);
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[2] ?? "";
  const action = parts[3] ?? "";

  if (request.method === "POST" && url.pathname === "/api/vip-booking") {
    if (!store) return json({ error: "unavailable" }, 503);
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "preference" }, 400);
    }
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const preference = boatPreference(record.boatPreference);
    if (!preference) return json({ error: "preference" }, 400);
    if (!consumeRate(deps.book ?? sharedBook, `vip:${clientKey(request)}`, now)) return json({ error: "rate" }, 429);
    let created: VipRecord;
    try {
      created = await store.create({
        code: bookingCode(),
        boatPreference: preference,
        hostEmail: normalizeEmail(record.hostEmail),
        hostUserId: uuid(record.hostUserId),
        hostName: text(record.hostName, 120),
        hostPhone: text(record.hostPhone, 32),
        now,
      });
    } catch {
      return json({ error: "unavailable" }, 502);
    }
    await sendAll(env, emailsOnCreate(facts(created), now), deps.mail);
    return json(publicBooking(created), 200);
  }

  if (!/^[a-z0-9]{8,12}$/.test(code)) return json({ error: "missing" }, 404);
  if (!store) return json({ error: "unavailable" }, 503);

  if (request.method === "GET" && !action) {
    try {
      const booking = await store.get(code, now);
      if (!booking) return json({ error: "missing" }, 404);
      return json(publicBooking(booking), 200);
    } catch {
      return json({ error: "unavailable" }, 502);
    }
  }

  if (request.method === "POST" && action === "checkout") return startShareCheckout(request, env, store, code, deps, now);
  return json({ error: "method" }, 405);
}

async function startShareCheckout(
  request: Request,
  env: VipEnv,
  store: VipStore,
  code: string,
  deps: VipDeps,
  now: number,
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "unavailable" }, 503);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "quantity" }, 400);
  }
  const record = payload && typeof payload === "object" ? payload as { quantity?: unknown; email?: unknown } : {};
  const quantity = typeof record.quantity === "number" ? record.quantity : Number(record.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 8) return json({ error: "quantity" }, 400);
  if (!consumeRate(deps.book ?? sharedBook, `vip-pay:${clientKey(request)}`, now)) return json({ error: "rate" }, 429);

  let booking: VipRecord | null;
  try {
    booking = await store.get(code, now);
  } catch {
    return json({ error: "unavailable" }, 502);
  }
  if (!booking) return json({ error: "missing" }, 404);
  if (booking.status !== "open") return json({ error: "closed" }, 409);
  if (quantity > booking.remaining) return json({ error: "full" }, 409);

  const fetchImpl = deps.fetchImpl ?? fetch;
  const email = normalizeEmail(record.email);
  const sessionEnds = now + SESSION_MS;
  const holdEnds = now + HOLD_MS;
  const response = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: stripeHeaders(env.STRIPE_SECRET_KEY),
    body: formBody(shareCheckoutFields({
      price: env.STRIPE_PRICE_VIP?.trim() || DEFAULT_PASS_PRICES.vip,
      quantity,
      bookingId: booking.id,
      bookingCode: booking.code,
      email,
      expiresAt: Math.floor(sessionEnds / 1000),
    })),
  });
  let session: { id?: string; client_secret?: string } = {};
  try {
    session = await response.json() as { id?: string; client_secret?: string };
  } catch {
    session = {};
  }
  if (!response.ok || !session.id || !session.client_secret) return json({ error: "unavailable" }, 502);

  try {
    const reserved = await store.reserve({ code, sessionId: session.id, quantity, expiresAt: holdEnds, payerEmail: email, now });
    if (!reserved.ok) {
      await expireSession(fetchImpl, env.STRIPE_SECRET_KEY, session.id);
      return json({ error: reserved.reason === "closed" ? "closed" : "full" }, 409);
    }
  } catch {
    await expireSession(fetchImpl, env.STRIPE_SECRET_KEY, session.id);
    return json({ error: "unavailable" }, 502);
  }
  return json({ clientSecret: session.client_secret, sessionId: session.id }, 200);
}

async function expireSession(fetchImpl: FetchLike, secret: string, sessionId: string): Promise<void> {
  try {
    await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${sessionId}/expire`, {
      method: "POST",
      headers: stripeHeaders(secret),
    });
  } catch {
    // The client secret is not returned, so the hold is the part that matters.
  }
}

export async function handleStripeWebhook(request: Request, env: VipEnv, deps: VipDeps = {}): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "unavailable" }, 503);
  const payload = await request.text();
  const header = request.headers.get("Stripe-Signature") ?? "";
  const now = deps.now ?? Date.now();
  if (!await verifyStripeSignature(payload, header, env.STRIPE_WEBHOOK_SECRET, now)) return json({ error: "signature" }, 400);
  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const session = event.data?.object ?? {};
  const metadata = session.metadata && typeof session.metadata === "object" ? session.metadata as Record<string, unknown> : {};
  const bookingId = typeof metadata.booking_id === "string" ? metadata.booking_id : "";
  const sessionId = typeof session.id === "string" ? session.id : "";
  if (!bookingId || !sessionId) return json({ received: true }, 200);
  const store = storeFor(env, deps);
  if (!store) return json({ error: "unavailable" }, 503);
  if (event.type === "checkout.session.async_payment_failed") {
    try {
      await store.release(sessionId);
    } catch {
      return json({ error: "unavailable" }, 502);
    }
    return json({ received: true }, 200);
  }
  const paidNow = event.type === "checkout.session.async_payment_succeeded"
    || (event.type === "checkout.session.completed" && session.payment_status === "paid");
  if (!paidNow) return json({ received: true }, 200);
  const quantity = Number(metadata.shares);
  const amount = typeof session.amount_total === "number" && Number.isFinite(session.amount_total)
    ? session.amount_total
    : quantity * 500_000;
  return applyPayment(env, store, deps, now, {
    sessionId,
    bookingId,
    quantity,
    payerEmail: payerFromSession(session),
    amountCents: amount,
  });
}

function payerFromSession(session: Record<string, unknown>): string | null {
  const details = session.customer_details && typeof session.customer_details === "object"
    ? session.customer_details as { email?: unknown }
    : {};
  return normalizeEmail(details.email) ?? normalizeEmail(session.customer_email);
}

export async function notePaidFromStatus(
  env: VipEnv,
  sessionId: string,
  body: { status?: string; paymentStatus?: string | null; bookingId?: string | null; shares?: number | null },
  deps: VipDeps = {},
): Promise<void> {
  if (body.status !== "complete" || body.paymentStatus !== "paid" || !body.bookingId) return;
  const store = storeFor(env, deps);
  if (!store) return;
  const quantity = typeof body.shares === "number" ? body.shares : Number(body.shares);
  await applyPayment(env, store, deps, deps.now ?? Date.now(), {
    sessionId,
    bookingId: body.bookingId,
    quantity,
    payerEmail: null,
    amountCents: quantity * 500_000,
  });
}

async function applyPayment(
  env: VipEnv,
  store: VipStore,
  deps: VipDeps,
  now: number,
  payment: { sessionId: string; bookingId: string; quantity: number; payerEmail: string | null; amountCents: number },
): Promise<Response> {
  let result: Awaited<ReturnType<VipStore["record"]>>;
  try {
    result = await store.record({
      sessionId: payment.sessionId,
      bookingId: payment.bookingId,
      quantity: payment.quantity,
      payerEmail: payment.payerEmail,
      now,
    });
  } catch {
    return json({ error: "unavailable" }, 502);
  }
  if (!result.ok) return json({ error: result.reason }, result.reason === "missing" ? 404 : result.reason === "full" ? 409 : 400);
  if (result.needsRefund) {
    await sendAll(env, [refundEmail(facts(result.booking), now, payment.quantity, payment.payerEmail, payment.amountCents)], deps.mail);
    return json({ received: true, needsRefund: true }, 200);
  }
  if (result.applied) {
    const messages = [paymentEmail(facts(result.booking), now, payment.quantity, payment.payerEmail)];
    if (result.justFilled) messages.push(filledEmail(facts(result.booking), now));
    await sendAll(env, messages, deps.mail);
  }
  return json({ received: true, progress: result.booking.paidShares }, 200);
}

export async function sendDueReminders(env: VipEnv, deps: VipDeps = {}): Promise<number> {
  const store = storeFor(env, deps);
  if (!store) return 0;
  const now = deps.now ?? Date.now();
  let due: Awaited<ReturnType<VipStore["due"]>>;
  try {
    due = await store.due(now);
  } catch {
    return 0;
  }
  let sent = 0;
  for (const booking of due) {
    if (booking.status === "filled") continue;
    const delivered = await deliverTeamEmail(env, reminderEmail(facts(booking), now, booking.kind), deps.mail);
    if (!delivered) continue;
    try {
      await store.markNotified(booking.code, booking.kind);
      sent += 1;
    } catch {
      // The next cron run tries again if the mark did not land.
    }
  }
  return sent;
}

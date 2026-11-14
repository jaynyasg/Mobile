import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PASS_PRICES, STRIPE_UI_MODE } from "./checkout";
import { SHARED_BOAT_SUBJECT, verifyStripeSignature } from "../src/logic/vipGroup";
import { handleStripeWebhook, handleVipRequest, sendDueReminders, shareCheckoutFields } from "./vipBooking";
import { memoryVipStore, remoteVipStore } from "./vipStore";
import type { MailMessage } from "./vipBooking";

const NOW = Date.parse("2026-11-14T01:17:00.000Z");

function mailBox() {
  const sent: MailMessage[] = [];
  return {
    sent,
    mail: { send: async (message: MailMessage) => { sent.push(message); return { messageId: "msg_1" }; } },
  };
}

function start(preference: "shared" | "full_boat", mail: { send: (message: MailMessage) => Promise<{ messageId: string }> }, store = memoryVipStore()) {
  return handleVipRequest(new Request("https://tatel.app/api/vip-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      boatPreference: preference,
      hostName: "Ada Lovelace",
      hostEmail: "ada@example.com",
      hostPhone: "+13405550100",
    }),
  }), { EMAIL: mail }, { store, mail, now: NOW, book: { hits: new Map() } });
}

describe("VIP group booking", () => {
  it("emails the team immediately when the host is open to sharing, and not for a full boat", async () => {
    const sharedMail = mailBox();
    const stripe = vi.fn(async () => { throw new Error("stripe"); });
    const shared = await handleVipRequest(new Request("https://tatel.app/api/vip-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boatPreference: "shared",
        hostName: "Ada Lovelace",
        hostEmail: "ada@example.com",
        hostPhone: "+13405550100",
      }),
    }), {}, { store: memoryVipStore(), mail: sharedMail.mail, now: NOW, book: { hits: new Map() }, fetchImpl: stripe });
    expect(shared.status).toBe(200);
    const body = await shared.json() as { code: string; boatPreference: string; paidShares: number };
    expect(body.boatPreference).toBe("shared");
    expect(body.paidShares).toBe(0);
    const note = sharedMail.sent.find((message) => message.subject === SHARED_BOAT_SUBJECT);
    expect(note?.text).toContain(`Booking code: ${body.code}`);
    expect(note?.text).toContain("Host name: Ada Lovelace");
    expect(note?.text).toContain("Host email: ada@example.com");
    expect(note?.text).toContain("Host phone: +13405550100");
    expect(note?.text).toContain("Shares paid: 0 of 8");
    expect(note?.text).toContain("Time: 2026-11-14T01:17:00Z");
    expect(note?.to).toBe("cannon@18seventy8.com");
    expect(stripe).not.toHaveBeenCalled();

    const fullMail = mailBox();
    const full = await start("full_boat", fullMail.mail);
    expect(full.status).toBe(200);
    expect(fullMail.sent.some((message) => message.subject === SHARED_BOAT_SUBJECT)).toBe(false);
    expect(fullMail.sent.map((message) => message.subject)).toEqual(["TATEL VIP: group booking started"]);
    expect(fullMail.sent[0]?.text).toContain("Boat preference: Full boat (own group of 8)");
  });

  it("rejects a share quantity past the unreserved remainder and charges only the chosen quantity", async () => {
    const store = memoryVipStore();
    const mail = mailBox();
    const created = await start("full_boat", mail.mail, store);
    const { code } = await created.json() as { code: string };
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      id: "cs_share_1",
      client_secret: "cs_share_1_secret",
    }), { status: 200 }));
    const env = { STRIPE_SECRET_KEY: "sk_live_test_only", STRIPE_PRICE_VIP: "price_custom_vip" };
    const over = await handleVipRequest(new Request(`https://tatel.app/api/vip-booking/${code}/checkout`, {
      method: "POST",
      body: JSON.stringify({ quantity: 9, email: "ada@example.com" }),
    }), env, { store, fetchImpl, now: NOW, book: { hits: new Map() } });
    expect(over.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();

    const ok = await handleVipRequest(new Request(`https://tatel.app/api/vip-booking/${code}/checkout`, {
      method: "POST",
      body: JSON.stringify({ quantity: 2, email: "ada@example.com" }),
    }), env, { store, fetchImpl, now: NOW, book: { hits: new Map() } });
    expect(ok.status).toBe(200);
    const params = new URLSearchParams(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(params.get("ui_mode")).toBe(STRIPE_UI_MODE);
    expect(params.get("line_items[0][price]")).toBe("price_custom_vip");
    expect(params.get("line_items[0][quantity]")).toBe("2");
    expect(params.get("metadata[booking_code]")).toBe(code);
    expect(params.get("payment_intent_data[metadata][booking_id]")).toBeTruthy();
    expect(params.get("payment_intent_data[metadata][shares]")).toBe("2");
    expect(params.get("expires_at")).toBe(String(Math.floor((NOW + 30 * 60 * 1000) / 1000)));
    expect(params.has("success_url")).toBe(false);
    expect((await store.get(code, NOW + 31 * 60 * 1000))?.reservedShares).toBe(2);
    expect(shareCheckoutFields({
      price: DEFAULT_PASS_PRICES.vip,
      quantity: 1,
      bookingId: "id",
      bookingCode: code,
      email: null,
      expiresAt: 1,
    })["line_items[0][price]"]).toBe(DEFAULT_PASS_PRICES.vip);

    const held = await handleVipRequest(new Request(`https://tatel.app/api/vip-booking/${code}/checkout`, {
      method: "POST",
      body: JSON.stringify({ quantity: 7 }),
    }), env, { store, fetchImpl, now: NOW, book: { hits: new Map() } });
    expect(held.status).toBe(409);
    expect((await store.get(code, NOW + 41 * 60 * 1000))?.reservedShares).toBe(0);
  });

  it("records a paid webhook only when the signature matches", async () => {
    const store = memoryVipStore();
    const mail = mailBox();
    const created = await start("shared", mail.mail, store);
    const booking = await created.json() as { code: string };
    const view = await store.get(booking.code, NOW);
    const payload = JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_paid_share",
          payment_status: "paid",
          customer_details: { email: "ada@example.com" },
          metadata: { booking_id: view?.id, shares: "3", tier: "vip" },
        },
      },
    });
    const secret = "whsec_test";
    const header = await signed(payload, secret, Math.floor(NOW / 1000));
    const bad = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": header },
      body: `${payload} `,
    }), { STRIPE_WEBHOOK_SECRET: secret }, { store, mail: mail.mail, now: NOW });
    expect(bad.status).toBe(400);
    expect(await store.get(booking.code, NOW)).toMatchObject({ paidShares: 0 });

    const good = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": header },
      body: payload,
    }), { STRIPE_WEBHOOK_SECRET: secret }, { store, mail: mail.mail, now: NOW });
    expect(good.status).toBe(200);
    expect(await store.get(booking.code, NOW)).toMatchObject({ paidShares: 3 });
    expect(mail.sent.some((message) => message.subject === "TATEL VIP: share paid (3 of 8)")).toBe(true);
    expect(mail.sent.find((message) => message.subject.includes("share paid"))?.text).toContain("Open to sharing a boat");
    expect(await verifyStripeSignature(payload, header, secret, NOW)).toBe(true);
  });

  it("records a lapsed payment that no longer fits and emails for a refund", async () => {
    const store = memoryVipStore();
    const mail = mailBox();
    const created = await start("full_boat", mail.mail, store);
    const booking = await created.json() as { code: string };
    const view = await store.get(booking.code, NOW);
    await store.record({ sessionId: "cs_full", bookingId: view?.id ?? "", quantity: 8, payerEmail: "ada@example.com", now: NOW });
    mail.sent.length = 0;
    const payload = JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_late",
          payment_status: "paid",
          amount_total: 500_000,
          customer_details: { email: "late@example.com" },
          metadata: { booking_id: view?.id, shares: "1" },
        },
      },
    });
    const header = await signed(payload, "whsec_test", Math.floor(NOW / 1000));
    const response = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": header },
      body: payload,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, mail: mail.mail, now: NOW });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ needsRefund: true });
    expect((await store.get(booking.code, NOW))?.paidShares).toBe(8);
    const note = mail.sent.find((message) => message.subject === "TATEL VIP: refund needed");
    expect(note?.text).toContain("Refund needed: $5,000");
    expect(note?.text).toContain(`Booking code: ${booking.code}`);
    expect(note?.text).toContain("Payer: late@example.com");
    expect(note?.text).toContain("Boat preference: Full boat (own group of 8)");
    const repeat = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": header },
      body: payload,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, mail: mail.mail, now: NOW });
    expect(repeat.status).toBe(200);
    expect(mail.sent.filter((message) => message.subject === "TATEL VIP: refund needed")).toHaveLength(1);
  });

  it("waits for a delayed payment and releases the hold when that payment fails", async () => {
    const store = memoryVipStore();
    const mail = mailBox();
    const created = await start("shared", mail.mail, store);
    const booking = await created.json() as { code: string };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "cs_async", client_secret: "cs_async_secret" }), { status: 200 }));
    await handleVipRequest(new Request(`https://tatel.app/api/vip-booking/${booking.code}/checkout`, {
      method: "POST",
      body: JSON.stringify({ quantity: 1, email: "ada@example.com" }),
    }), { STRIPE_SECRET_KEY: "sk_live_test_only" }, { store, fetchImpl, now: NOW, book: { hits: new Map() } });
    const view = await store.get(booking.code, NOW);
    const pending = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_async", payment_status: "unpaid", metadata: { booking_id: view?.id, shares: "1" } } },
    });
    const pendingHeader = await signed(pending, "whsec_test", Math.floor(NOW / 1000));
    const waiting = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": pendingHeader },
      body: pending,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, mail: mail.mail, now: NOW });
    expect(waiting.status).toBe(200);
    expect((await store.get(booking.code, NOW))?.paidShares).toBe(0);
    expect((await store.get(booking.code, NOW))?.reservedShares).toBe(1);

    const failed = JSON.stringify({
      type: "checkout.session.async_payment_failed",
      data: { object: { id: "cs_async", payment_status: "unpaid", metadata: { booking_id: view?.id, shares: "1" } } },
    });
    const failedHeader = await signed(failed, "whsec_test", Math.floor(NOW / 1000));
    const released = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": failedHeader },
      body: failed,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, mail: mail.mail, now: NOW });
    expect(released.status).toBe(200);
    expect((await store.get(booking.code, NOW))?.reservedShares).toBe(0);

    const succeeded = JSON.stringify({
      type: "checkout.session.async_payment_succeeded",
      data: { object: { id: "cs_async", payment_status: "paid", amount_total: 500_000, metadata: { booking_id: view?.id, shares: "1" }, customer_details: { email: "ada@example.com" } } },
    });
    const succeededHeader = await signed(succeeded, "whsec_test", Math.floor(NOW / 1000));
    const paid = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": succeededHeader },
      body: succeeded,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, mail: mail.mail, now: NOW });
    expect(paid.status).toBe(200);
    expect((await store.get(booking.code, NOW))?.paidShares).toBe(1);
  });

  it("returns 5xx so Stripe retries when the booking store rejects a release or a payment", async () => {
    const privateKey = await testPrivateKey();
    const failing = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ error: "unavailable" }), { status: 500 }));
    const store = remoteVipStore({ SUPABASE_URL: "https://example.supabase.co", VIP_SIGNING_PRIVATE_KEY: privateKey }, failing);
    expect(store).toBeTruthy();
    if (!store) return;
    const bookingId = "11111111-1111-4111-8111-111111111111";
    await expect(store.release("cs_fail")).rejects.toThrow();
    const sent = new Headers(failing.mock.calls[0]?.[1]?.headers);
    expect(sent.get("x-tatel-ts")).toBeTruthy();
    expect(sent.get("x-tatel-sig")).toBeTruthy();
    expect(sent.get("Authorization")).toBeNull();
    const failed = JSON.stringify({
      type: "checkout.session.async_payment_failed",
      data: { object: { id: "cs_fail", metadata: { booking_id: bookingId } } },
    });
    const failedHeader = await signed(failed, "whsec_test", Math.floor(NOW / 1000));
    const release = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": failedHeader },
      body: failed,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, now: NOW });
    expect(release.status).toBe(502);

    await expect(store.record({
      sessionId: "cs_paid_fail",
      quantity: 1,
      payerEmail: "ada@example.com",
      bookingId,
      now: NOW,
    })).rejects.toThrow();
    const paid = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_paid_fail", payment_status: "paid", metadata: { booking_id: bookingId, shares: "1" } } },
    });
    const paidHeader = await signed(paid, "whsec_test", Math.floor(NOW / 1000));
    const recorded = await handleStripeWebhook(new Request("https://tatel.app/api/stripe/webhook", {
      method: "POST",
      headers: { "Stripe-Signature": paidHeader },
      body: paid,
    }), { STRIPE_WEBHOOK_SECRET: "whsec_test" }, { store, now: NOW });
    expect(recorded.status).toBe(502);

    const okStore = remoteVipStore(
      { SUPABASE_URL: "https://example.supabase.co", VIP_SIGNING_PRIVATE_KEY: privateKey },
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    await expect(okStore?.release("cs_ok")).resolves.toBeUndefined();
  });

  it("reminds the team once when three days are left and again at the deadline", async () => {
    const store = memoryVipStore();
    const mail = mailBox();
    const created = await start("full_boat", mail.mail, store);
    const { code } = await created.json() as { code: string };
    mail.sent.length = 0;
    const threeDays = NOW + 11 * 24 * 60 * 60 * 1000;
    expect(await sendDueReminders({}, { store, mail: mail.mail, now: threeDays })).toBe(1);
    expect(mail.sent[0]?.subject).toBe("TATEL VIP: 3 days left, people are waiting");
    expect(mail.sent[0]?.text).toContain("Boat preference: Full boat (own group of 8)");
    expect(mail.sent[0]?.text).toContain("People are waiting");
    expect(await sendDueReminders({}, { store, mail: mail.mail, now: threeDays })).toBe(0);
    const deadline = NOW + 14 * 24 * 60 * 60 * 1000;
    expect(await sendDueReminders({}, { store, mail: mail.mail, now: deadline })).toBe(1);
    expect(mail.sent[1]?.subject).toBe("TATEL VIP: deadline reached, people are waiting");
    expect((await store.get(code, deadline))?.status).toBe("expired");
  });
});

async function testPrivateKey(): Promise<string> {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const bytes = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const b64 = btoa(binary).replace(/(.{64})/g, "$1\n");
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
}

async function signed(payload: string, secret: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PASS_PRICES, STRIPE_UI_MODE } from "./checkout";
import { SHARED_BOAT_SUBJECT, verifyStripeSignature } from "../src/logic/vipGroup";
import { handleStripeWebhook, handleVipRequest, sendDueReminders, shareCheckoutFields } from "./vipBooking";
import { memoryVipStore } from "./vipStore";
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
    expect(params.has("success_url")).toBe(false);
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

async function signed(payload: string, secret: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

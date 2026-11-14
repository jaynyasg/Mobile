import { describe, expect, it, vi } from "vitest";
import { CHECKOUT_RETURN_URL, DEFAULT_PASS_PRICES, STRIPE_API_VERSION, STRIPE_UI_MODE, createPassCheckout, readPassCheckout } from "./checkout";

const env = { STRIPE_SECRET_KEY: "sk_live_test_only" };

function sessionResponse() {
  return new Response(JSON.stringify({ id: "cs_test_123", client_secret: "cs_test_123_secret", url: null }), { status: 200 });
}

describe("pass checkout", () => {
  it("creates an embedded session from the server tier, not the client amount", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => sessionResponse());
    const response = await createPassCheckout(
      new Request("https://tatel.app/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "1.1.1.1" },
        body: JSON.stringify({ tier: "beach", quantity: 1, amount: 100, email: " Ada@Example.com " }),
      }),
      env,
      fetchImpl,
      { hits: new Map() },
      1_000,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ clientSecret: "cs_test_123_secret", sessionId: "cs_test_123" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(init).toBeTruthy();
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer sk_live_test_only");
    expect(headers.get("Stripe-Version")).toBe(STRIPE_API_VERSION);
    const params = new URLSearchParams(String(init?.body));
    expect(params.get("mode")).toBe("payment");
    expect(params.get("ui_mode")).toBe(STRIPE_UI_MODE);
    expect(params.get("line_items[0][price]")).toBe(DEFAULT_PASS_PRICES.beach);
    expect(DEFAULT_PASS_PRICES.boat).toBe("price_1UbToRRqnFhvQ1qEqvHiOHHo");
    expect(DEFAULT_PASS_PRICES.vip).toBe("price_1UbToURqnFhvQ1qEunY1AOnL");
    expect(params.get("line_items[0][quantity]")).toBe("1");
    expect(params.get("metadata[event]")).toBe("tatel_2027");
    expect(params.get("metadata[tier]")).toBe("beach");
    expect(params.get("customer_email")).toBe("ada@example.com");
    expect(CHECKOUT_RETURN_URL).toBe("https://tatel.app/tickets?checkout=return&session_id={CHECKOUT_SESSION_ID}");
    expect(params.get("return_url")).toBe(CHECKOUT_RETURN_URL);
    expect(params.get("branding_settings[background_color]")).toBe("#071421");
    expect(params.get("branding_settings[button_color]")).toBe("#FFE08A");
    expect([...params.keys()].some((key) => key.includes("adjustable_quantity"))).toBe(false);
    expect(params.has("success_url")).toBe(false);
    expect(params.has("cancel_url")).toBe(false);
    expect([...params.keys()].some((key) => key.startsWith("payment_method_types"))).toBe(false);
  });

  it("fixes beach and boat at quantity 1 and skips a blank email", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => sessionResponse());
    const book = { hits: new Map() };
    for (const tier of ["beach", "boat"] as const) {
      const response = await createPassCheckout(
        new Request("https://tatel.app/api/checkout", {
          method: "POST",
          body: JSON.stringify({ tier, email: "not-an-email", quantity: 9 }),
        }),
        env,
        fetchImpl,
        book,
        2_000,
      );
      expect(response.status).toBe(200);
    }
    const beach = new URLSearchParams(String(fetchImpl.mock.calls[0][1]?.body));
    const boat = new URLSearchParams(String(fetchImpl.mock.calls[1][1]?.body));
    expect(beach.get("line_items[0][price]")).toBe(DEFAULT_PASS_PRICES.beach);
    expect(beach.get("line_items[0][quantity]")).toBe("1");
    expect(beach.has("customer_email")).toBe(false);
    expect([...beach.keys()].some((key) => key.startsWith("payment_method_types"))).toBe(false);
    expect(boat.get("line_items[0][price]")).toBe(DEFAULT_PASS_PRICES.boat);
    expect(boat.get("line_items[0][quantity]")).toBe("1");
    expect([...boat.keys()].some((key) => key.startsWith("payment_method_types"))).toBe(false);
  });

  it("does not call Stripe without a secret or a known tier", async () => {
    const fetchImpl = vi.fn(async () => sessionResponse());
    const missing = await createPassCheckout(
      new Request("https://tatel.app/api/checkout", { method: "POST", body: JSON.stringify({ tier: "beach" }) }),
      {},
      fetchImpl,
      { hits: new Map() },
    );
    expect(missing.status).toBe(503);
    const unknown = await createPassCheckout(
      new Request("https://tatel.app/api/checkout", { method: "POST", body: JSON.stringify({ tier: "free" }) }),
      env,
      fetchImpl,
      { hits: new Map() },
    );
    expect(unknown.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses a single VIP checkout so the group booking owns those shares", async () => {
    const fetchImpl = vi.fn(async () => sessionResponse());
    const response = await createPassCheckout(
      new Request("https://tatel.app/api/checkout", { method: "POST", body: JSON.stringify({ tier: "vip", quantity: 8 }) }),
      env,
      fetchImpl,
      { hits: new Map() },
      4_000,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "group" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads session status without returning the client secret", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      id: "cs_paid_1",
      client_secret: "secret",
      status: "complete",
      payment_status: "paid",
      metadata: { event: "tatel_2027", tier: "boat" },
    }), { status: 200 }));
    const response = await readPassCheckout(
      new Request("https://tatel.app/api/checkout/status?session_id=cs_paid_1"),
      env,
      fetchImpl,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "complete", paymentStatus: "paid", tier: "boat", bookingId: null, shares: null });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.stripe.com/v1/checkout/sessions/cs_paid_1");
    const bad = await readPassCheckout(
      new Request("https://tatel.app/api/checkout/status?session_id=pi_not_a_session"),
      env,
      fetchImpl,
    );
    expect(bad.status).toBe(400);
  });
});

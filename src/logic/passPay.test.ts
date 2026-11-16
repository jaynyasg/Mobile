import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKOUT_SOON, canEmbedCheckout, passOffer, passTier, stripePublishableKey } from "./passPay";

describe("pass checkout client", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps production checkout available when the build has no environment override", () => {
    vi.stubEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY", undefined);
    expect(stripePublishableKey()).toMatch(/^pk_live_[A-Za-z0-9]{20,}$/);
    expect(canEmbedCheckout()).toBe(true);
    vi.stubEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY", "  ");
    expect(canEmbedCheckout()).toBe(true);
  });

  it("allows an explicit test-account override without accepting secret keys", () => {
    vi.stubEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY", " pk_test_example ");
    expect(stripePublishableKey()).toBe("pk_test_example");
    expect(canEmbedCheckout()).toBe(true);
    expect(canEmbedCheckout("sk_live_example")).toBe(false);
    expect(canEmbedCheckout("pk_invalid_example")).toBe(false);
  });

  it("embeds only when a publishable key is present", () => {
    expect(canEmbedCheckout("")).toBe(false);
    expect(canEmbedCheckout("pk_live_example")).toBe(true);
    expect(CHECKOUT_SOON).toBe("Checkout opening soon");
    expect(passTier("vip")).toBe("vip");
    expect(passTier("free")).toBeNull();
  });

  it("states the VIP total as eight guests", () => {
    expect(passOffer("beach", "$1,900")).toEqual({ guests: "1 guest", total: "$1,900" });
    expect(passOffer("boat", "$2,500")).toEqual({ guests: "1 guest", total: "$2,500" });
    expect(passOffer("vip", "$5,000")).toEqual({ guests: "8 guests", total: "$40,000 total" });
  });

  it("does not keep a Stripe payment link", () => {
    const files = ["src/logic/passPay.ts", "src/app/(tabs)/tickets.tsx", "src/components/PassCheckout.tsx", "src/components/PassCheckout.web.tsx", "worker/checkout.ts"];
    for (const file of files) expect(readFileSync(file, "utf8")).not.toContain("buy.stripe.com");
  });
});

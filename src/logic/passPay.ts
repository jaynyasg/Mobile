export type PassTier = "beach" | "boat" | "vip";

export function confirmedPayment(body: { status?: string; paymentStatus?: string | null; tier?: string | null }, expected?: PassTier): boolean {
  return body.status === "complete" && body.paymentStatus === "paid" && passTier(body.tier) != null && (!expected || body.tier === expected);
}

export const CHECKOUT_SOON = "Checkout opening soon";

// Public browser configuration from the existing TATEL Stripe integration.
// This is intentionally bundled; the Stripe secret key stays in the worker.
const TATEL_STRIPE_PUBLISHABLE_KEY = "pk_live_51P50O1RqnFhvQ1qEBELZk9XfOdRo0XUQrKZ7WG5CbVnHoDqF5kGfc7onZRHkzdPomxTGCSX15olepyniKeT27Lar006bkLKqZE";

export function passTier(value: string | null | undefined): PassTier | null {
  if (value === "beach" || value === "boat" || value === "vip") return value;
  return null;
}

export function stripePublishableKey(): string {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || TATEL_STRIPE_PUBLISHABLE_KEY;
}

export function canEmbedCheckout(key = stripePublishableKey()): boolean {
  return /^pk_(live|test)_[A-Za-z0-9]+$/.test(key);
}

/** VIP is eight shares at the $5,000 price. Guests pay those shares on a group booking. */
export function passOffer(id: string, price: string): { guests: string; total: string } {
  if (id === "vip") return { guests: "8 guests", total: "$40,000 total" };
  return { guests: "1 guest", total: price };
}

export type PassTier = "beach" | "boat" | "vip";

export const CHECKOUT_SOON = "Checkout opening soon";

export function passTier(value: string | null | undefined): PassTier | null {
  if (value === "beach" || value === "boat" || value === "vip") return value;
  return null;
}

export function stripePublishableKey(): string {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function canEmbedCheckout(key = stripePublishableKey()): boolean {
  return key.startsWith("pk_");
}

/** VIP is eight shares at the $5,000 price. Guests pay those shares on a group booking. */
export function passOffer(id: string, price: string): { guests: string; total: string } {
  if (id === "vip") return { guests: "8 guests", total: "$40,000 total" };
  return { guests: "1 guest", total: price };
}

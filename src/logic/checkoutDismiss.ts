export const CHECKOUT_HISTORY_KEY = "tatelCheckout";

let activeCheckout: { destroy: () => void } | null = null;

export function withCheckoutMarker(state: unknown): Record<string, unknown> {
  const base = state && typeof state === "object" ? { ...(state as Record<string, unknown>) } : {};
  return { ...base, [CHECKOUT_HISTORY_KEY]: true };
}

export function hasCheckoutMarker(state: unknown): boolean {
  return Boolean(state && typeof state === "object" && (state as Record<string, unknown>)[CHECKOUT_HISTORY_KEY] === true);
}

/** Back pops our history entry. If that entry is already gone, close directly. */
export function checkoutDismissPlan(state: unknown): "history" | "direct" {
  return hasCheckoutMarker(state) ? "history" : "direct";
}

/**
 * One embedded checkout at a time. Replacing or clearing destroys the previous
 * page so the next open can mount a fresh one.
 */
export function holdCheckout<T extends { destroy: () => void }>(next: T | null): T | null {
  const previous = activeCheckout;
  activeCheckout = next;
  if (previous && previous !== next) {
    try {
      previous.destroy();
    } catch {
      // Stripe throws when this page was already destroyed.
    }
  }
  return next;
}

export function resetCheckoutHolder(): void {
  activeCheckout = null;
}

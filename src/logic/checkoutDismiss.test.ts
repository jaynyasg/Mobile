import { describe, expect, it } from "vitest";
import {
  checkoutDismissPlan,
  hasCheckoutMarker,
  holdCheckout,
  resetCheckoutHolder,
  withCheckoutMarker,
} from "./checkoutDismiss";

describe("checkout dismiss", () => {
  it("adds a history marker so Back closes checkout instead of leaving the app", () => {
    const marked = withCheckoutMarker({ index: 2 });
    expect(marked).toMatchObject({ index: 2, tatelCheckout: true });
    expect(hasCheckoutMarker(marked)).toBe(true);
    expect(hasCheckoutMarker(null)).toBe(false);
    expect(hasCheckoutMarker({})).toBe(false);
    expect(checkoutDismissPlan(marked)).toBe("history");
    expect(checkoutDismissPlan({})).toBe("direct");
  });

  it("destroys the previous embedded checkout before a new one mounts", () => {
    resetCheckoutHolder();
    const calls: string[] = [];
    const first = { destroy: () => calls.push("first") };
    const second = { destroy: () => calls.push("second") };
    holdCheckout(first);
    holdCheckout(second);
    expect(calls).toEqual(["first"]);
    holdCheckout(second);
    expect(calls).toEqual(["first"]);
    holdCheckout(null);
    expect(calls).toEqual(["first", "second"]);
    const broken = {
      destroy: () => {
        throw new Error("already destroyed");
      },
    };
    holdCheckout(broken);
    expect(() => holdCheckout(null)).not.toThrow();
    resetCheckoutHolder();
  });
});

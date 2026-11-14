import { describe, expect, it } from "vitest";
import { OWNED_PASS_KEY, readOwnedPass, writeOwnedPass, type OwnedPassStore } from "./ownedPass";

function memory(): OwnedPassStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("owned pass", () => {
  it("remembers a beach, boat, or vip pass on the existing key", () => {
    const store = memory();
    expect(readOwnedPass(store)).toBeNull();
    writeOwnedPass(store, "boat");
    expect(store.values.get(OWNED_PASS_KEY)).toBe("boat");
    expect(readOwnedPass(store)).toBe("boat");
    writeOwnedPass(store, "vip");
    expect(readOwnedPass(store)).toBe("vip");
  });

  it("ignores a missing store and an unknown value", () => {
    expect(readOwnedPass(null)).toBeNull();
    writeOwnedPass(null, "beach");
    const store = memory();
    store.setItem(OWNED_PASS_KEY, "gallery");
    expect(readOwnedPass(store)).toBeNull();
  });
});

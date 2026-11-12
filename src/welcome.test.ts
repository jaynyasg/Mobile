import { describe, expect, it } from "vitest";
import { WELCOME_KEY, hasSeenWelcome, markWelcomeSeen } from "./welcome";

function memory() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("first-visit welcome", () => {
  it("shows until the visit is stored, then stays dismissed", () => {
    const storage = memory();
    expect(hasSeenWelcome(storage)).toBe(false);
    expect(hasSeenWelcome(null)).toBe(false);
    markWelcomeSeen(storage);
    expect(storage.values.get(WELCOME_KEY)).toBe("1");
    expect(hasSeenWelcome(storage)).toBe(true);
    markWelcomeSeen(null);
  });
});

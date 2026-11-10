import { describe, expect, it } from "vitest";
import { canModerate, canParticipate, canRemove } from "./access";

describe("community access", () => {
  it("lets any signed-in person take part and nobody else", () => {
    expect(canParticipate(null)).toBe(false);
    expect(canParticipate(undefined)).toBe(false);
    expect(canParticipate("")).toBe(false);
    expect(canParticipate("user-1")).toBe(true);
  });

  it("lets people remove their own items and staff remove anything", () => {
    expect(canRemove("author", "author", false)).toBe(true);
    expect(canRemove("author", "other", false)).toBe(false);
    expect(canRemove("author", "other", true)).toBe(true);
    expect(canModerate(false)).toBe(false);
    expect(canModerate(true)).toBe(true);
  });
});

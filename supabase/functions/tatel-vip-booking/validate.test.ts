import { describe, expect, it } from "vitest";
import { invalidBookingField } from "./validate";

describe("VIP booking payload checks", () => {
  it("accepts a uuid and an ISO time, and rejects a cast that would fail in SQL", () => {
    expect(invalidBookingField({
      bookingId: "11111111-1111-4111-8111-111111111111",
      expiresAt: "2026-11-14T01:57:00.000Z",
    })).toBeNull();
    expect(invalidBookingField({})).toBeNull();
    expect(invalidBookingField({ bookingId: "" })).toBeNull();
    expect(invalidBookingField({ bookingId: "not-a-uuid" })).toBe("bookingId");
    expect(invalidBookingField({ expiresAt: "tomorrow" })).toBe("expiresAt");
    expect(invalidBookingField({ expiresAt: 1763089020 })).toBe("expiresAt");
  });
});

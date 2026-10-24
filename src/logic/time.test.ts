import { describe, expect, it } from "vitest";
import { clockParts, formatRange, sameClock, zoneAbbrev } from "./time";

const opening = "2026-11-10T17:15:00.000Z";
const closing = "2026-11-10T18:00:00.000Z";

describe("event and local clocks", () => {
  it("formats Pacific time for a November morning", () => {
    expect(clockParts(opening, "America/Los_Angeles")).toEqual({ time: "9:15", daypart: "AM" });
    expect(zoneAbbrev(opening, "America/Los_Angeles")).toBe("PST");
    expect(formatRange(opening, closing, "America/Los_Angeles")).toBe("9:15 – 10:00 AM PST");
  });

  it("formats a different local zone for the same instant", () => {
    expect(clockParts(opening, "America/New_York")).toEqual({ time: "12:15", daypart: "PM" });
    expect(formatRange(opening, closing, "America/New_York")).toBe("12:15 – 1:00 PM EST");
    expect(sameClock(opening, "America/Los_Angeles", "America/New_York")).toBe(false);
    expect(sameClock(opening, "America/Los_Angeles", "America/Los_Angeles")).toBe(true);
  });
});

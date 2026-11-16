import { describe, expect, it } from "vitest";
import { OFFICIAL_BVI_FERRY_URL, OFFICIAL_USVI_FERRY_URL, adviceForSession, catchFerry, ferryLegs } from "./ferrySchedule";

describe("public ferry schedules", () => {
  it("cites the operator pages and does not pretend January 2027 is published", () => {
    const redHook = ferryLegs.find((leg) => leg.id === "red-hook-cruz");
    const downtown = ferryLegs.find((leg) => leg.id === "charlotte-cruz");
    const jost = ferryLegs.find((leg) => leg.id === "west-end-jost");
    expect(redHook?.departures).toContain("8:00am");
    expect(redHook?.crossingMinutes).toBe(20);
    expect(redHook?.asOf).toMatch(/November 1, 2026/);
    expect(redHook?.asOf).toMatch(/Subject to change/);
    expect(redHook?.sourceUrl).toBe(OFFICIAL_USVI_FERRY_URL);
    expect(downtown?.sourceUrl).toBe(OFFICIAL_USVI_FERRY_URL);
    expect(downtown?.departures).toEqual(["10:00am", "12:30pm"]);
    expect(downtown?.crossingMinutes).toBeNull();
    expect(jost?.operator).toMatch(/New Horizon/);
    expect(jost?.departures).toContain("8:00am");
    expect(jost?.sourceUrl).toBe(OFFICIAL_BVI_FERRY_URL);
    expect(jost?.asOf).toMatch(/Subject to change/);
    const bvi = ferryLegs.filter((leg) => leg.island === "Tortola" || leg.island === "Virgin Gorda" || leg.island === "Jost Van Dyke" || leg.island === "Scrub Island");
    expect(bvi.every((leg) => leg.sourceUrl === OFFICIAL_BVI_FERRY_URL)).toBe(true);
    expect(ferryLegs.find((leg) => leg.id === "charlotte-virgin-gorda")?.departures).toEqual(["4:00pm Saturday"]);
    expect(ferryLegs.every((leg) => leg.sourceUrl.startsWith("https://"))).toBe(true);
    expect(ferryLegs.map((leg) => leg.asOf).join(" ")).not.toMatch(/reserved January 26/);
  });

  it("flags a downtown boat that cannot make a 9:00am St. John session", () => {
    const downtown = ferryLegs.find((leg) => leg.id === "charlotte-cruz");
    expect(catchFerry(9 * 60, downtown!)).toBeNull();
    const advice = adviceForSession({
      id: "sj",
      title: "Morning on St. John",
      island: "St. John",
      dayId: "2027-01-26",
      start: "2027-01-26T09:00:00-04:00",
    });
    expect(advice.missed.some((line) => line.includes("Charlotte Amalie"))).toBe(true);
    expect(advice.catches.some((item) => item.from.includes("Red Hook"))).toBe(true);
  });

  it("calls the only pre-9:00 Jost boat tight because the crossing is not printed", () => {
    const advice = adviceForSession({
      id: "jost",
      title: "Morning on Jost",
      island: "Jost Van Dyke",
      dayId: "2027-01-26",
      start: "2027-01-26T09:00:00-04:00",
    });
    expect(advice.catches[0]?.depart).toBe("8:00am");
    expect(advice.catches[0]?.status).toBe("tight");
    expect(advice.catches[0]?.operator).toMatch(/New Horizon/);
  });
});

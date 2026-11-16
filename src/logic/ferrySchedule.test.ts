import { describe, expect, it } from "vitest";
import { OFFICIAL_BVI_FERRY_URL, OFFICIAL_USVI_FERRY_URL, SCRUB_FERRY_LABEL, SCRUB_FERRY_PHONE, SCRUB_FERRY_URL, adviceForSession, catchFerry, ferryLegs } from "./ferrySchedule";

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
    const bvi = ferryLegs.filter((leg) => leg.island === "Tortola" || leg.island === "Virgin Gorda" || leg.island === "Jost Van Dyke");
    expect(bvi.every((leg) => leg.sourceUrl === OFFICIAL_BVI_FERRY_URL)).toBe(true);
    const toScrub = ferryLegs.find((leg) => leg.id === "trellis-scrub");
    const fromScrub = ferryLegs.find((leg) => leg.id === "scrub-trellis");
    expect(toScrub?.days).toBe(SCRUB_FERRY_LABEL);
    expect(toScrub?.crossingMinutes).toBe(10);
    expect(toScrub?.sourceUrl).toBe(SCRUB_FERRY_URL);
    expect(toScrub?.phone).toBe(SCRUB_FERRY_PHONE);
    expect(toScrub?.departures).toEqual(["5:45am", "6:45am", "7:45am", "8:45am", "9:45am", "11:45am", "1:45pm", "2:45pm", "3:45pm", "4:45pm", "5:45pm", "7:45pm", "9:45pm", "10:45pm"]);
    expect(toScrub?.departures).not.toContain("10:45am");
    expect(fromScrub?.departures).toEqual(["6:30am", "7:30am", "8:30am", "9:30am", "11:30am", "1:30pm", "2:30pm", "3:30pm", "4:30pm", "5:30pm", "7:30pm", "9:30pm", "10:30pm"]);
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

  it("uses the resort guest ferry, not the hourly BVI line, for a Scrub Island session", () => {
    const advice = adviceForSession({
      id: "scrub",
      title: "Morning on Scrub",
      island: "Scrub Island",
      dayId: "2027-01-26",
      start: "2027-01-26T11:00:00-04:00",
    });
    expect(advice.catches.map((item) => item.depart)).toEqual(["9:45am"]);
    expect(advice.catches[0]?.status).toBe("ok");
    expect(advice.catches[0]?.line).toMatch(/10 minutes/);
    const earlier = adviceForSession({
      id: "scrub-earlier",
      title: "Earlier on Scrub",
      island: "Scrub Island",
      dayId: "2027-01-26",
      start: "2027-01-26T10:15:00-04:00",
    });
    expect(earlier.catches[0]?.depart).toBe("8:45am");
    expect(earlier.catches[0]?.status).toBe("ok");
  });
});

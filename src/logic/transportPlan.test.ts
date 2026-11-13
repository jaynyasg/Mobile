import { describe, expect, it } from "vitest";
import { sessions, transport } from "@/content";
import {
  legEnds,
  modeLabel,
  routeStops,
  routeSummary,
  underwayMinutes,
} from "./transportPlan";

const lookup = (id: string) => sessions.find((session) => session.id === id);

describe("transport plan", () => {
  it("reads a departure from the leg title", () => {
    expect(legEnds("St. Thomas → Lovango")).toEqual({ from: "St. Thomas", to: "Lovango" });
    expect(legEnds("Jost → West End → Trellis Bay → Scrub")).toEqual({ from: "Jost", to: "Scrub" });
    expect(legEnds("St. John → Jost Van Dyke · international").to).toBe("Jost Van Dyke");
  });

  it("uses only the minutes the sentence states as underway", () => {
    expect(underwayMinutes("Estimated 30–55 minutes total: 15–30 on the water plus 15–25 for boarding.")).toEqual([15, 30]);
    expect(underwayMinutes("Estimate 60–110+ minutes including 25–40 underway, 20–45+ for clearance.")).toEqual([25, 40]);
    expect(underwayMinutes("Published resort departure; 15–30-minute crossing.")).toEqual([15, 30]);
    expect(underwayMinutes("Published resort departure and approximately 10-minute crossing.")).toEqual([10, 10]);
    expect(underwayMinutes("Estimate 2h20–3h underway plus 30–60 minutes berthing.")).toEqual([140, 180]);
    expect(underwayMinutes("Allow 2h50–4h including sailing and shore access.")).toBeNull();
  });

  it("pairs each featured stop with the legs that reach it", () => {
    const day = transport.modes[0].days[0];
    const stops = routeStops(day, lookup, () => "9:00 – 9:45 AM AST");
    expect(stops.map((stop) => stop.sessionId)).toEqual([
      "F-TECH-A-D1",
      "F-LAW-A-D1",
      "F-AI-A-D1",
      "F-ENT-A-D1",
      "F-TRAVEL-A-D1",
    ]);
    expect(stops[0].legs).toEqual([]);
    expect(stops[0].island).toBe("St. Thomas");
    expect(stops[0].status).toBe("Proposed");
    expect(stops[1].legs[0]?.from).toBe("St. Thomas");
    expect(stops[1].legs[0]?.time).toBe("9:45–10:40am");
    expect(stops.map((stop) => stop.number)).toEqual([1, 2, 3, 4, 5]);
    const islands = stops.map((stop) => stop.island ?? "");
    expect(routeSummary(1, day.items, islands)).toBe("Day 1 · 5 islands · 90–145 min underway");
  });

  it("keeps a crossing that does not end at a featured stop", () => {
    const yacht = transport.modes.find((mode) => mode.id === "yacht");
    const day = yacht?.days[0];
    expect(day).toBeTruthy();
    const stops = routeStops(day!, lookup, () => "time");
    expect(stops.at(-1)?.sessionId).toBeNull();
    expect(stops.at(-1)?.legs[0]?.from).toBe("Lovango");
  });

  it("names the three sample modes", () => {
    expect(transport.modes.map(modeLabel)).toEqual(["Powerboat", "Ferries & launches", "Yacht"]);
  });
});

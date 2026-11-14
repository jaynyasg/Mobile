import { describe, expect, it } from "vitest";
import { sessions, transport } from "@/content";
import {
  ARRIVE_BUFFER,
  buildRoute,
  canCreateRoute,
  clockMinutes,
  describeStop,
  formatClock,
  readCreatedRoute,
  readRouteMode,
  readRoutePlan,
  routePicker,
  routePins,
  writeCreatedRoute,
  writeRouteMode,
  writeRoutePlan,
  type PlanSession,
  type RouteStore,
} from "./customRoute";

function memory(): RouteStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function plan(partial: Partial<PlanSession> & Pick<PlanSession, "id" | "dayId" | "island">): PlanSession {
  return {
    title: partial.id,
    start: null,
    end: null,
    ...partial,
  };
}

describe("custom route", () => {
  it("remembers the picked sessions on this device", () => {
    const store = memory();
    expect(readRoutePlan(store)).toBeNull();
    writeRoutePlan(store, ["F-TECH-A-D1", "F-LAW-A-D1"]);
    expect(readRoutePlan(store)).toEqual(["F-TECH-A-D1", "F-LAW-A-D1"]);
    expect(readRoutePlan({ getItem: () => "nope", setItem: () => undefined })).toBeNull();
    writeRouteMode(store, "yacht");
    expect(readRouteMode(store)).toBe("yacht");
    expect(readRouteMode({ getItem: () => "  ", setItem: () => undefined })).toBeNull();
  });

  it("orders picks by day and time and uses a published crossing", () => {
    const tech = sessions.find((session) => session.id === "F-TECH-A-D1");
    const law = sessions.find((session) => session.id === "F-LAW-A-D1");
    expect(tech && law).toBeTruthy();
    const days = buildRoute(
      [
        { id: law!.id, title: law!.title, dayId: law!.dayId, start: law!.start, end: law!.end, island: law!.island },
        { id: tech!.id, title: tech!.title, dayId: tech!.dayId, start: tech!.start, end: tech!.end, island: tech!.island },
      ],
      transport.modes,
    );
    expect(days.map((day) => day.dayId)).toEqual(["2027-01-26"]);
    expect(days[0].stops.map((stop) => stop.session.id)).toEqual(["F-TECH-A-D1", "F-LAW-A-D1"]);
    const leg = days[0].stops[1].leg;
    expect(leg?.from).toBe("St. Thomas");
    expect(leg?.to).toBe("Lovango");
    expect(leg?.mode).toBe("Powerboat");
    expect(leg?.duration).toBe("15–30 min");
    expect(leg?.estimated).toBe(false);
    expect(leg?.tight).toBe(false);
    expect(leg?.depart).toBe("10:10 AM");
    expect(leg?.arrive).toBe("10:40 AM");
    expect(days[0].stops[1].clash).toBe(false);
  });

  it("flags a clash, a tight connection, and an estimate", () => {
    const days = buildRoute(
      [
        plan({ id: "a", dayId: "2027-01-26", island: "St. Thomas", start: "2027-01-26T09:00:00-04:00", end: "2027-01-26T11:00:00-04:00" }),
        plan({ id: "b", dayId: "2027-01-26", island: "St. Thomas", start: "2027-01-26T10:00:00-04:00", end: "2027-01-26T10:30:00-04:00" }),
        plan({ id: "c", dayId: "2027-01-26", island: "Anegada", start: "2027-01-26T10:40:00-04:00", end: "2027-01-26T11:10:00-04:00" }),
        plan({ id: "d", dayId: "2027-01-27", island: "St. John", start: "2027-01-27T09:00:00-04:00", end: "2027-01-27T09:30:00-04:00" }),
        plan({ id: "e", dayId: "2027-01-27", island: "Jost Van Dyke", start: "2027-01-27T09:50:00-04:00", end: "2027-01-27T10:30:00-04:00" }),
      ],
      transport.modes,
    );
    expect(days.map((day) => day.dayId)).toEqual(["2027-01-26", "2027-01-27"]);
    const first = days[0].stops;
    expect(first[1].leg).toBeNull();
    expect(first[1].clash).toBe(true);
    expect(first[2].leg?.estimated).toBe(true);
    expect(first[2].leg?.mode).toBe("Water taxi");
    expect(first[2].leg?.duration).toBe("45–75 min");
    const hop = days[1].stops[1].leg;
    expect(hop?.from).toBe("St. John");
    expect(hop?.to).toBe("Jost Van Dyke");
    expect(hop?.tight).toBe(true);
    expect(hop?.estimated).toBe(false);
    expect(clockMinutes("2027-01-26T09:45:00-04:00")).toBe(9 * 60 + 45);
    expect(formatClock(10 * 60 + 10)).toBe("10:10 AM");
    expect(ARRIVE_BUFFER).toBe(20);
  });

  it("uses the chosen boat for published times and for estimates", () => {
    const tech = sessions.find((session) => session.id === "F-TECH-A-D1");
    const law = sessions.find((session) => session.id === "F-LAW-A-D1");
    const picks = [tech, law].map((session) => ({
      id: session!.id,
      title: session!.title,
      dayId: session!.dayId,
      start: session!.start,
      end: session!.end,
      island: session!.island,
    }));
    const power = buildRoute(picks, transport.modes, ARRIVE_BUFFER, "powerboat");
    const yacht = buildRoute(picks, transport.modes, ARRIVE_BUFFER, "yacht");
    expect(power[0].stops[1].leg?.mode).toBe("Powerboat");
    expect(power[0].stops[1].leg?.duration).toBe("15–30 min");
    expect(power[0].stops[1].leg?.estimated).toBe(false);
    expect(yacht[0].stops[1].leg?.mode).toBe("Yacht");
    expect(yacht[0].stops[1].leg?.duration).toBe("30–60 min");
    expect(yacht[0].stops[1].leg?.estimated).toBe(false);
    const unknown = buildRoute(
      [
        plan({ id: "a", dayId: "2027-01-26", island: "St. Thomas", start: "2027-01-26T09:00:00-04:00", end: "2027-01-26T09:30:00-04:00" }),
        plan({ id: "b", dayId: "2027-01-26", island: "Anegada", start: "2027-01-26T12:00:00-04:00", end: "2027-01-26T12:30:00-04:00" }),
      ],
      transport.modes,
      ARRIVE_BUFFER,
      "ferry",
    );
    expect(unknown[0].stops[1].leg?.mode).toBe("Ferries & launches");
    expect(unknown[0].stops[1].leg?.estimated).toBe(true);
    expect(unknown[0].stops[1].leg?.duration).toBe("45–75 min");
  });

  it("explains the created route in order and remembers it", () => {
    expect(canCreateRoute(null)).toBe(false);
    expect(canCreateRoute([])).toBe(false);
    expect(canCreateRoute(["F-TECH-A-D1"])).toBe(true);
    const store = memory();
    writeCreatedRoute(store, { ids: ["F-TECH-A-D1", "F-LAW-A-D1"], modeId: "yacht" });
    expect(readCreatedRoute(store)).toEqual({ ids: ["F-TECH-A-D1", "F-LAW-A-D1"], modeId: "yacht" });
    expect(readCreatedRoute({ getItem: () => "{", setItem: () => undefined })).toBeNull();
    const tech = sessions.find((session) => session.id === "F-TECH-A-D1");
    const law = sessions.find((session) => session.id === "F-LAW-A-D1");
    const days = buildRoute(
      [tech, law].map((session) => ({
        id: session!.id,
        title: session!.title,
        dayId: session!.dayId,
        start: session!.start,
        end: session!.end,
        island: session!.island,
      })),
      transport.modes,
      ARRIVE_BUFFER,
      "powerboat",
    );
    const pins = routePins(days);
    expect(pins.map((pin) => pin.n)).toEqual([1, 2]);
    expect(pins[0].island).toBe("St. Thomas");
    expect(pins[1].x).toBeGreaterThan(pins[0].x);
    const placed = routePins([
      {
        dayId: "2027-01-26",
        stops: ["Jost Van Dyke", "Lovango", "St. John"].map((island, index) => ({
          session: plan({ id: String(index), dayId: "2027-01-26", island, start: `2027-01-26T0${index}:00:00-04:00` }),
          leg: null,
          clash: false,
        })),
      },
    ]);
    const jost = placed.find((pin) => pin.island === "Jost Van Dyke");
    expect(jost && jost.x).toBeGreaterThan(0.54);
    expect(jost && jost.y).toBeLessThan(0.56);
    expect(placed.find((pin) => pin.island === "Lovango")?.y).toBeGreaterThan(0.68);
    expect(placed.find((pin) => pin.island === "St. John")?.x).toBeGreaterThan(0.48);
    const first = describeStop(days[0].stops[0], "9:00 – 9:45 AM AST", tech!.title);
    expect(first[0]).toBe("Start at St. Thomas.");
    expect(first.join(" ")).toContain(tech!.title);
    expect(first.join(" ")).toContain("20 minutes early");
    const hop = describeStop(days[0].stops[1], "11:00 – 11:45 AM AST", law!.title);
    expect(hop[0]).toBe("Leave St. Thomas by 10:10 AM.");
    expect(hop[1]).toContain("Powerboat");
    expect(hop[1]).toContain("15–30 min");
    expect(hop[2]).toContain("Arrive by 10:40 AM");
    expect(hop[2]).toContain("20 minutes before");
    expect(hop[3]).toContain(law!.title);
    const tight = buildRoute(
      [
        plan({ id: "d", dayId: "2027-01-27", island: "St. John", start: "2027-01-27T09:00:00-04:00", end: "2027-01-27T09:30:00-04:00" }),
        plan({ id: "e", dayId: "2027-01-27", island: "Jost Van Dyke", start: "2027-01-27T09:50:00-04:00", end: "2027-01-27T10:30:00-04:00" }),
      ],
      transport.modes,
    );
    const warning = describeStop(tight[0].stops[1], "9:50 AM", "Next");
    expect(warning.join(" ")).toContain("Tight connection.");
    const clash = buildRoute(
      [
        plan({ id: "a", dayId: "2027-01-26", island: "St. Thomas", start: "2027-01-26T09:00:00-04:00", end: "2027-01-26T11:00:00-04:00" }),
        plan({ id: "b", dayId: "2027-01-26", island: "St. Thomas", start: "2027-01-26T10:00:00-04:00", end: "2027-01-26T10:30:00-04:00" }),
      ],
      transport.modes,
    );
    expect(describeStop(clash[0].stops[1], "10:00 AM", "Overlap").join(" ")).toContain("These overlap.");
  });

  it("filters the session picker by day and island", () => {
    const items = [
      { id: "a", dayId: "2027-01-26", island: "St. Thomas" },
      { id: "b", dayId: "2027-01-26", island: "Lovango" },
      { id: "c", dayId: "2027-01-27", island: "St. Thomas" },
    ];
    expect(routePicker(items, "2027-01-26", "St. Thomas").map((item) => item.id)).toEqual(["a"]);
    expect(routePicker(items, "2027-01-26", "all").map((item) => item.id)).toEqual(["a", "b"]);
    expect(routePicker(items, "2027-01-26", ["St. Thomas", "Lovango"]).map((item) => item.id)).toEqual(["a", "b"]);
    expect(routePicker(items, "2027-01-26", [])).toEqual([]);
  });

  it("skips a crossing when the next session stays on the island", () => {
    const days = buildRoute(
      [
        plan({ id: "a", dayId: "2027-01-28", island: "Scrub Island", start: "2027-01-28T09:00:00-04:00", end: "2027-01-28T09:45:00-04:00" }),
        plan({ id: "b", dayId: "2027-01-28", island: "Scrub Island", start: "2027-01-28T11:00:00-04:00", end: "2027-01-28T11:45:00-04:00" }),
      ],
      [],
    );
    expect(days[0].stops[1].leg).toBeNull();
    expect(days[0].stops[1].clash).toBe(false);
  });
});

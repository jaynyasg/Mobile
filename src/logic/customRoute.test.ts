import { describe, expect, it } from "vitest";
import { sessions, transport } from "@/content";
import {
  ARRIVE_BUFFER,
  buildRoute,
  clockMinutes,
  formatClock,
  readRoutePlan,
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

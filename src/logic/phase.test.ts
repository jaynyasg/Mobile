import { describe, expect, it } from "vitest";
import { forumPhase, phaseLabel } from "./phase";

describe("forum phase", () => {
  it("counts days until opening in Pacific time", () => {
    expect(forumPhase(new Date("2026-10-24T19:00:00Z"))).toEqual({ phase: "upcoming", daysUntil: 17 });
    expect(forumPhase(new Date("2026-10-24T06:00:00Z"))).toEqual({ phase: "upcoming", daysUntil: 18 });
    expect(phaseLabel({ phase: "upcoming", daysUntil: 1 })).toBe("Doors open tomorrow");
  });

  it("knows when the hall is open and when it has closed", () => {
    expect(forumPhase(new Date("2026-11-10T18:00:00Z")).phase).toBe("live");
    expect(forumPhase(new Date("2026-11-13T18:00:00Z")).phase).toBe("ended");
  });
});

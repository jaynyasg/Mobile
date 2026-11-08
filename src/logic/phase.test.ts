import { describe, expect, it } from "vitest";
import { forumPhase, phaseLabel } from "./phase";

describe("summit phase", () => {
  it("counts days until opening in Atlantic time", () => {
    expect(forumPhase(new Date("2027-01-25T16:00:00Z"))).toEqual({ phase: "upcoming", daysUntil: 1 });
    expect(phaseLabel({ phase: "upcoming", daysUntil: 1 })).toBe("The summit opens tomorrow");
  });

  it("knows when the dates are open and when they have closed", () => {
    expect(forumPhase(new Date("2027-01-26T15:00:00Z")).phase).toBe("live");
    expect(forumPhase(new Date("2027-01-30T04:00:00Z")).phase).toBe("ended");
  });
});

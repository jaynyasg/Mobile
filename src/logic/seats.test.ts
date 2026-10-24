import { describe, expect, it } from "vitest";
import { sessions } from "../content";
import { canSaveSeat, seatsRemaining } from "./seats";

describe("seat capacity", () => {
  it("refuses a full room and a seat the person already holds", () => {
    const full = sessions.find((session) => session.id === "rules-machine");
    expect(full).toBeTruthy();
    if (!full) return;
    expect(canSaveSeat(full, false)).toBe(false);
    expect(seatsRemaining(full, false)).toBe(0);
  });

  it("counts the local hold against the remaining seats", () => {
    const tight = sessions.find((session) => session.id === "pricing-unbundle");
    expect(tight).toBeTruthy();
    if (!tight) return;
    expect(canSaveSeat(tight, false)).toBe(true);
    expect(seatsRemaining(tight, false)).toBe(2);
    expect(seatsRemaining(tight, true)).toBe(1);
    expect(canSaveSeat(tight, true)).toBe(false);
  });

  it("does not offer seats for meals", () => {
    const lunch = sessions.find((session) => session.id === "lunch-tue");
    expect(lunch).toBeTruthy();
    if (!lunch) return;
    expect(canSaveSeat(lunch, false)).toBe(false);
  });
});

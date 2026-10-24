import { describe, expect, it } from "vitest";
import { sessions } from "../content";
import { blankState, initialState, reducer } from "./state";

describe("personal data", () => {
  it("will not hold a seat in a full room", () => {
    const full = sessions.find((session) => session.id === "rules-machine");
    expect(full).toBeTruthy();
    if (!full) return;
    const next = reducer(initialState(), { type: "toggleSeat", session: full });
    expect(next.heldSeatIds).toEqual([]);
  });

  it("saves and releases a seat that still has room", () => {
    const session = sessions.find((item) => item.id === "pricing-unbundle");
    expect(session).toBeTruthy();
    if (!session) return;
    const held = reducer(initialState(), { type: "toggleSeat", session });
    expect(held.heldSeatIds).toEqual(["pricing-unbundle"]);
    const released = reducer(held, { type: "toggleSeat", session });
    expect(released.heldSeatIds).toEqual([]);
  });

  it("deletes messages, seats, and the profile", () => {
    let state = initialState();
    const session = sessions.find((item) => item.id === "keynote-attention");
    expect(session).toBeTruthy();
    if (!session) return;
    state = reducer(state, { type: "toggleFavorite", id: "closing" });
    state = reducer(state, { type: "toggleSeat", session });
    state = reducer(state, { type: "setNetworkingOptIn", value: true });
    expect(state.threads["samira-qureshi"]?.length).toBe(1);
    const cleared = reducer(state, { type: "deleteAllData" });
    expect(cleared).toEqual(blankState());
    expect(cleared.profile.name).toBe("");
    expect(cleared.threads).toEqual({});
  });
});

import { describe, expect, it } from "vitest";
import { blankState, initialState, reducer } from "./state";

describe("personal data", () => {
  it("saves and clears a favorite", () => {
    const held = reducer(initialState(), { type: "toggleFavorite", id: "T1-D1" });
    expect(held.favoriteIds).toEqual(["T1-D1"]);
    const released = reducer(held, { type: "toggleFavorite", id: "T1-D1" });
    expect(released.favoriteIds).toEqual([]);
  });

  it("keeps a local note and then deletes personal data", () => {
    let state = reducer(initialState(), { type: "setNetworkingOptIn", value: true });
    state = reducer(state, {
      type: "sendMessage",
      panelistId: "malik-elizee",
      message: { id: "local-1", from: "you", text: "Hello", at: "2027-01-01T00:00:00-04:00" },
    });
    expect(state.threads["malik-elizee"]).toHaveLength(1);
    const cleared = reducer(state, { type: "deleteAllData" });
    expect(cleared).toEqual(blankState());
    expect(cleared.profile.name).toBe("");
    expect(cleared.networkingOptIn).toBe(false);
  });
});

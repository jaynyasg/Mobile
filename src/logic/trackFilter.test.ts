import { describe, expect, it } from "vitest";
import { forum } from "../content";
import { activeTrackIds, islandsForTracks, sameIslands } from "./trackFilter";

describe("infrastructure picks", () => {
  it("keeps a partial pick and ignores an empty or complete one", () => {
    expect(activeTrackIds([], forum.pillars)).toEqual([]);
    expect(activeTrackIds(["nope"], forum.pillars)).toEqual([]);
    expect(activeTrackIds(forum.pillars.map((pillar) => pillar.id), forum.pillars)).toEqual([]);
    expect(activeTrackIds(["law", "tech", "tech"], forum.pillars)).toEqual(["tech", "law"]);
  });

  it("maps picked areas to their islands, in pillar order", () => {
    expect(islandsForTracks(["law", "ai"], forum.pillars)).toEqual(["St. John", "Lovango"]);
    expect(islandsForTracks([], forum.pillars)).toEqual([]);
    expect(sameIslands(["Lovango", "St. John"], ["St. John", "Lovango"])).toBe(true);
    expect(sameIslands(["St. John"], ["St. John", "Lovango"])).toBe(false);
  });
});

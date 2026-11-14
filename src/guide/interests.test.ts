import { describe, expect, it } from "vitest";
import { essentials } from "./essentials";
import { markUnlockSeen, readTracks, unlockSeen, writeTracks, type TrackStore } from "./interests";

function memory(): TrackStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("tracks and essentials", () => {
  it("stores the chosen tracks and the unlock", () => {
    const store = memory();
    expect(readTracks(store)).toEqual([]);
    writeTracks(store, ["tech", "ai", "tech"]);
    expect(readTracks(store)).toEqual(["tech", "ai"]);
    expect(unlockSeen(store)).toBe(false);
    markUnlockSeen(store);
    expect(unlockSeen(store)).toBe(true);
  });

  it("keeps every essential short and sourced", () => {
    expect(essentials.length).toBeGreaterThanOrEqual(8);
    for (const item of essentials) {
      expect(item.line.length).toBeLessThan(90);
      expect(item.sources.length).toBeGreaterThan(0);
      expect(item.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    }
  });
});

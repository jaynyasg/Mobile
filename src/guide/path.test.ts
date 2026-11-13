import { describe, expect, it } from "vitest";
import { firstUnfinished, guideSteps, markGuide, readGuide, stepDone, type GuideStore } from "./path";

function memory(): GuideStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("home guide", () => {
  it("keeps the path in visitor order", () => {
    expect(guideSteps.map((step) => step.id)).toEqual([
      "welcome",
      "tracks",
      "sessions",
      "transport",
      "stay",
      "know",
      "pass",
      "chat",
    ]);
    expect(guideSteps.map((step) => step.headline).join(" ")).not.toMatch(/zone|conversation/i);
  });

  it("checks a step the visitor finished, and derives welcome, tracks, sessions, and notes", () => {
    const store = memory();
    expect(readGuide(store)).toEqual([]);
    markGuide(store, "transport");
    markGuide(store, "transport");
    expect(readGuide(store)).toEqual(["transport"]);
    const progress = {
      marked: readGuide(store),
      introPlayed: true,
      trackCount: 1,
      savedSessions: 2,
      openedNotes: true,
    };
    expect(stepDone("welcome", progress)).toBe(true);
    expect(stepDone("tracks", progress)).toBe(true);
    expect(stepDone("sessions", progress)).toBe(true);
    expect(stepDone("transport", progress)).toBe(true);
    expect(stepDone("stay", progress)).toBe(false);
    expect(stepDone("know", progress)).toBe(true);
    expect(stepDone("chat", { ...progress, marked: [] })).toBe(false);
    markGuide(null, "chat");
  });

  it("settles the tour on the first unfinished step", () => {
    expect(firstUnfinished([true, false, false])).toBe(1);
    expect(firstUnfinished([true, true, true])).toBe(0);
  });
});

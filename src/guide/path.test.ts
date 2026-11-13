import { describe, expect, it } from "vitest";
import { captionOverlapsCard, captionTop, firstUnfinished, guideSteps, hasSeenTour, markTourSeen, tourCaption, tourTitle, markGuide, readGuide, stepDone, type GuideStore } from "./path";

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

  it("names each tutorial frame and remembers that the tour finished", () => {
    expect(tourCaption(2)).toBe("Step 3 of 8 · Sessions: build your schedule");
    expect(tourTitle(6)).toBe("Passport: get your stamps");
    const store = memory();
    expect(hasSeenTour(store)).toBe(false);
    markTourSeen(store);
    expect(hasSeenTour(store)).toBe(true);
  });

  it("keeps the tour caption off the spotlighted card", () => {
    expect(captionTop(72, 400, 714)).toBe(484);
    expect(captionOverlapsCard(72, 400, 714)).toBe(false);
    expect(captionTop(280, 400, 714)).toBe(80);
    expect(captionOverlapsCard(280, 400, 714)).toBe(false);
  });
});

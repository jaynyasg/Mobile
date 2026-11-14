import { describe, expect, it } from "vitest";
import { captionOverlapsCard, captionTop, consumeWalkthrough, firstUnfinished, guideSteps, hasSeenTour, markTourSeen, requestWalkthrough, tourCaption, tourTitle, TOUR_DWELL_MS, markGuide, readGuide, stepDone, type GuideStore } from "./path";

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

  it("names each walk-through frame and remembers that it finished", () => {
    expect(tourCaption(1)).toBe("Steps Walk-through · Step 2 of 8 · Interests: pick your infrastructures");
    expect(tourCaption(2)).toBe("Steps Walk-through · Step 3 of 8 · Sessions: select your session");
    expect(guideSteps[1]?.headline).toBe("Pick your infrastructures");
    expect(guideSteps[1]?.line).toContain("tailor your Sessions and route");
    expect(guideSteps[2]?.headline).toBe("Select Your Session");
    expect(tourTitle(6)).toBe("Tickets: get your pass");
    expect(guideSteps[6]?.cta).toBe("Open Tickets");
    expect(guideSteps[6]?.line).toBe("Beach, boat, or a VIP group.");
    expect(TOUR_DWELL_MS).toBeGreaterThanOrEqual(7_000);
    const store = memory();
    expect(hasSeenTour(store)).toBe(false);
    markTourSeen(store);
    expect(hasSeenTour(store)).toBe(true);
    expect(consumeWalkthrough(store)).toBe(false);
    requestWalkthrough(store);
    expect(consumeWalkthrough(store)).toBe(true);
    expect(consumeWalkthrough(store)).toBe(false);
    requestWalkthrough(null);
    expect(consumeWalkthrough(null)).toBe(false);
  });

  it("keeps the tour caption off the spotlighted card", () => {
    expect(captionTop(72, 400, 714)).toBe(484);
    expect(captionOverlapsCard(72, 400, 714)).toBe(false);
    expect(captionTop(280, 400, 714)).toBe(48);
    expect(captionOverlapsCard(280, 400, 714)).toBe(false);
  });
});

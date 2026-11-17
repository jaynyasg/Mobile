import { describe, expect, it } from "vitest";
import { forum } from "../content";
import { AREA_COPY, advanceStory, storyBackground, storyBeat, storySlides, tatelLetters } from "./tatelStory";

const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: {} });
describe("TATEL introduction", () => {
  it("explains the purpose, five topics, islands, and four days in order", () => {
    expect(slides.map((slide) => slide.id)).toEqual(["goal", "name", "mill", "method", "tech", "ai", "travel", "entertainment", "law", "needs", "arc", ...forum.days.map(day => day.id), "continuation", "islands", "people", "getaway"]);
    expect(tatelLetters(forum.pillars).map((item) => item.letter).join("")).toBe("TATEL");
    expect(slides[0].line).toMatch(/turning real island needs into technology/);
    expect(slides.find(slide => slide.id === "name")?.note).toMatch(/Learning Labs/);
    expect(slides.find((slide) => slide.kind === "islands")?.note).toMatch(/St. Croix/);
    expect(slides.filter((slide) => slide.kind === "day").map((slide) => slide.id)).toEqual(forum.days.map((day) => day.id));
  });
  it("keeps every slide readable and gives guests time to read", () => {
    for (const slide of slides) {
      expect(`${slide.line} ${slide.note}`.split(/\s+/).length).toBeLessThanOrEqual(90);
      expect(storyBeat(slide.kind)).toBeGreaterThanOrEqual(9000);
    }
    expect(new Set(Object.values(AREA_COPY).map((item) => item.body)).size).toBe(5);
    expect(advanceStory(slides.length - 1, slides.length)).toBeNull();
    expect(advanceStory(0, slides.length)).toBe(1);
  });
  it("keeps the existing film running between topic changes", () => {
    const library = { tech: { mp4: "/reels/tech.mp4" }, law: { mp4: "/reels/law.mp4" } };
    expect(storyBackground({ kind: "letter", reelId: "tech" }, null, library)).toEqual(library.tech);
    expect(storyBackground({ kind: "day" }, library.law, library)).toBe(library.law);
    expect(storyBackground({ kind: "letter", reelId: "missing" }, library.law, library)).toBe(library.law);
  });
});

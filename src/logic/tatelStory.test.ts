import { describe, expect, it } from "vitest";
import { forum } from "../content";
import { AREA_COPY, advanceStory, storyBackground, storyBeat, storySlides, tatelLetters } from "./tatelStory";

const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: {} });
describe("TATEL introduction", () => {
  it("explains the purpose, five topics, islands, and four days in order", () => {
    expect(slides.map((slide) => slide.kind)).toEqual(["goal", "name", "letter", "letter", "letter", "letter", "letter", "islands", "arc", "day", "day", "day", "day", "experience", "experience"]);
    expect(tatelLetters(forum.pillars).map((item) => item.letter).join("")).toBe("TATEL");
    expect(slides[0].line).toMatch(/local communities and global experts/);
    expect(slides[0].note).toMatch(/incubator and expert network/);
    expect(slides.find((slide) => slide.kind === "islands")?.note).toMatch(/international border/);
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

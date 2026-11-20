import { describe, expect, it } from "vitest";
import { storyChapters } from "./tatelStory";
import { reels } from "../content/reels";

describe("TATEL opening chapters", () => {
  it("uses the five guide headings in order, each with a film and still", () => {
    expect(storyChapters.map(chapter => chapter.heading)).toEqual([
      "What is TATEL?", "How panels & sessions work", "The island needs", "Schedule & where", "Why the Virgin Islands?",
    ]);
    for (const chapter of storyChapters) {
      expect(reels[chapter.film].mp4).toMatch(/\.mp4$/);
      expect(reels[chapter.film].poster).toMatch(/\.jpg$/);
      expect(`${chapter.heading} ${chapter.headline} ${chapter.caption}`.split(/\s+/).length).toBeLessThanOrEqual(40);
    }
  });
  it("retains the founders, Learning Labs and geography in untimed reading", () => {
    expect(storyChapters[0].paragraphs.join(" ")).toMatch(/1878, LLC.*Learning Labs/);
    expect(storyChapters[4].paragraphs.join(" ")).toMatch(/St. Croix.*not a summit stop/);
  });
});

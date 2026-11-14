import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chapterReelIds, reels, showIntroTitle, zoneReelIds } from "@/content/reels";
import {
  CHAPTER_KEY,
  EXPLORED_KEY,
  INTRO_DAY_KEY,
  hasSeenChapter,
  introPlayback,
  isExplored,
  localDay,
  markChapterSeen,
  markExplored,
  markIntroPlayed,
  type ReelStore,
} from "./gate";

function memory(): ReelStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const open = { reducedMotion: false, saveData: false, slow: false };

describe("reel gate", () => {
  it("plays the intro once each local day, and a poster when motion or data is limited", () => {
    const store = memory();
    const morning = new Date(2027, 0, 26, 9, 0, 0);
    expect(localDay(morning)).toBe("2027-01-26");
    expect(introPlayback(store, open, morning)).toBe("video");
    expect(introPlayback(store, { ...open, reducedMotion: true }, morning)).toBe("poster");
    expect(introPlayback(store, { ...open, saveData: true }, morning)).toBe("poster");
    expect(introPlayback(store, { ...open, slow: true }, morning)).toBe("poster");
    markIntroPlayed(store, morning);
    expect(store.values.get(INTRO_DAY_KEY)).toBe("2027-01-26");
    expect(introPlayback(store, open, morning)).toBe("skip");
    expect(introPlayback(store, open, new Date(2027, 0, 27, 8, 0, 0))).toBe("video");
  });

  it("shows a chapter once per session and keeps explored zones", () => {
    const session = memory();
    const device = memory();
    expect(hasSeenChapter(session, "sessions")).toBe(false);
    markChapterSeen(session, "sessions");
    expect(session.values.get(CHAPTER_KEY)).toContain("sessions");
    expect(hasSeenChapter(session, "sessions")).toBe(true);
    markExplored(device, "tech");
    expect(isExplored(device, "tech")).toBe(true);
    expect(device.values.get(EXPLORED_KEY)).toBe("tech");
    expect(isExplored(device, "ai")).toBe(false);
  });

  it("lists a placeholder reel for the intro, each area, and each track", () => {
    expect(reels.intro.mp4).toBe("/reels/tatel-welcome-intro.mp4");
    expect(reels.intro.poster).toBe("/reels/tatel-welcome-intro-poster.jpg");
    expect(reels.intro.durationMs).toBe(17_500);
    expect(showIntroTitle(14_000, reels.intro.durationMs)).toBe(true);
    expect(showIntroTitle(14_500, reels.intro.durationMs)).toBe(false);
    for (const id of chapterReelIds) {
      expect(reels[id].kind).toBe("chapter");
      expect(reels[id].durationMs).toBeGreaterThanOrEqual(6_000);
      expect(reels[id].durationMs).toBeLessThanOrEqual(8_000);
      expect(reels[id].mp4.startsWith("/reels/")).toBe(true);
    }
    expect(zoneReelIds.map((id) => reels[id].title)).toEqual([
      "St. Thomas · Tech",
      "St. John · AI",
      "Scrub Island · Travel",
      "Jost Van Dyke · Entertainment",
      "Lovango · Law",
    ]);
    expect(zoneReelIds.map((id) => reels[id].kicker).join(" ")).not.toMatch(/zone/i);
    expect(zoneReelIds.map((id) => reels[id].poster)).toEqual([
      "/reels/tech-poster.jpg",
      "/reels/ai-poster.jpg",
      "/reels/travel-poster.jpg",
      "/reels/entertainment-poster.jpg",
      "/reels/law-poster.jpg",
    ]);
    expect(zoneReelIds.map((id) => reels[id].zoneId)).toEqual(["tech", "ai", "travel", "entertainment", "law"]);
  });

  it("does not precache mp4 reels in the service worker", () => {
    const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
    const shell = source.slice(source.indexOf("const SHELL"), source.indexOf("];") + 2);
    expect(shell).not.toMatch(/\.mp4\b|\.webm\b/);
    expect(shell).not.toMatch(/\/reels\//);
    expect(source).toMatch(/mp4\|webm/);
  });
});

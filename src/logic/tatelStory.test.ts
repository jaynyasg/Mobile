import { describe, expect, it } from "vitest";
import { forum, sessions } from "../content";
import { readFileSync } from "node:fs";
import { AREA_COPY, FULL_NAME, advanceStory, dayBlurb, dayCoverLine, dayFlowLine, letterPlaceLine, storyBackground, storyBeat, storyIntro, storySlides, tatelLetters } from "./tatelStory";

function formatsByDay(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const session of sessions) (map[session.dayId] ??= []).push(session.format);
  return map;
}

describe("what TATEL is", () => {
  it("spells the long form first, then each letter on or near its island", () => {
    const letters = tatelLetters(forum.pillars);
    expect(letters.map((item) => item.letter)).toEqual(["T", "A", "T", "E", "L"]);
    expect(letters.map((item) => item.name)).toEqual(["Tech", "AI", "Travel", "Entertainment", "Law"]);
    expect(letters.map((item) => letterPlaceLine(item.name, item.island))).toEqual([
      "Tech: located on or near St. Thomas",
      "AI: located on or near St. John",
      "Travel: located on or near Scrub Island",
      "Entertainment: located on or near Jost Van Dyke",
      "Law: located on or near Lovango",
    ]);
    const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: formatsByDay() });
    expect(slides[0]?.kind).toBe("goal");
    expect(slides[1]?.title).toBe(FULL_NAME);
    expect(slides[1]?.kind).toBe("name");
    const letterSlides = slides.filter((slide) => slide.kind === "letter");
    expect(letterSlides.map((slide) => slide.line)).toEqual(letters.map((item) => letterPlaceLine(item.name, item.island)));
    expect(letterSlides.map((slide) => slide.title)).toEqual(letters.map((item) => AREA_COPY[item.id].headline));
    const notes = letterSlides.map((slide) => slide.note);
    expect(new Set(notes).size).toBe(notes.length);
    expect(notes.join(" ")).toMatch(/digital backbone/);
    expect(notes.join(" ")).toMatch(/governed intelligence/);
    expect(slides.map((slide) => `${slide.title} ${slide.line} ${slide.note}`).join(" ")).not.toMatch(/conversation/i);
  });

  it("explains the four days, and why build comes after the plan", () => {
    const formats = formatsByDay();
    expect(dayBlurb(formats["2027-01-26"])).toBe("Problem panels and evidence.");
    expect(dayBlurb(formats["2027-01-27"])).toBe("Planning solutions.");
    expect(dayBlurb(formats["2027-01-28"])).toBe("Building.");
    expect(dayBlurb(formats["2027-01-29"])).toBe("Showcasing results.");
    expect(dayBlurb(["Mystery format", "Mystery format"])).toBe("Mystery format");
    const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: formats });
    expect(slides.map((slide) => slide.kind)).toEqual([
      "goal", "name", "letter", "letter", "letter", "letter", "letter", "islands", "arc", "day", "day", "day", "day",
    ]);
    expect(storyIntro(forum.days)).toBe("A summit on the water across the Virgin Islands, Jan 26–29, 2027.");
    expect(slides.find((slide) => slide.kind === "islands")?.line).toMatch(/U\.S\. Virgin Islands/);
    expect(slides.find((slide) => slide.kind === "islands")?.note).toMatch(/St\. Croix/);
    expect(slides.find((slide) => slide.kind === "arc")?.note).toMatch(/production we can ship/);
    const dayLines = slides.filter((slide) => slide.kind === "day").map((slide) => slide.line);
    expect(dayLines).toEqual([
      "Jan 26 sessions cover The Problem",
      "Jan 27 sessions cover The Plan / Solution",
      "Jan 28 sessions cover Build",
      "Jan 29 sessions cover Showcase",
    ]);
    expect(dayFlowLine("Build")).toMatch(/tech economy/);
    expect(dayFlowLine("Build")).toMatch(/ship/);
    expect(dayFlowLine("The Problem")).toMatch(/sessions/i);
    expect(dayFlowLine("Not a phase")).toBe("");
    const bodies = slides.filter((slide) => slide.kind === "day").map((slide) => slide.note);
    expect(new Set(bodies).size).toBe(bodies.length);
    for (const day of forum.days) {
      const onDay = sessions.filter((session) => session.dayId === day.id);
      expect(onDay.length).toBeGreaterThan(0);
      expect(onDay.every((session) => session.phase === day.phase)).toBe(true);
      expect(dayCoverLine(day.dayNumber, day.phase)).toBe(`Jan ${day.dayNumber} sessions cover ${day.phase}`);
    }
  });

  it("advances past the name, through the letters, then the days", () => {
    const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: formatsByDay() });
    expect(slides.find((slide) => slide.kind === "letter")?.letter).toBe("T");
    expect(storyBeat("letter")).toBe(3_500);
    expect(storyBeat("day")).toBe(5_000);
    expect(storyBeat("name")).toBe(5_000);
    const seen: string[] = [];
    let index: number | null = 0;
    while (index !== null) {
      const slide = slides[index];
      seen.push(slide?.letter ?? slide?.title ?? "");
      index = advanceStory(index, slides.length);
    }
    expect(seen[0]).toBe("Solve it where it is");
    expect(seen[1]).toBe(FULL_NAME);
    expect(seen.slice(2, 7)).toEqual(["T", "A", "T", "E", "L"]);
    expect(seen.slice(-4)).toEqual(["The Problem", "The Plan / Solution", "Build", "Showcase"]);
    expect(advanceStory(slides.length - 1, slides.length)).toBeNull();
  });

  it("keeps one film playing through the days after the last letter", () => {
    const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: formatsByDay() });
    const library = {
      tech: { mp4: "/reels/tech.mp4" },
      ai: { mp4: "/reels/ai.mp4" },
      travel: { mp4: "/reels/travel.mp4" },
      entertainment: { mp4: "/reels/entertainment.mp4" },
      law: { mp4: "/reels/law.mp4" },
    };
    let film: { mp4: string } | null = null;
    const played: string[] = [];
    for (const slide of slides) {
      film = storyBackground(slide, film, library);
      played.push(film?.mp4 ?? "");
    }
    const letterFilms = played.filter((_, index) => slides[index]?.kind === "letter");
    expect(letterFilms).toEqual([
      "/reels/tech.mp4",
      "/reels/ai.mp4",
      "/reels/travel.mp4",
      "/reels/entertainment.mp4",
      "/reels/law.mp4",
    ]);
    expect(played.slice(-4)).toEqual(["/reels/law.mp4", "/reels/law.mp4", "/reels/law.mp4", "/reels/law.mp4"]);
    const source = readFileSync("src/components/TatelExplainer.tsx", "utf8");
    expect(source).not.toContain("key={slide.id}");
    expect(source).not.toContain('slide.kind === "letter" ? reel.mp4');
    expect(source).toContain("loop: true");
    expect(source).toContain("playsInline: true");
  });
});

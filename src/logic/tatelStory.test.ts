import { describe, expect, it } from "vitest";
import { forum, sessions } from "../content";
import { advanceStory, dayBlurb, dayCoverLine, dayFlowLine, letterPlaceLine, storyBeat, storyIntro, storySlides, tatelLetters } from "./tatelStory";

function formatsByDay(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const session of sessions) (map[session.dayId] ??= []).push(session.format);
  return map;
}

describe("what TATEL is", () => {
  it("spells the five infrastructures from the pillars, each on its island", () => {
    const letters = tatelLetters(forum.pillars);
    expect(letters.map((item) => item.letter)).toEqual(["T", "A", "T", "E", "L"]);
    expect(letters.map((item) => item.name)).toEqual(["Tech", "AI", "Travel", "Entertainment", "Law"]);
    expect(letters.map((item) => item.island)).toEqual(["St. Thomas", "St. John", "Scrub Island", "Jost Van Dyke", "Lovango"]);
    expect(letters.map((item) => letterPlaceLine(item.name, item.island))).toEqual([
      "Tech: located on St. Thomas",
      "AI: located on St. John",
      "Travel: located on Scrub Island",
      "Entertainment: located on Jost Van Dyke",
      "Law: located on Lovango",
    ]);
  });

  it("explains the four days from the session formats", () => {
    const formats = formatsByDay();
    expect(dayBlurb(formats["2027-01-26"])).toBe("Problem panels and evidence.");
    expect(dayBlurb(formats["2027-01-27"])).toBe("Planning solutions.");
    expect(dayBlurb(formats["2027-01-28"])).toBe("Building.");
    expect(dayBlurb(formats["2027-01-29"])).toBe("Showcasing results.");
    expect(dayBlurb(["Mystery format", "Mystery format"])).toBe("Mystery format");
    const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: formats });
    expect(slides.map((slide) => slide.kind)).toEqual(["letter", "letter", "letter", "letter", "letter", "day", "day", "day", "day"]);
    expect(slides.map((slide) => `${slide.title} ${slide.line} ${slide.note}`).join(" ")).not.toMatch(/conversation/i);
    expect(slides.slice(0, 5).map((slide) => slide.line)).toEqual([
      "Tech: located on St. Thomas",
      "AI: located on St. John",
      "Travel: located on Scrub Island",
      "Entertainment: located on Jost Van Dyke",
      "Law: located on Lovango",
    ]);
    expect(storyIntro(forum.days)).toBe("A summit on the water across the Virgin Islands, Jan 26–29, 2027.");
    expect(slides[0]?.note).toBe(storyIntro(forum.days));
    const dayLines = slides.filter((slide) => slide.kind === "day").map((slide) => slide.line);
    expect(dayLines).toEqual([
      "Jan 26 sessions cover The Problem",
      "Jan 27 sessions cover The Plan / Solution",
      "Jan 28 sessions cover Build",
      "Jan 29 sessions cover Showcase",
    ]);
    expect(forum.days.map((day) => day.phase)).toEqual(["The Problem", "The Plan / Solution", "Build", "Showcase"]);
    expect(dayFlowLine("The Problem")).toMatch(/sessions/i);
    expect(dayFlowLine("Not a phase")).toBe("");
    for (const day of forum.days) {
      const onDay = sessions.filter((session) => session.dayId === day.id);
      expect(onDay.length).toBeGreaterThan(0);
      expect(onDay.every((session) => session.phase === day.phase)).toBe(true);
      expect(dayCoverLine(day.dayNumber, day.phase)).toBe(`Jan ${day.dayNumber} sessions cover ${day.phase}`);
    }
  });

  it("advances past the first letter, through the rest, then the days", () => {
    const slides = storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay: formatsByDay() });
    expect(slides[0]?.letter).toBe("T");
    expect(storyBeat("letter")).toBe(3_500);
    expect(storyBeat("day")).toBe(5_000);
    const seen: string[] = [];
    let index: number | null = 0;
    while (index !== null) {
      const slide = slides[index];
      seen.push(slide?.letter ?? slide?.title ?? "");
      index = advanceStory(index, slides.length);
    }
    expect(seen[0]).toBe("T");
    expect(seen[1]).toBe("A");
    expect(seen.slice(0, 5)).toEqual(["T", "A", "T", "E", "L"]);
    expect(seen.slice(5)).toEqual(["The Problem", "The Plan / Solution", "Build", "Showcase"]);
    expect(advanceStory(slides.length - 1, slides.length)).toBeNull();
  });
});

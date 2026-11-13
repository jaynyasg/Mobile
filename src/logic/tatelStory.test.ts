import { describe, expect, it } from "vitest";
import { forum, sessions } from "../content";
import { dayBlurb, storySlides, tatelLetters } from "./tatelStory";

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
    expect(slides.map((slide) => `${slide.title} ${slide.line}`).join(" ")).not.toMatch(/conversation/i);
    expect(slides[5]?.kicker).toBe("Tue Jan 26");
    expect(slides[5]?.title).toBe("The Problem");
  });
});

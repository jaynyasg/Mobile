import { describe, expect, it } from "vitest";
import { forum, sessions } from "@/content";
import { dayChipLabel, sessionDateLine } from "./dayTheme";

describe("summit day themes", () => {
  it("reads the four themes from the program days", () => {
    expect(forum.days.map((day) => [day.date, day.phase, dayChipLabel(day)])).toEqual([
      ["2027-01-26", "The Problem", "Jan 26 · The Problem"],
      ["2027-01-27", "The Plan / Solution", "Jan 27 · The Plan / Solution"],
      ["2027-01-28", "Build", "Jan 28 · Build"],
      ["2027-01-29", "Showcase", "Jan 29 · Showcase"],
    ]);
  });

  it("puts the weekday, theme, and clock on a session", () => {
    const session = sessions.find((item) => item.dayId === "2027-01-26" && item.start && item.end);
    expect(session).toBeTruthy();
    expect(sessionDateLine(session!, forum.days, forum.timezone)).toMatch(/^Tue Jan 26 · The Problem · /);
  });

  it("does not invent a theme for a day the program does not define", () => {
    expect(sessionDateLine({ dayId: "2027-01-25", start: null, end: null, timeLabel: null }, forum.days, forum.timezone)).toBe("Time TBC");
    const blank = { ...forum.days[0], phase: "", label: "Jan 26" };
    expect(dayChipLabel(blank)).toBe("Tue 26");
  });
});

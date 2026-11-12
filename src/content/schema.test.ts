import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bundle } from "./bundle";
import { resolveContent } from "./load";
import { publishedProgramUrl } from "./published";
import { parseContent } from "./schema";

describe("content sync", () => {
  it("accepts the bundled program and the website download shape", () => {
    const bundled = parseContent(bundle, bundle);
    expect(bundled.ok).toBe(true);
    const site = parseContent(
      {
        program: { timezone: "AST (UTC−4)", days: bundle.forum.days.map((day) => ({ date: day.date, label: day.label, phase: day.phase })), pillars: [], timingNote: "Times remain TBC." },
        presenters: [{ name: "Chris Ly", company: "Example", role: "Host", photo: "assets/chris-ly.png" }],
        sessions: [
          {
            id: "AI-KEYNOTE-D1",
            title: "Keynote: Opening the AI Pillar on St. John",
            date: "2027-01-26",
            start: null,
            end: null,
            timeLabel: "Opening · Time TBC",
            track: "AI",
            island: "St. John",
            speakers: ["Chris Ly"],
            roles: { "Chris Ly": "Keynote speaker" },
            supplemental: true,
            venue: null,
          },
        ],
      },
      bundle,
    );
    expect(site.ok).toBe(true);
    if (!site.ok) return;
    expect(site.program.sessions[0]?.timeLabel).toBe("Opening · Time TBC");
    expect(site.program.sessions[0]?.venue.label).toBe("to be confirmed");
    expect(site.program.sessions[0]?.venue.venueId).toBe("st-john");
    expect(site.program.sessions[0]?.roles["chris-ly"]).toBe("Keynote speaker");
  });

  it("accepts a future canonical program.json and a later specific venue", () => {
    const future = parseContent(
      {
        version: 1,
        updatedAt: "2026-11-09",
        timezone: "AST (UTC−4)",
        days: [{ date: "2027-01-26", label: "Jan 26", phase: "The Problem" }],
        sessions: [
          {
            id: "T1-D1",
            title: "One Island, Too Many Systems",
            date: "2027-01-26",
            start: "08:00",
            end: "09:00",
            track: "Tech",
            island: "St. Thomas",
            speakers: ["Malik Elizee"],
            venue: { specific: "American Yacht Harbor, slip 4" },
          },
        ],
        presenters: [{ name: "Malik Elizee", role: "Engineer", company: "Microsoft" }],
        accommodations: [{ island: "St. Thomas", dock: "American Yacht Harbor" }],
      },
      bundle,
    );
    expect(future.ok).toBe(true);
    if (!future.ok) return;
    expect(future.program.sessions[0]?.venue.specific).toBe("American Yacht Harbor, slip 4");
    expect(future.program.sessions[0]?.start).toBe("2027-01-26T08:00:00-04:00");
  });

  it("requests the published program and keeps the bundle when the browser blocks it", async () => {
    expect(bundle.contentUrl).toBe(publishedProgramUrl);
    expect(publishedProgramUrl).toBe("https://tatel.18seventy8.com/tatel/downloads/tatel-2027-program.json");
    const result = await resolveContent({
      bundle,
      url: publishedProgramUrl,
      fetchImpl: async () => {
        throw new TypeError("Failed to fetch");
      },
      readCache: async () => null,
      writeCache: async () => {
        throw new Error("a blocked response is not cached");
      },
    });
    expect(result.source).toBe("bundle");
    expect(result.program.sessions).toHaveLength(205);
  });

  it("keeps the last good copy when the website cannot be reached", async () => {
    const calls: unknown[] = [];
    const result = await resolveContent({
      bundle,
      url: "https://example.test/tatel/downloads/tatel-2027-program.json",
      fetchImpl: async () => {
        throw new Error("offline");
      },
      readCache: async () => null,
      writeCache: async (program) => {
        calls.push(program.sessions.length);
      },
    });
    expect(result.source).toBe("bundle");
    expect(result.program.sessions).toHaveLength(205);
    expect(calls).toEqual([]);
  });

  it("rejects a payload that is not a program", () => {
    expect(parseContent({ hello: "no" }, bundle).ok).toBe(false);
    expect(readFileSync(new URL("./tatel.json", import.meta.url), "utf8")).toContain("AI-KEYNOTE-D1");
  });
});

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { displayCopy } from "./display";
import { credits, forum, panelists, sessions, venues } from "./index";

describe("website program", () => {
  it("bundles 205 sessions, 48 panelists, and five island venues", () => {
    expect(sessions).toHaveLength(205);
    expect(sessions.filter((session) => session.supplemental)).toHaveLength(5);
    expect(panelists).toHaveLength(48);
    expect(panelists.some((person) => person.name === "Hacina Hendricks")).toBe(false);
    expect(panelists.filter((person) => !person.photo).map((person) => person.name).sort()).toEqual([
      "Antonette Boynes",
      "Charlie Brown",
    ]);
    expect(venues).toHaveLength(5);
    expect(forum.draftNotice).not.toMatch(/\bProposed\b/);
    expect(displayCopy("Proposed midday arrival")).toBe("midday arrival");
    const keynote = sessions.find((session) => session.id === "AI-KEYNOTE-D1");
    expect(keynote?.timeLabel).toBe("Opening · Time TBC");
    expect(keynote?.start).toBeNull();
    expect(keynote?.speakerIds).toEqual(["chris-ly"]);
    expect(sessions.filter((session) => session.speakerIds.length === 0)).toHaveLength(13);
    expect(sessions.filter((session) => session.id.startsWith("T5-")).every((session) => session.speakerIds.includes("elizabeth-sweetland"))).toBe(true);
    for (const session of sessions) {
      expect(session.venue.specific).toBeNull();
      expect(session.venue.label).toBe("to be confirmed");
      expect(venues.some((venue) => venue.id === session.venue.venueId && venue.island === session.island)).toBe(true);
    }
    expect(credits.sentinel).toContain("Sentinel-2 cloudless");
  });

  it("does not import React or React Native", () => {
    const directory = path.dirname(fileURLToPath(import.meta.url));
    const sources = readdirSync(directory).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
    for (const file of sources) {
      const source = readFileSync(path.join(directory, file), "utf8");
      expect(source).not.toMatch(/from ["']react/);
      expect(source).not.toMatch(/react-native/);
    }
  });
});

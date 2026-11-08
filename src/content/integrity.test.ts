import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  credits,
  forum,
  notifications,
  panelists,
  participationLabel,
  passes,
  sessions,
  sessionsForPanelist,
  stayIslands,
  transport,
} from "./index";

function unique(ids: string[]) {
  expect(new Set(ids).size).toBe(ids.length);
}

describe("TATEL program", () => {
  it("matches the exported draft: 200 sessions, 29 panelists, proposed status", () => {
    unique(sessions.map((session) => session.id));
    unique(panelists.map((person) => person.id));
    expect(sessions).toHaveLength(200);
    expect(panelists).toHaveLength(29);
    expect(sessions.filter((session) => session.featured)).toHaveLength(40);
    expect(sessions.filter((session) => session.featureRole === "Circuit feature")).toHaveLength(20);
    expect(sessions.filter((session) => !session.featured)).toHaveLength(160);
    expect(forum.pillars).toHaveLength(5);
    expect(forum.days).toHaveLength(4);
    expect(forum.timezone).toBe("America/Virgin");
    expect(forum.draftNotice).toContain("subject to confirmation");

    const ids = new Set(panelists.map((person) => person.id));
    const dayIds = new Set(forum.days.map((day) => day.id));
    for (const session of sessions) {
      expect(session.status).toBe("Proposed");
      expect(session.venue).toBeNull();
      expect(dayIds.has(session.dayId)).toBe(true);
      expect(session.start.endsWith("-04:00")).toBe(true);
      for (const id of [...session.speakerIds, ...session.candidateIds]) expect(ids.has(id)).toBe(true);
      if (session.featured) {
        expect(session.speakerIds).toEqual([]);
        expect(session.candidateIds.length).toBeGreaterThan(0);
      } else {
        expect(session.candidateIds).toEqual([]);
        expect(session.speakerIds.length).toBeGreaterThan(0);
      }
    }

    const malik = panelists.find((person) => person.name === "Malik Elizee");
    expect(malik?.proposedPillarId).toBe("tech");
    const featured = sessions.find((session) => session.id === "F-TECH-A-D1");
    expect(featured && malik && participationLabel(featured, malik.id)).toBe("Potential contributor · Not assigned");
    const regular = sessionsForPanelist(malik?.id ?? "").find((session) => !session.featured);
    expect(regular && malik && participationLabel(regular, malik.id)).toBeTruthy();
  });

  it("keeps transport, stays, passes, and the imagery credit", () => {
    expect(transport.modes.map((mode) => mode.id)).toEqual(["powerboat", "ferry", "yacht"]);
    expect(transport.modes.every((mode) => mode.days.length === 4)).toBe(true);
    expect(transport.intro).toContain("unconfirmed");
    expect(stayIslands()).toHaveLength(5);
    expect(passes.items.map((pass) => pass.price)).toEqual(["$1,900", "$2,500", "$5,000"]);
    expect(passes.previewLabel).toContain("NO PAYMENT");
    expect(credits.sentinel).toContain("Sentinel-2 cloudless");
    expect(credits.sentinel).toContain("Copernicus Sentinel data 2016 & 2017");
    expect(notifications.length).toBeGreaterThanOrEqual(4);
    const ritz = stayIslands()
      .flatMap((island) => island.sections.flatMap((section) => section.providers))
      .find((provider) => provider.name === "The Ritz-Carlton, St. Thomas");
    expect(ritz?.localDeck).toBe(true);
    expect(ritz?.href).toBeNull();
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

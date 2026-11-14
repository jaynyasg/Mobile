import { describe, expect, it } from "vitest";
import { forum, panelists, sessions } from "../content";
import { filterAgenda, mySchedule } from "./agenda";
import { activeTrackIds } from "./trackFilter";

const base = {
  sessions,
  panelists,
  dayId: "2027-01-26" as const,
  pillarId: "all" as const,
  island: "all" as const,
  kind: "all" as const,
  panelistId: "all" as const,
  query: "",
  favoriteIds: [] as string[],
  favoritesOnly: false,
};

describe("agenda filters", () => {
  it("filters by day, pillar, island, type, and panelist", () => {
    const tuesday = filterAgenda(base);
    expect(tuesday).toHaveLength(52);
    expect(tuesday.every((session) => session.dayId === "2027-01-26")).toBe(true);

    const tech = filterAgenda({ ...base, pillarId: "tech", island: "St. Thomas" });
    expect(tech).toHaveLength(10);
    expect(tech.every((session) => session.pillarId === "tech" && session.island === "St. Thomas")).toBe(true);

    const circuit = filterAgenda({ ...base, dayId: "all", kind: "circuit" });
    expect(circuit).toHaveLength(20);
    expect(circuit.every((session) => session.featureRole === "Circuit feature")).toBe(true);

    const malik = panelists.find((person) => person.name === "Malik Elizee");
    expect(malik).toBeTruthy();
    const theirs = filterAgenda({ ...base, dayId: "all", panelistId: malik?.id ?? "", query: "systems" });
    expect(theirs.map((session) => session.id)).toContain("T1-D1");
  });

  it("starts from the infrastructures someone picked, and stays open when they picked none", () => {
    const picks = activeTrackIds(["tech", "law"], forum.pillars);
    const yours = filterAgenda({ ...base, dayId: "all", trackIds: picks, pillars: forum.pillars });
    expect(yours.length).toBeGreaterThan(0);
    expect(yours.every((session) => session.pillarId === "tech" || session.pillarId === "law" || session.island === "St. Thomas" || session.island === "Lovango")).toBe(true);
    expect(yours.some((session) => session.id === "E5-D1")).toBe(true);
    const open = filterAgenda({ ...base, dayId: "all" });
    expect(open.length).toBeGreaterThan(yours.length);
    expect(filterAgenda({ ...base, dayId: "all", trackIds: [], pillars: forum.pillars })).toHaveLength(open.length);
  });

  it("keeps favorites on a personal schedule", () => {
    const favorites = filterAgenda({ ...base, dayId: "all", favoritesOnly: true, favoriteIds: ["T1-D1"] });
    expect(favorites.map((session) => session.id)).toEqual(["T1-D1"]);
    const mine = mySchedule(sessions, ["F-TECH-A-D1", "T1-D1"]);
    expect(mine.map((session) => session.id)).toEqual(["T1-D1", "F-TECH-A-D1"]);
  });
});

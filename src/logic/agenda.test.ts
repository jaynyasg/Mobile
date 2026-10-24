import { describe, expect, it } from "vitest";
import { forum, sessions, speakers } from "../content";
import { filterAgenda, mySchedule } from "./agenda";

const base = {
  sessions,
  speakers,
  rooms: forum.venue.rooms,
  dayId: "tue" as const,
  trackId: "all" as const,
  lens: "all" as const,
  query: "",
  favoriteIds: [] as string[],
  heldSeatIds: [] as string[],
};

describe("agenda filters", () => {
  it("filters by day, track, and a speaker name", () => {
    const tuesday = filterAgenda(base);
    expect(tuesday.every((session) => session.dayId === "tue")).toBe(true);
    const climate = filterAgenda({ ...base, trackId: "climate" });
    expect(climate.map((session) => session.id)).toEqual(["grid-bottleneck"]);
    const hugo = filterAgenda({ ...base, dayId: "all", query: "hugo" });
    expect(hugo.map((session) => session.id)).toEqual(["pricing-unbundle"]);
  });

  it("keeps favorites and held seats on a personal schedule", () => {
    const favorites = filterAgenda({ ...base, dayId: "all", lens: "favorites", favoriteIds: ["closing"] });
    expect(favorites.map((session) => session.id)).toEqual(["closing"]);
    const mine = mySchedule(sessions, ["studio-walk-session"], ["pricing-unbundle"]);
    expect(mine.map((session) => session.id)).toEqual(["pricing-unbundle", "studio-walk-session"]);
  });
});

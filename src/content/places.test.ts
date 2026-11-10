import { describe, expect, it } from "vitest";
import { places, placesForIsland, sessions } from "./index";

describe("candidate venues", () => {
  it("keeps session venues at the island and adds the approved places", () => {
    expect(places.map((place) => place.id).sort()).toEqual([
      "emerald-beach-resort",
      "gallows-point-resort",
      "hideout-white-bay",
      "lovango-resort-beach-club",
      "margaritaville-vacation-club",
      "ritz-carlton-st-thomas",
      "scrub-island-resort",
    ]);
    expect(places.filter((place) => place.source === "app-addition").map((place) => place.id).sort()).toEqual([
      "emerald-beach-resort",
      "gallows-point-resort",
    ]);
    const emerald = places.find((place) => place.id === "emerald-beach-resort");
    expect(emerald?.models.map((model) => model.src)).toEqual([
      "/venues/emerald-beach-resort/models/site-visit.glb",
      "/venues/emerald-beach-resort/models/scan-1019.glb",
    ]);
    expect(emerald?.photos.find((photo) => photo.hero)?.id).toBe("img_1438");
    const margaritaville = places.find((place) => place.id === "margaritaville-vacation-club");
    expect(margaritaville?.photos.filter((photo) => photo.uncertain).map((photo) => photo.id)).toEqual([
      "img_2654",
      "img_2655",
      "img_2656",
      "img_2657",
      "img_2658",
      "img_2659",
    ]);
    expect(margaritaville?.photos.find((photo) => photo.hero)?.uncertain).toBe(false);
    expect(placesForIsland("St. Thomas").map((place) => place.id)).toEqual([
      "ritz-carlton-st-thomas",
      "margaritaville-vacation-club",
      "emerald-beach-resort",
    ]);
    expect(sessions.every((session) => session.venue.specific === null && session.venue.label === "to be confirmed")).toBe(true);
    expect(places.every((place) => place.photos.some((photo) => photo.hero && photo.webp1280.endsWith(".webp") && photo.jpeg.endsWith(".jpg")))).toBe(true);
  });
});

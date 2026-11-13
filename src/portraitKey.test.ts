import { describe, expect, it } from "vitest";
import { portraitKey } from "./portraitKey";

describe("portrait keys", () => {
  it("uses the file stem from a published path", () => {
    expect(portraitKey("assets/profile-update/sansara-cannon.png")).toBe("sansara-cannon");
    expect(portraitKey("assets/p19-malik-elizee.png")).toBe("p19-malik-elizee");
    expect(portraitKey("p19-malik-elizee.webp")).toBe("p19-malik-elizee");
  });

  it("skips blank paths and the two svg stand-ins", () => {
    expect(portraitKey("")).toBeNull();
    expect(portraitKey(null)).toBeNull();
    expect(portraitKey("assets/profile-update/charlie-brown-placeholder.svg")).toBeNull();
    expect(portraitKey("assets/profile-update/antonette-boynes-usvi.svg")).toBeNull();
  });
});

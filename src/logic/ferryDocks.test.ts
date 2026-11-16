import { describe, expect, it } from "vitest";
import { ferryLegs } from "./ferrySchedule";
import { BOARDED_LEG_IDS, FERRY_DOCKS, LOVANGO_FERRY_BOOK_URL, boardingFor } from "./ferryDocks";

describe("ferry dock pins", () => {
  it("keeps the five owner pins and the FareHarbor booking link", () => {
    expect(FERRY_DOCKS.map((dock) => dock.url)).toEqual([
      "https://maps.app.goo.gl/8cdjqA5aRwP3D75w9",
      "https://maps.app.goo.gl/pD3gcJcqz9q9svaD6",
      "https://maps.app.goo.gl/hTfCpLDycUMkkkzg7",
      "https://maps.app.goo.gl/qxrNSKmnPP2ZcdsTA",
      "https://maps.app.goo.gl/SkRqfXnEa1zGwPgr8",
    ]);
    expect(LOVANGO_FERRY_BOOK_URL).toBe(
      "https://fareharbor.com/embeds/book/lovangoresortstjohn/items/?flow=1267756&full-items=yes",
    );
    expect(LOVANGO_FERRY_BOOK_URL).not.toMatch(/utm_/);
  });

  it("attaches a pin only when that end of the route is known", () => {
    expect(boardingFor("charlotte-cruz").board).toEqual(["charlotte-downtown"]);
    expect(boardingFor("charlotte-cruz").board).not.toContain("blyden");
    expect(boardingFor("charlotte-road-town").board).toEqual(["blyden"]);
    expect(boardingFor("red-hook-cruz").board).toEqual(["red-hook"]);
    expect(boardingFor("red-hook-west-end").board).toEqual(["red-hook"]);
    expect(boardingFor("red-hook-lovango").board).toEqual([]);
    expect(boardingFor("red-hook-lovango").book).toBe(true);
    expect(boardingFor("cruz-lovango").board).toEqual(["cruz-bay"]);
    expect(boardingFor("cruz-lovango").book).toBe(true);
    expect(boardingFor("jost-virgin-gorda").board).toEqual(["jost"]);
    expect(boardingFor("charlotte-virgin-gorda").board).toEqual([]);
    expect(boardingFor("road-town-virgin-gorda").board).toEqual([]);
    expect(boardingFor("trellis-scrub").board).toEqual([]);
    expect(BOARDED_LEG_IDS.slice().sort()).toEqual(ferryLegs.map((leg) => leg.id).sort());
  });
});

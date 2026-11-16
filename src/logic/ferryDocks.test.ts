import { describe, expect, it } from "vitest";
import { ferryLegs } from "./ferrySchedule";
import { BOARDED_LEG_IDS, DOCK_GROUPS, FERRY_DOCKS, LOVANGO_FERRY_BOOK_URL, boardingFor } from "./ferryDocks";

describe("ferry dock pins", () => {
  it("groups the owner pins by island", () => {
    expect(DOCK_GROUPS.map((group) => group.island)).toEqual(["St. Thomas", "St. John", "Tortola", "Jost Van Dyke"]);
    expect(FERRY_DOCKS.map((dock) => dock.url)).toEqual([
      "https://maps.app.goo.gl/8cdjqA5aRwP3D75w9",
      "https://maps.app.goo.gl/hTfCpLDycUMkkkzg7",
      "https://maps.app.goo.gl/qxrNSKmnPP2ZcdsTA",
      "https://maps.app.goo.gl/pD3gcJcqz9q9svaD6",
      "https://maps.app.goo.gl/N3er1d1VBo393Hpx5",
      "https://maps.app.goo.gl/FZyRgyawKPZCYv5C7",
      "https://maps.app.goo.gl/EQJk9J5TPCWS2RxG7",
      "https://maps.app.goo.gl/MLbYtU72LzW2evwt8",
      "https://maps.app.goo.gl/SkRqfXnEa1zGwPgr8",
    ]);
    expect(LOVANGO_FERRY_BOOK_URL).toBe(
      "https://fareharbor.com/embeds/book/lovangoresortstjohn/items/?flow=1267756&full-items=yes",
    );
    expect(LOVANGO_FERRY_BOOK_URL).not.toMatch(/utm_/);
  });

  it("attaches a pin only when that end of the route is named", () => {
    expect(boardingFor("charlotte-cruz").board).toEqual(["charlotte-downtown"]);
    expect(boardingFor("charlotte-cruz").board).not.toContain("blyden");
    expect(boardingFor("charlotte-road-town").board).toEqual(["blyden"]);
    expect(boardingFor("charlotte-road-town").land).toEqual([]);
    expect(boardingFor("charlotte-road-town").extra.map((item) => item.id)).toEqual(["road-town"]);
    expect(boardingFor("red-hook-cruz").board).toEqual(["red-hook"]);
    expect(boardingFor("red-hook-west-end").land).toEqual(["west-end"]);
    expect(boardingFor("red-hook-west-end").extra.map((item) => item.id)).toEqual(["road-town"]);
    expect(boardingFor("west-end-jost").board).toEqual(["west-end"]);
    expect(boardingFor("west-end-jost").land).toEqual(["jost"]);
    expect(boardingFor("trellis-scrub").board).toEqual(["trellis"]);
    expect(boardingFor("trellis-scrub").board).not.toContain("beef-island");
    expect(boardingFor("road-town-virgin-gorda").board).toEqual([]);
    expect(boardingFor("road-town-virgin-gorda").extra.map((item) => item.id)).toEqual(["road-town"]);
    expect(boardingFor("red-hook-lovango").board).toEqual([]);
    expect(boardingFor("red-hook-lovango").book).toBe(true);
    expect(boardingFor("cruz-lovango").board).toEqual(["cruz-bay"]);
    expect(boardingFor("jost-virgin-gorda").land).toEqual([]);
    expect(boardingFor("charlotte-virgin-gorda").board).toEqual([]);
    const linked = ferryLegs.flatMap((leg) => {
      const boarding = boardingFor(leg.id);
      return [...boarding.board, ...boarding.land, ...boarding.extra.map((item) => item.id)];
    });
    expect(linked).not.toContain("beef-island");
    expect(BOARDED_LEG_IDS.slice().sort()).toEqual(ferryLegs.map((leg) => leg.id).sort());
  });
});

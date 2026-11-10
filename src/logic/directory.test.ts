import { describe, expect, it } from "vitest";
import { panelists } from "../content";
import { searchPanelists } from "./directory";

describe("panelist directory", () => {
  it("searches the published roster", () => {
    expect(searchPanelists(panelists, "")).toHaveLength(49);
    expect(searchPanelists(panelists, "microsoft").map((person) => person.id)).toContain("malik-elizee");
    expect(searchPanelists(panelists, "nobody-here")).toEqual([]);
  });
});

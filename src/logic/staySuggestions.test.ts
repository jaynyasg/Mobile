import { describe, expect, it } from "vitest";
import { sessions } from "../content";
import { suggestedStayIslands } from "./staySuggestions";

describe("islands from opening answers", () => {
  it.each([
    ["tech", ["St. Thomas"]], ["ai", ["St. John"]], ["travel", ["Scrub Island"]],
    ["entertainment", ["Near Tortola", "St. Thomas", "Scrub Island"]], ["law", ["Lovango"]],
  ] as const)("suggests all islands hosting %s sessions", (area, islands) => {
    expect(suggestedStayIslands(sessions, { areas: [area], interests: [] })).toEqual(islands);
  });
  it("uses sub-infrastructure to narrow multiple areas, and works without an area selection", () => {
    const example = sessions.find((session) => session.pillarId === "tech")!;
    const program = [
      { ...example, id: "agri", title: "AgriTech: Local food", island: "St. Thomas" },
      { ...example, id: "film", title: "Film studio", pillarId: "entertainment", island: "Jost Van Dyke" },
    ];
    for (const areas of [[], ["tech", "entertainment"]]) {
      expect(suggestedStayIslands(program, { areas, interests: ["AgriTech"] })).toEqual(["St. Thomas"]);
    }
  });
  it("keeps broad browsing distinct from no matches, without inventing island matches", () => {
    expect(suggestedStayIslands(sessions, { areas: [], interests: [] })).toEqual([]);
    expect(suggestedStayIslands(sessions, { areas: ["missing"], interests: [] })).toEqual([]);
    expect(suggestedStayIslands(sessions, { areas: ["tech"], interests: ["missing"] })).toEqual([]);
  });
});

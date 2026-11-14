import { describe, expect, it } from "vitest";
import { STAMPS_KEY, addStamp, adventureLine, buildQuests, islandStamp, readStamps, type StampStore } from "./stamps";

function memory(): StampStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const sessions = [
  { id: "L8-D1", title: "Why Promising Pilots Never Leave the Summit", island: "Lovango", dayId: "2027-01-26", start: "2027-01-26T16:00:00-04:00" },
  { id: "early", title: "Morning", island: "Lovango", dayId: "2027-01-26", start: "2027-01-26T11:00:00-04:00" },
];

describe("stamp card", () => {
  it("stores a stamp once under the same key", () => {
    const store = memory();
    expect(STAMPS_KEY).toBe("tatel.stamps");
    expect(islandStamp("tech")).toBe("island:tech");
    expect(addStamp(store, "island:tech")).toBe(true);
    expect(addStamp(store, "island:tech")).toBe(false);
    expect(readStamps(store)).toEqual(["island:tech"]);
  });

  it("builds quests from the sunset welcome, the Lovango hour, and the Jost ferry", () => {
    const quests = buildQuests({
      dayId: "2027-01-28",
      sessions,
      ferryLegs: [{ date: "2027-01-28", title: "West End → Great Harbour, Jost", time: "1:00–about 1:20/1:30pm" }],
      sunsetWelcome: { date: "2027-01-25", description: "Proposed midday arrival in St. Thomas and check-in, followed by a sunset welcome." },
    });
    expect(quests.map((quest) => quest.title)).toEqual([
      "Take the ferry to Jost",
      "Join the sunset welcome",
    ]);
    const tuesday = buildQuests({
      dayId: "2027-01-26",
      sessions,
      ferryLegs: [],
      sunsetWelcome: null,
    });
    expect(tuesday[0]?.title).toBe("Lovango at 4:00 PM");
    expect(tuesday[0]?.line).toBe("Why Promising Pilots Never Leave the Summit");
    expect(tuesday[0]?.stamp).toBe("session:L8-D1");
  });

  it("uses an open quest as today's adventure", () => {
    const quests = buildQuests({
      dayId: "2027-01-26",
      sessions,
      ferryLegs: [],
      sunsetWelcome: null,
    });
    expect(adventureLine(quests, [], "A quiet day").title).toBe("Lovango at 4:00 PM");
    expect(adventureLine(quests, ["session:L8-D1"], "A quiet day").line).toBe("A quiet day");
  });
});

import { describe, expect, it } from "vitest";
import { sessions } from "../content";
import { contrastRatio } from "../components/nightGlass";
import { TOPIC_COLOR, sessionTopic } from "./topic";

const pillars = [
  { id: "tech", name: "Tech" },
  { id: "ai", name: "AI" },
  { id: "travel", name: "Travel" },
  { id: "entertainment", name: "Entertainment" },
  { id: "law", name: "Law" },
];

const worstGlass = { r: 86, g: 98, b: 103 };

describe("session topics", () => {
  it("uses the pillar name that the published track field maps to", () => {
    expect(sessionTopic({ pillarId: "tech" }, pillars)?.name).toBe("Tech");
    expect(sessionTopic({ pillarId: "AI" }, pillars)?.name).toBe("AI");
    expect(sessionTopic({ pillarId: "unknown" }, pillars)).toBeNull();
    expect(sessions.every((session) => sessionTopic(session, pillars))).toBe(true);
  });

  it("keeps chip colors above WCAG AA on the brightest glass", () => {
    for (const color of Object.values(TOPIC_COLOR)) {
      const rgb = {
        r: Number.parseInt(color.slice(1, 3), 16),
        g: Number.parseInt(color.slice(3, 5), 16),
        b: Number.parseInt(color.slice(5, 7), 16),
      };
      expect(contrastRatio(rgb, worstGlass)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

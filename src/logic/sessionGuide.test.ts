import { describe, expect, it } from "vitest";
import { sessions } from "../content";
import { availableSubtopics, guidedSessions, SESSION_GOALS, sessionGoal } from "./sessionGuide";
import { sessionInterest } from "./techInterest";
import { notePassPurchased, readIntake, writeIntake } from "./intake";

describe("guided session selection", () => {
  it("matches infrastructure, sub-infrastructure, and purpose together", () => {
    const matches = guidedSessions(sessions, { areas: ["tech"], interests: ["AgriTech"], goals: ["build"] });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((session) => session.pillarId === "tech" && sessionInterest(session) === "AgriTech" && session.phase === "Build")).toBe(true);
    expect(matches.every((session) => session.outcome.trim().length > 0)).toBe(true);
  });
  it("offers only sub-infrastructure present in the chosen areas", () => {
    for (const area of ["tech", "ai", "travel", "entertainment", "law"]) {
      const topics = availableSubtopics(sessions, [area]);
      for (const topic of topics) expect(topic.count).toBe(sessions.filter((session) => session.pillarId === area && sessionInterest(session) === topic.id).length);
      expect(topics.every((topic) => topic.count > 0)).toBe(true);
    }
  });
  it("keeps open choices broad and does not replace an empty match with unrelated featured sessions", () => {
    expect(guidedSessions(sessions, { areas: [], interests: [], goals: [] })).toHaveLength(sessions.length);
    expect(guidedSessions(sessions, { areas: ["missing"], interests: [], goals: [] })).toEqual([]);
    const matches = guidedSessions(sessions, { areas: ["ai", "law"], interests: [], goals: ["understand", "share"] });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((session) => ["ai", "law"].includes(session.pillarId) && ["understand", "share"].includes(sessionGoal(session.phase)?.id ?? ""))).toBe(true);
  });
  it("uses the actual summit phases for each goal", () => {
    for (const goal of SESSION_GOALS) expect(sessions.some((session) => session.phase === goal.phase)).toBe(true);
    expect(sessionGoal("Unannounced")).toBeUndefined();
  });
  it("preserves session choices when a ticket is purchased and the device reloads", () => {
    const values = new Map<string, string>();
    const store = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    writeIntake(store, { hasPass: "not-yet", needsStay: "booked", completed: [], areas: ["tech"], interests: ["AgriTech"], sessionGoals: ["build"], sessionGuideDone: true });
    notePassPurchased(store);
    expect(readIntake(store)).toMatchObject({ areas: ["tech"], interests: ["AgriTech"], sessionGoals: ["build"], sessionGuideDone: true, needsStay: "booked" });
  });
});

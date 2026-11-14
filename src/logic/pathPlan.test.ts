import { describe, expect, it } from "vitest";
import { forum } from "../content";
import { buildPath } from "./pathPlan";

const pillars = forum.pillars;

describe("your path", () => {
  it("puts a missing pass first, then sessions, a stay, the route, and chat", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech", "ai"], needsStay: "yes" }, pillars);
    expect(steps.map((step) => step.title)).toEqual([
      "Choose your pass",
      "Select your sessions",
      "Pick your stay",
      "Build my route",
      "Join the chat",
    ]);
    expect(steps[1]?.line).toBe("Tech · AI");
    expect(steps[2]?.line).toContain("St. Thomas");
    expect(steps[2]?.line).toContain("St. John");
    expect(steps.map((step) => step.title).join(" ")).not.toMatch(/conversation/i);
  });

  it("treats not sure like a pass still to choose, and a held pass as Passport", () => {
    expect(buildPath({ hasPass: "unsure", areas: [], needsStay: "browsing" }, pillars)[0]?.title).toBe("Choose your pass");
    expect(buildPath({ hasPass: "have", areas: ["law"], needsStay: "yes" }, pillars)[0]?.title).toBe("Add your pass");
  });

  it("checks off a booked stay and keeps browsing optional", () => {
    const booked = buildPath({ hasPass: "have", areas: ["tech"], needsStay: "booked" }, pillars);
    expect(booked.find((step) => step.id === "stay")).toMatchObject({ title: "Your stay", done: true, line: "Already booked." });
    const browsing = buildPath({ hasPass: "have", areas: ["tech"], needsStay: "browsing" }, pillars);
    expect(browsing.find((step) => step.id === "stay")).toMatchObject({ title: "Browse stays", optional: true, done: false });
  });

  it("checks a step the visitor already finished", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech"], needsStay: "yes" }, pillars, ["pass", "sessions"]);
    expect(steps.filter((step) => step.done).map((step) => step.id)).toEqual(["pass", "sessions"]);
  });
});

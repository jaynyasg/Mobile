import { describe, expect, it } from "vitest";
import { forum } from "../content";
import { buildPath } from "./pathPlan";

const pillars = forum.pillars;

describe("your path", () => {
  it("puts a needed stay and a missing pass ahead of sessions", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech", "ai"], needsStay: "yes" }, pillars);
    expect(steps.map((step) => step.title)).toEqual([
      "Pick your stay",
      "Choose your pass",
      "Select your sessions",
      "Build my route",
      "Join the chat",
    ]);
    expect(steps[2]?.line).toBe("Tech · AI");
    expect(steps[0]?.line).toContain("St. Thomas");
    expect(steps[0]?.line).toContain("St. John");
    expect(steps.map((step) => step.title).join(" ")).not.toMatch(/conversation/i);
  });

  it("keeps a held pass off the top and lifts a stay they still need", () => {
    const steps = buildPath({ hasPass: "have", areas: ["law"], needsStay: "yes" }, pillars);
    expect(steps.map((step) => step.id)).toEqual(["stay", "sessions", "route", "pass", "chat"]);
    expect(steps[0]?.title).toBe("Pick your stay");
    expect(steps.find((step) => step.id === "pass")).toMatchObject({ title: "Add your pass", line: "Open Tickets." });
    expect(steps[0]?.id).not.toBe("pass");
  });

  it("puts a missing pass first when the stay is already booked", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech"], needsStay: "booked" }, pillars);
    expect(steps.map((step) => step.id)).toEqual(["pass", "sessions", "route", "chat", "stay"]);
    expect(steps.at(-1)).toMatchObject({ id: "stay", done: true, title: "Your stay" });
  });

  it("treats not sure like a pass still to choose, and leaves browsing at the bottom", () => {
    const unsure = buildPath({ hasPass: "unsure", areas: [], needsStay: "browsing" }, pillars);
    expect(unsure.map((step) => step.id)).toEqual(["pass", "sessions", "route", "chat", "stay"]);
    expect(unsure[0]?.title).toBe("Choose your pass");
    expect(unsure.at(-1)).toMatchObject({ id: "stay", title: "Browse stays", optional: true, done: false });
  });

  it("checks off a booked stay and keeps browsing optional", () => {
    const booked = buildPath({ hasPass: "have", areas: ["tech"], needsStay: "booked" }, pillars);
    expect(booked.find((step) => step.id === "stay")).toMatchObject({ title: "Your stay", done: true, line: "Already booked." });
    expect(booked.map((step) => step.id)).toEqual(["sessions", "route", "pass", "chat", "stay"]);
    const browsing = buildPath({ hasPass: "have", areas: ["tech"], needsStay: "browsing" }, pillars);
    expect(browsing.find((step) => step.id === "stay")).toMatchObject({ title: "Browse stays", optional: true, done: false });
    expect(browsing.map((step) => step.id)).toEqual(["sessions", "route", "pass", "chat", "stay"]);
  });

  it("sinks finished steps and keeps the rest in answer order", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech"], needsStay: "yes" }, pillars, ["pass", "sessions"]);
    expect(steps.map((step) => step.id)).toEqual(["stay", "route", "chat", "pass", "sessions"]);
    expect(steps.filter((step) => step.done).map((step) => step.id)).toEqual(["pass", "sessions"]);
  });

  it("keeps a finished path in the original order, still checked", () => {
    const steps = buildPath(
      { hasPass: "have", areas: ["tech"], needsStay: "booked" },
      pillars,
      ["pass", "sessions", "stay", "route", "chat"],
    );
    expect(steps.every((step) => step.done)).toBe(true);
    expect(steps.map((step) => step.id)).toEqual(["pass", "sessions", "stay", "route", "chat"]);
  });
});

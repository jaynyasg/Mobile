import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { forum } from "../content";
import { PASS_CHOICES, STAY_CHOICES, areaSubsets, buildPath, homePathMatrixMarkdown, pathDestination } from "./pathPlan";

const pillars = forum.pillars;
describe("guided visit", () => {
  it("orders every answer combination as ticket, accommodation, sessions, exploration", () => {
    for (const hasPass of PASS_CHOICES) for (const needsStay of STAY_CHOICES) for (const areas of areaSubsets(pillars)) {
      const steps = buildPath({ hasPass, needsStay, areas }, pillars);
      const expected = [...(hasPass === "have" ? [] : ["pass"]), ...(needsStay === "booked" ? [] : ["stay"]), "sessions", "explore"];
      expect(steps.map((step) => step.id)).toEqual(expected);
      expect(steps.map((step) => step.number)).toEqual(expected.map((_, index) => index + 1));
      expect(steps.every((step) => !step.done)).toBe(true);
    }
  });
  it("retains purchased steps and uses saved sessions instead of old visited flags", () => {
    const answers = { hasPass: "not-yet" as const, needsStay: "yes" as const, areas: ["tech"] };
    const visited = buildPath(answers, pillars, { completed: ["pass", "sessions"], savedSessionCount: 0 });
    expect(visited.find((step) => step.id === "pass")?.done).toBe(false);
    expect(visited.find((step) => step.id === "sessions")?.done).toBe(false);
    const completed = buildPath(answers, pillars, { ownedPass: true, completed: ["stay"], savedSessionCount: 3 });
    expect(completed.slice(0, 3).every((step) => step.done)).toBe(true);
    expect(completed.map((step) => step.number)).toEqual([1, 2, 3, 4]);
  });
  it("plans an onboard stay without sending guests to book a hotel as well", () => {
    const answers = { hasPass: "not-yet" as const, needsStay: "browsing" as const, areas: [], ticketPreference: "vip" as const };
    expect(buildPath(answers, pillars).map((step) => step.id)).toEqual(["pass", "sessions", "explore"]);
    expect(buildPath(answers, pillars)[0].done).toBe(false);
    expect(buildPath(answers, pillars, { ownedTier: "beach" }).some((step) => step.id === "stay")).toBe(true);
    expect(buildPath(answers, pillars, { ownedTier: "vip" }).map((step) => step.id)).toEqual(["pass", "sessions", "explore"]);
    expect(buildPath({ ...answers, hasPass: "have" }, pillars).map((step) => step.id)).toEqual(["sessions", "explore"]);
    expect(buildPath({ ...answers, needsStay: "yes" }, pillars, { ownedTier: "vip" }).find((step) => step.id === "stay")?.title).toBe("Arrange extra nights");
  });
  it("routes a recommended ticket without opening checkout or completing anything", () => {
    for (const ticketPreference of ["beach", "boat", "vip"] as const) {
      expect(pathDestination("pass", { areas: [], needsStay: "yes", ticketPreference })).toEqual({ pathname: "/tickets", params: { tier: ticketPreference } });
    }
    expect(pathDestination("pass")).toEqual({ pathname: "/tickets" });
    expect(pathDestination("stay", { areas: ["tech"], needsStay: "yes" })).toEqual({ pathname: "/stays", params: { areas: "tech" } });
    expect(pathDestination("sessions")).toEqual({ pathname: "/agenda" });
    expect(pathDestination("explore")).toEqual({ pathname: "/explore" });
  });
  it("keeps the review matrix current", () => {
    expect(readFileSync("docs/home-path-matrix.md", "utf8")).toBe(homePathMatrixMarkdown(pillars));
  });
});

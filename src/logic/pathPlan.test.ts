import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { forum } from "../content";
import {
  PASS_CHOICES,
  STAY_CHOICES,
  areaSubsets,
  buildPath,
  homePathMatrixMarkdown,
  pathDestination,
  type IntakeAnswers,
  type PassAnswer,
  type PathStep,
  type StayAnswer,
} from "./pathPlan";

const pillars = forum.pillars;

function signature(steps: readonly PathStep[]): string {
  return steps.map((step) => `${step.number}|${step.id}|${step.title}|${step.line}|${step.optional}`).join(" > ");
}

function asksToGetPass(step: PathStep): boolean {
  return step.id === "pass" && /\b(get|buy|purchase|register|add)\b|choose your pass/i.test(`${step.title} ${step.line}`);
}

function asksToBookStay(step: PathStep): boolean {
  return step.id === "stay" && /pick your stay|book a stay|book your stay|find your stay/i.test(`${step.title} ${step.line}`);
}

describe("your path", () => {
  it("puts a missing pass ahead of a needed stay and sessions", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech", "ai"], needsStay: "yes" }, pillars);
    expect(steps.map((step) => step.title)).toEqual([
      "Choose your pass",
      "Pick your stay",
      "Select your sessions",
      "Build my route",
      "Join the chat",
    ]);
    expect(steps.map((step) => step.number)).toEqual([1, 2, 3, 4, 5]);
    expect(steps.every((step) => step.done)).toBe(false);
    expect(steps[2]?.line).toBe("Tech · AI");
    expect(steps[1]?.line).toContain("St. Thomas");
    expect(steps[1]?.line).toContain("St. John");
    expect(steps.map((step) => step.title).join(" ")).not.toMatch(/conversation/i);
  });

  it("has a pass and still needs a stay: no get-pass step", () => {
    const steps = buildPath({ hasPass: "have", areas: ["law"], needsStay: "yes" }, pillars);
    expect(steps.map((step) => step.id)).toEqual(["stay", "sessions", "route", "chat"]);
    expect(steps[0]).toMatchObject({ title: "Pick your stay", line: "Lovango", number: 1 });
    expect(steps.some((step) => step.id === "pass" || asksToGetPass(step))).toBe(false);
  });

  it("needs a pass and already booked a stay: no book-stay step", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech"], needsStay: "booked" }, pillars);
    expect(steps.map((step) => step.id)).toEqual(["pass", "sessions", "route", "chat"]);
    expect(steps[0]).toMatchObject({ title: "Choose your pass", line: "Register to attend.", number: 1 });
    expect(steps.some((step) => step.id === "stay" || asksToBookStay(step))).toBe(false);
  });

  it("has a pass and a stay already booked", () => {
    const steps = buildPath({ hasPass: "have", areas: ["tech", "ai"], needsStay: "booked" }, pillars);
    expect(steps.map((step) => `${step.number}. ${step.title}`)).toEqual([
      "1. Select your sessions",
      "2. Build my route",
      "3. Join the chat",
    ]);
    expect(steps[0]?.line).toBe("Tech · AI");
    expect(steps.some((step) => step.id === "pass" || step.id === "stay")).toBe(false);
  });

  it("keeps an unsure pass in view and leaves browsing numbered at the end", () => {
    const steps = buildPath({ hasPass: "unsure", areas: [], needsStay: "browsing" }, pillars);
    expect(steps.map((step) => step.id)).toEqual(["pass", "sessions", "route", "chat", "stay"]);
    expect(steps[0]).toMatchObject({ title: "See pass options", line: "Beach, boat, or a VIP group.", number: 1 });
    expect(steps.at(-1)).toMatchObject({ id: "stay", title: "Browse stays", optional: true, number: 5, line: "Optional." });
    expect(steps[0]?.title).not.toMatch(/get|buy|register/i);
  });

  it("still leads with the pass step when both questions were skipped", () => {
    const steps = buildPath({ hasPass: "skipped", areas: [], needsStay: "skipped" }, pillars);
    expect(steps.map((step) => step.id)).toEqual(["pass", "sessions", "route", "chat", "stay"]);
    expect(steps[0]).toMatchObject({ title: "Passes", line: "Open Tickets when you want.", number: 1, optional: true, done: false });
    expect(steps.at(-1)).toMatchObject({ title: "Stays", line: "If you need a place.", number: 5 });
    expect(steps.some(asksToGetPass)).toBe(false);
    expect(steps.some(asksToBookStay)).toBe(false);
  });

  it("treats a missing answer the same as a skip", () => {
    const skipped = buildPath({ hasPass: "skipped", areas: ["travel"], needsStay: "skipped" }, pillars);
    const missing = buildPath(
      { hasPass: undefined as unknown as PassAnswer, areas: ["travel"], needsStay: undefined as unknown as StayAnswer },
      pillars,
    );
    expect(signature(missing)).toBe(signature(skipped));
  });

  it("checks a pass bought on the device and keeps it first when the questions did not say have", () => {
    for (const hasPass of PASS_CHOICES) {
      if (hasPass === "have") continue;
      const steps = buildPath({ hasPass, areas: ["tech"], needsStay: "yes" }, pillars, { ownedPass: true });
      expect(steps[0]).toMatchObject({ id: "pass", done: true, number: 1 });
      expect(steps[1]).toMatchObject({ id: "stay", done: false, number: 2 });
      expect(steps.map((step) => step.number)).toEqual([1, 2, 3, 4, 5]);
    }
    const saidHave = buildPath({ hasPass: "have", areas: ["tech"], needsStay: "yes" }, pillars, { ownedPass: true });
    expect(saidHave.some((step) => step.id === "pass" || asksToGetPass(step))).toBe(false);
  });

  it("keeps finished steps in place, checked, with stable numbers", () => {
    const steps = buildPath({ hasPass: "not-yet", areas: ["tech"], needsStay: "yes" }, pillars, ["pass", "sessions"]);
    expect(steps.map((step) => `${step.number}:${step.id}:${step.done}`)).toEqual([
      "1:pass:true",
      "2:stay:false",
      "3:sessions:true",
      "4:route:false",
      "5:chat:false",
    ]);
  });

  it("omits only what the questions already covered, and checks the rest", () => {
    const steps = buildPath(
      { hasPass: "have", areas: ["tech"], needsStay: "booked" },
      pillars,
      { completed: ["pass", "sessions", "stay", "route", "chat"] },
    );
    expect(steps.map((step) => step.id)).toEqual(["sessions", "route", "chat"]);
    expect(steps.every((step) => step.done)).toBe(true);
    expect(steps.map((step) => step.number)).toEqual([1, 2, 3]);
    expect(steps.some((step) => step.id === "pass" || step.id === "stay")).toBe(false);
  });

  it("sends each path step to its section, and the pass step to Tickets", () => {
    expect(pathDestination("pass")).toEqual({ pathname: "/tickets" });
    expect(pathDestination("pass", { areas: ["tech"], needsStay: "yes" })).toEqual({ pathname: "/tickets" });
    expect(pathDestination("sessions")).toEqual({ pathname: "/agenda" });
    expect(pathDestination("stay", { areas: ["tech", "ai"], needsStay: "yes" })).toEqual({ pathname: "/stays", params: { areas: "tech,ai" } });
    expect(pathDestination("stay", { areas: [], needsStay: "yes" })).toEqual({ pathname: "/stays" });
    expect(pathDestination("stay", { areas: ["tech"], needsStay: "browsing" })).toEqual({ pathname: "/stays" });
    expect(pathDestination("route")).toEqual({ pathname: "/transport", params: { build: "1" } });
    expect(pathDestination("chat")).toEqual({ pathname: "/community" });
    const home = readFileSync("src/app/(tabs)/index.tsx", "utf8");
    expect(home).toContain("pathDestination");
    expect(home).toContain('"/tickets"');
    expect(home).not.toContain("PASS_ATTEND_URL");
    expect(home).not.toContain("Linking.openURL");
  });

  it("walks every answer combination", () => {
    const subsets = areaSubsets(pillars);
    expect(PASS_CHOICES).toEqual(["have", "not-yet", "unsure", "skipped"]);
    expect(STAY_CHOICES).toEqual(["yes", "booked", "browsing", "skipped"]);
    expect(subsets).toHaveLength(2 ** pillars.length);
    const seen = new Map<string, string>();
    for (const hasPass of PASS_CHOICES) {
      for (const needsStay of STAY_CHOICES) {
        for (const areas of subsets) {
          const answers: IntakeAnswers = { hasPass, areas, needsStay };
          const steps = buildPath(answers, pillars);
          const ids = steps.map((step) => step.id);
          expect(steps.length).toBeGreaterThan(0);
          expect(new Set(ids).size).toBe(ids.length);
          expect(steps.map((step) => step.number)).toEqual(steps.map((_, index) => index + 1));
          expect(steps.some((step) => step.done)).toBe(false);
          if (hasPass === "have") {
            expect(steps.some((step) => step.id === "pass" || asksToGetPass(step))).toBe(false);
          } else {
            expect(steps[0]?.id).toBe("pass");
            expect(steps[0]?.done).toBe(false);
            if (needsStay === "yes") expect(steps[1]?.id).toBe("stay");
          }
          if (needsStay === "booked") {
            expect(steps.some((step) => step.id === "stay" || asksToBookStay(step))).toBe(false);
          }
          const key = `${hasPass}|${needsStay}|${areas.join(",")}`;
          seen.set(key, signature(steps));
        }
      }
    }
    expect(seen.size).toBe(PASS_CHOICES.length * STAY_CHOICES.length * subsets.length);
    for (const areas of subsets) {
      const areaKey = areas.join(",");
      for (const leftPass of PASS_CHOICES) {
        for (const leftStay of STAY_CHOICES) {
          for (const rightPass of PASS_CHOICES) {
            for (const rightStay of STAY_CHOICES) {
              if (leftPass === rightPass && leftStay === rightStay) continue;
              const left = seen.get(`${leftPass}|${leftStay}|${areaKey}`);
              const right = seen.get(`${rightPass}|${rightStay}|${areaKey}`);
              expect(left, `${leftPass}/${leftStay} vs ${rightPass}/${rightStay} @ ${areaKey || "none"}`).not.toBe(right);
            }
          }
        }
      }
    }
  });

  it("matches the committed combination table", () => {
    const matrix = homePathMatrixMarkdown(pillars);
    expect(readFileSync("docs/home-path-matrix.md", "utf8")).toBe(matrix);
    expect(matrix).toContain("## Every combination");
    expect(matrix).toContain("| have | booked |");
    expect(matrix).toContain("| not-yet | yes |");
  });
});

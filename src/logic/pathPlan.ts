export type PassAnswer = "have" | "not-yet" | "unsure";
export type StayAnswer = "yes" | "booked" | "browsing";

export interface IntakeAnswers {
  hasPass: PassAnswer;
  areas: readonly string[];
  needsStay: StayAnswer;
}

export interface PathPillar {
  id: string;
  name: string;
  island: string;
}

export interface PathStep {
  id: "pass" | "sessions" | "stay" | "route" | "chat";
  title: string;
  line: string;
  optional: boolean;
  done: boolean;
}

export function buildPath(answers: IntakeAnswers, pillars: readonly PathPillar[], completed: readonly string[] = []): PathStep[] {
  const chosen = pillars.filter((pillar) => answers.areas.includes(pillar.id));
  const names = chosen.map((pillar) => pillar.name);
  const islands = chosen.map((pillar) => pillar.island);
  const areaLine = names.length ? names.join(" · ") : "Every area";
  const islandLine = islands.length ? islands.join(" · ") : "Every island";
  const stayBooked = answers.needsStay === "booked";
  const steps: PathStep[] = [
    answers.hasPass === "have"
      ? { id: "pass", title: "Add your pass", line: "Open Tickets.", optional: false, done: false }
      : { id: "pass", title: "Choose your pass", line: "Register to attend.", optional: false, done: false },
    { id: "sessions", title: "Select your sessions", line: areaLine, optional: false, done: false },
    answers.needsStay === "yes"
      ? { id: "stay", title: "Pick your stay", line: islandLine, optional: false, done: false }
      : answers.needsStay === "browsing"
        ? { id: "stay", title: "Browse stays", line: "Optional.", optional: true, done: false }
        : { id: "stay", title: "Your stay", line: "Already booked.", optional: false, done: true },
    { id: "route", title: "Build my route", line: "From the sessions you pick.", optional: false, done: false },
    { id: "chat", title: "Join the chat", line: "Talk with people at TATEL.", optional: false, done: false },
  ];
  const finished = new Set(completed);
  const marked = steps.map((step) => ({ ...step, done: step.done || finished.has(step.id) || stayBooked && step.id === "stay" }));
  return orderPath(marked, answers);
}

/**
 * Lower ranks first.
 * A stay they still need, then a pass they do not have, then sessions and the route.
 * A pass they already hold, chat, and optional browsing follow.
 * Finished steps stay on the list, at the bottom, in their original order.
 */
export function pathRank(step: PathStep, answers: IntakeAnswers): number {
  if (step.done) return 100;
  if (step.id === "stay" && answers.needsStay === "yes") return 10;
  if (step.id === "pass" && answers.hasPass !== "have") return 20;
  if (step.id === "sessions") return 30;
  if (step.id === "route") return 40;
  if (step.id === "pass") return 50;
  if (step.id === "chat") return 60;
  if (step.id === "stay") return 70;
  return 80;
}

export function orderPath(steps: readonly PathStep[], answers: IntakeAnswers): PathStep[] {
  return steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => pathRank(a.step, answers) - pathRank(b.step, answers) || a.index - b.index)
    .map((item) => item.step);
}

export const PASS_ATTEND_URL = "https://www.tatelexclusive.com/attend";

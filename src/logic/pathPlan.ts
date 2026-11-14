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
      ? { id: "pass", title: "Add your pass", line: "Open Passport.", optional: false, done: false }
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
  return steps.map((step) => ({ ...step, done: step.done || finished.has(step.id) || stayBooked && step.id === "stay" }));
}

export const PASS_ATTEND_URL = "https://www.tatelexclusive.com/attend";

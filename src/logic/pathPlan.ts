import type { PassTier } from "./passPay";

export const PASS_CHOICES = ["have", "not-yet", "unsure", "skipped"] as const;
export const STAY_CHOICES = ["yes", "booked", "browsing", "skipped"] as const;

export type PassAnswer = (typeof PASS_CHOICES)[number];
export type StayAnswer = (typeof STAY_CHOICES)[number];

export interface IntakeAnswers {
  hasPass: PassAnswer;
  areas: readonly string[];
  needsStay: StayAnswer;
  ticketPreference?: PassTier;
}

export interface PathPillar {
  id: string;
  name: string;
  island: string;
}

export interface PathStep {
  id: "pass" | "sessions" | "stay" | "explore" | "route" | "chat";
  title: string;
  line: string;
  optional: boolean;
  done: boolean;
  number: number;
}

export interface PathState {
  completed?: readonly string[];
  /**
   * A pass stored on the device after they buy or claim one.
   * That checks the pass step. It does not remove a step the questions left in.
   */
  ownedPass?: boolean | null;
  ownedTier?: PassTier | null;
  savedSessionCount?: number;
}

type DraftStep = Omit<PathStep, "number">;

/** The questions said they already have a pass. A pass bought later is not this. */
export function holdsPass(answers: Pick<IntakeAnswers, "hasPass">, _state: PathState = {}): boolean {
  return answers.hasPass === "have";
}

export function stayBooked(answers: Pick<IntakeAnswers, "needsStay">): boolean {
  return answers.needsStay === "booked";
}

function isCompletedList(state: PathState | readonly string[] | undefined): state is readonly string[] {
  return Array.isArray(state);
}

function asState(state: PathState | readonly string[] | undefined): PathState {
  if (isCompletedList(state)) return { completed: state };
  return state ?? {};
}

function asPass(value: PassAnswer | null | undefined): PassAnswer {
  return PASS_CHOICES.includes(value as PassAnswer) ? (value as PassAnswer) : "skipped";
}

function asStay(value: StayAnswer | null | undefined): StayAnswer {
  return STAY_CHOICES.includes(value as StayAnswer) ? (value as StayAnswer) : "skipped";
}

function passStep(hasPass: PassAnswer): DraftStep {
  if (hasPass === "unsure") {
    return { id: "pass", title: "Compare tickets", line: "Find your way to experience TATEL.", optional: false, done: false };
  }
  if (hasPass === "skipped") {
    return { id: "pass", title: "Explore tickets", line: "Choose when you are ready.", optional: true, done: false };
  }
  return { id: "pass", title: "Choose your ticket", line: "Stay ashore, sail by day, or live aboard.", optional: false, done: false };
}

function stayStep(needsStay: StayAnswer): DraftStep {
  if (needsStay === "yes") {
    return { id: "stay", title: "Find your accommodation", line: `Choose your island and a place to stay.`, optional: false, done: false };
  }
  if (needsStay === "browsing") {
    return { id: "stay", title: "Browse accommodation", line: "Compare islands, hotels, and villas.", optional: true, done: false };
  }
  return { id: "stay", title: "Plan your stay", line: "Find a base when you are ready.", optional: true, done: false };
}

/**
 * Answers plus device state, in visitor order.
 * A need the questions already cover is left out: they said they have a pass,
 * or they said the stay is booked. A step finished later in the app stays put,
 * with the same number, and `done` set so the row can show a check.
 */
export function buildPath(
  answers: IntakeAnswers,
  pillars: readonly PathPillar[],
  state: PathState | readonly string[] = {},
): PathStep[] {
  const pathState = asState(state);
  const normalized: IntakeAnswers = {
    hasPass: asPass(answers?.hasPass),
    needsStay: asStay(answers?.needsStay),
    areas: Array.isArray(answers?.areas) ? answers.areas : [],
  };
  const finished = new Set(pathState.completed ?? []);
  const chosen = pillars.filter((pillar) => normalized.areas.includes(pillar.id));
  const areaLine = chosen.length ? chosen.map((pillar) => pillar.name).join(" · ") : "Every area";
  const done = (id: PathStep["id"]) => {
    // Legacy versions marked steps on opening. Only actual ticket/session state counts now.
    if (id === "pass") return Boolean(pathState.ownedPass || pathState.ownedTier);
    if (id === "sessions" && pathState.savedSessionCount != null) return pathState.savedSessionCount > 0;
    return finished.has(id);
  };
  const steps: DraftStep[] = [];
  if (!holdsPass(normalized, pathState)) steps.push({ ...passStep(normalized.hasPass), done: done("pass") });
  steps.push({ id: "sessions", title: "Select your sessions", line: areaLine, optional: false, done: done("sessions") });
  const onboard = (pathState.ownedTier ?? answers.ticketPreference) === "vip";
  if (!stayBooked(normalized) && (!onboard || normalized.needsStay === "yes")) steps.push({ ...stayStep(normalized.needsStay), ...(onboard ? { title: "Arrange extra nights", line: "Find a hotel for before or after your charter." } : {}), done: done("stay") });
  steps.push({ id: "explore", title: "Explore TATEL", line: "Meet the people. Discover the islands. Plan your route.", optional: false, done: done("explore") });
  return orderPath(steps, normalized).map((step, index) => ({ ...step, number: index + 1 }));
}

/**
 * Lower ranks first.
 * Ticket, accommodation, saved sessions, then discovery.
 */
export function pathRank(step: Pick<PathStep, "id">, _answers: IntakeAnswers): number {
  if (step.id === "pass") return 5;
  if (step.id === "stay") return 10;
  if (step.id === "sessions") return 20;
  if (step.id === "explore") return 30;
  if (step.id === "route") return 50;
  if (step.id === "chat") return 70;
  return 100;
}

export interface PathLink {
  pathname: "/tickets" | "/agenda" | "/stays" | "/routes" | "/community" | "/explore";
  params?: { areas: string } | { build: "1" } | { tier: PassTier; checkout: "start" };
}

/** A selected ticket opens its checkout; undecided guests can compare tickets. */
export function pathDestination(
  stepId: PathStep["id"],
  answers: Pick<IntakeAnswers, "areas" | "needsStay" | "ticketPreference"> = { areas: [], needsStay: "skipped" },
): PathLink {
  if (stepId === "pass") return answers.ticketPreference ? { pathname: "/tickets", params: { tier: answers.ticketPreference, checkout: "start" } } : { pathname: "/tickets" };
  if (stepId === "explore") return { pathname: "/explore" };
  if (stepId === "sessions") return { pathname: "/agenda" };
  if (stepId === "stay") {
    const areas = (answers.areas ?? []).filter(Boolean).join(",");
    if (answers.needsStay === "yes" && areas) return { pathname: "/stays", params: { areas } };
    return { pathname: "/stays" };
  }
  if (stepId === "route") return { pathname: "/routes", params: { build: "1" } };
  return { pathname: "/community" };
}

export function orderPath<T extends Pick<PathStep, "id">>(steps: readonly T[], answers: IntakeAnswers): T[] {
  return steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => pathRank(a.step, answers) - pathRank(b.step, answers) || a.index - b.index)
    .map((item) => item.step);
}

export function areaSubsets(pillars: readonly PathPillar[]): string[][] {
  const ids = pillars.map((pillar) => pillar.id);
  const subsets: string[][] = [];
  const total = 1 << ids.length;
  for (let mask = 0; mask < total; mask += 1) {
    subsets.push(ids.filter((_, index) => (mask & (1 << index)) !== 0));
  }
  return subsets;
}

function stepCell(steps: readonly PathStep[]): string {
  if (!steps.length) return "—";
  return steps.map((step) => `${step.number}. ${step.title}${step.done ? " ✓" : ""} — ${step.line}`).join("<br>");
}

function areaCell(pillars: readonly PathPillar[], areas: readonly string[]): string {
  const names = pillars.filter((pillar) => areas.includes(pillar.id)).map((pillar) => pillar.name);
  return names.length ? names.join(" · ") : "None";
}

/** Every pass × stay × area-subset row, for review. */
export function homePathMatrixMarkdown(pillars: readonly PathPillar[]): string {
  const subsets = areaSubsets(pillars);
  const summary: string[] = [];
  for (const hasPass of PASS_CHOICES) {
    for (const needsStay of STAY_CHOICES) {
      const steps = buildPath({ hasPass, areas: [], needsStay }, pillars);
      summary.push(`| ${hasPass} | ${needsStay} | ${stepCell(steps)} |`);
    }
  }
  const rows: string[] = [];
  for (const hasPass of PASS_CHOICES) {
    for (const needsStay of STAY_CHOICES) {
      for (const areas of subsets) {
        const steps = buildPath({ hasPass, areas, needsStay }, pillars);
        rows.push(`| ${hasPass} | ${needsStay} | ${areaCell(pillars, areas)} | ${stepCell(steps)} |`);
      }
    }
  }
  return [
    "# Home path",
    "",
    "Ordered steps for every onboarding answer. A need the questions already cover is omitted.",
    "The guided order is ticket, accommodation, saved sessions, then Explore. Existing tickets and arranged accommodation are omitted. An onboard ticket covers the stay unless the guest explicitly wants extra nights.",
    "Someone who answered `have` never sees a pass step. Someone who answered `booked` never sees a stay step.",
    "A step finished later in the app stays in that same place. The number does not change. The row is marked done.",
    "Opening a screen does not complete it. Ticket completion uses the saved ticket state; session completion uses the current saved-session count. Booking later never records a completed purchase.",
    "A guest confirms accommodation after booking with the property. Opening a provider link does not confirm a reservation.",
    "",
    "## Answer space",
    "",
    "- Pass: `have` (already has one), `not-yet`, `unsure`, `skipped` (left unanswered).",
    "- Stay: `yes` (needs a place), `booked` (already booked), `browsing`, `skipped` (left unanswered).",
    "- Areas: every subset of the five topics, in program order. Names change the Sessions line and suggest islands for accommodation. They do not add a step.",
    "- The tables below hold completed steps empty and no pass on the device. Completing a step in the app adds a check and keeps the number.",
    "",
    "## Finished in the app",
    "",
    "Questions said not-yet and yes. Pass and stay were then finished in the app.",
    "",
    `| ${stepCell(buildPath({ hasPass: "not-yet", areas: [], needsStay: "yes" }, pillars, { ownedPass: true, completed: ["stay"] }))} |`,
    "",
    "## Pass and stay",
    "",
    "No areas selected.",
    "",
    "| Pass | Stay | Steps |",
    "| --- | --- | --- |",
    ...summary,
    "",
    "## Every combination",
    "",
    `${rows.length} rows. ${PASS_CHOICES.length} pass answers × ${STAY_CHOICES.length} stay answers × ${subsets.length} area subsets.`,
    "",
    "| Pass | Stay | Areas | Steps |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

export const PASS_ATTEND_URL = "https://www.tatelexclusive.com/attend";

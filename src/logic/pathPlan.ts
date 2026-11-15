export const PASS_CHOICES = ["have", "not-yet", "unsure", "skipped"] as const;
export const STAY_CHOICES = ["yes", "booked", "browsing", "skipped"] as const;

export type PassAnswer = (typeof PASS_CHOICES)[number];
export type StayAnswer = (typeof STAY_CHOICES)[number];

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
  number: number;
}

export interface PathState {
  completed?: readonly string[];
  /**
   * A pass stored on the device after they buy or claim one.
   * That checks the pass step. It does not remove a step the questions left in.
   */
  ownedPass?: boolean | null;
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
    return { id: "pass", title: "See pass options", line: "Beach, boat, or a VIP group.", optional: false, done: false };
  }
  if (hasPass === "skipped") {
    return { id: "pass", title: "Passes", line: "Open Tickets when you want.", optional: true, done: false };
  }
  return { id: "pass", title: "Choose your pass", line: "Register to attend.", optional: false, done: false };
}

function stayStep(needsStay: StayAnswer, islandLine: string): DraftStep {
  if (needsStay === "yes") {
    return { id: "stay", title: "Pick your stay", line: islandLine, optional: false, done: false };
  }
  if (needsStay === "browsing") {
    return { id: "stay", title: "Browse stays", line: "Optional.", optional: true, done: false };
  }
  return { id: "stay", title: "Stays", line: "If you need a place.", optional: true, done: false };
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
  const islandLine = chosen.length ? chosen.map((pillar) => pillar.island).join(" · ") : "Every island";
  const done = (id: PathStep["id"]) => finished.has(id) || (id === "pass" && Boolean(pathState.ownedPass));
  const steps: DraftStep[] = [];
  if (!holdsPass(normalized, pathState)) steps.push({ ...passStep(normalized.hasPass), done: done("pass") });
  steps.push({ id: "sessions", title: "Select your sessions", line: areaLine, optional: false, done: done("sessions") });
  if (!stayBooked(normalized)) steps.push({ ...stayStep(normalized.needsStay, islandLine), done: done("stay") });
  steps.push({ id: "route", title: "Build my route", line: "From the sessions you pick.", optional: false, done: done("route") });
  steps.push({ id: "chat", title: "Join the chat", line: "Talk with people at TATEL.", optional: false, done: done("chat") });
  return orderPath(steps, normalized).map((step, index) => ({ ...step, number: index + 1 }));
}

/**
 * Lower ranks first.
 * A pass they do not already have, then a stay they still need, then sessions and the route.
 * Chat, a stay they are only browsing, and a stay they skipped follow.
 */
export function pathRank(step: Pick<PathStep, "id">, answers: IntakeAnswers): number {
  if (step.id === "pass") return 5;
  if (step.id === "stay" && answers.needsStay === "yes") return 10;
  if (step.id === "sessions") return 40;
  if (step.id === "route") return 50;
  if (step.id === "chat") return 70;
  if (step.id === "stay" && answers.needsStay === "browsing") return 80;
  if (step.id === "stay") return 90;
  return 100;
}

export interface PathLink {
  pathname: "/tickets" | "/agenda" | "/stays" | "/transport" | "/community";
  params?: { areas: string } | { build: "1" };
}

/** Where a path step opens. The pass step always lands on Tickets, in the app. */
export function pathDestination(
  stepId: PathStep["id"],
  answers: Pick<IntakeAnswers, "areas" | "needsStay"> = { areas: [], needsStay: "skipped" },
): PathLink {
  if (stepId === "pass") return { pathname: "/tickets" };
  if (stepId === "sessions") return { pathname: "/agenda" };
  if (stepId === "stay") {
    const areas = (answers.areas ?? []).filter(Boolean).join(",");
    if (answers.needsStay === "yes" && areas) return { pathname: "/stays", params: { areas } };
    return { pathname: "/stays" };
  }
  if (stepId === "route") return { pathname: "/transport", params: { build: "1" } };
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
    "When the questions do not say they have a pass (`not-yet`, `unsure`, or `skipped`, and they did not answer `have`), that pass step is first. Choose your pass comes ahead of Pick your stay and every other step.",
    "Someone who answered `have` never sees a pass step. Someone who answered `booked` never sees a stay step.",
    "A step finished later in the app stays in that same place. The number does not change. The row is marked done.",
    "Buying a pass or claiming one on the device checks the pass step. It does not remove it, unless the questions already said `have`.",
    "Booking a stay in the app checks the stay step. It does not remove it, unless the questions already said `booked`.",
    "",
    "## Answer space",
    "",
    "- Pass: `have` (already has one), `not-yet`, `unsure`, `skipped` (left unanswered).",
    "- Stay: `yes` (needs a place), `booked` (already booked), `browsing`, `skipped` (left unanswered).",
    "- Areas: every subset of the infrastructure areas, in program order. Names change the Sessions line and, when a stay step is shown, the island line. They do not add a step.",
    "- The tables below hold completed steps empty and no pass on the device. Completing a step in the app adds a check and keeps the number.",
    "",
    "## Finished in the app",
    "",
    "Questions said not-yet and yes. Pass and stay were then finished in the app.",
    "",
    `| ${stepCell(buildPath({ hasPass: "not-yet", areas: [], needsStay: "yes" }, pillars, ["pass", "stay"]))} |`,
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

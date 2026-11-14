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
  /** A pass already stored on the device. Separate from the onboarding answer. */
  ownedPass?: boolean | null;
}

type DraftStep = Omit<PathStep, "number">;

export function holdsPass(answers: Pick<IntakeAnswers, "hasPass">, state: PathState = {}): boolean {
  return Boolean(state.ownedPass) || answers.hasPass === "have";
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
 * A need the answers already cover is left out: a held pass, a booked stay,
 * and any step they have already finished. Nothing covered comes back as a check.
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
  const steps: DraftStep[] = [];
  if (!holdsPass(normalized, pathState) && !finished.has("pass")) steps.push(passStep(normalized.hasPass));
  if (!finished.has("sessions")) {
    steps.push({ id: "sessions", title: "Select your sessions", line: areaLine, optional: false, done: false });
  }
  if (!stayBooked(normalized) && !finished.has("stay")) steps.push(stayStep(normalized.needsStay, islandLine));
  if (!finished.has("route")) {
    steps.push({ id: "route", title: "Build my route", line: "From the sessions you pick.", optional: false, done: false });
  }
  if (!finished.has("chat")) {
    steps.push({ id: "chat", title: "Join the chat", line: "Talk with people at TATEL.", optional: false, done: false });
  }
  return orderPath(steps, normalized).map((step, index) => ({ ...step, number: index + 1 }));
}

/**
 * Lower ranks first.
 * A stay they still need, then a pass they do not have, then sessions and the route.
 * A pass they skipped, chat, and a stay they are only browsing follow.
 */
export function pathRank(step: Pick<PathStep, "id">, answers: IntakeAnswers): number {
  if (step.id === "stay" && answers.needsStay === "yes") return 10;
  if (step.id === "pass" && answers.hasPass === "not-yet") return 20;
  if (step.id === "pass" && answers.hasPass === "unsure") return 30;
  if (step.id === "sessions") return 40;
  if (step.id === "route") return 50;
  if (step.id === "pass") return 60;
  if (step.id === "chat") return 70;
  if (step.id === "stay" && answers.needsStay === "browsing") return 80;
  if (step.id === "stay") return 90;
  return 100;
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
  return steps.map((step) => `${step.number}. ${step.title} — ${step.line}`).join("<br>");
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
    "Ordered steps for every onboarding answer. A covered need is omitted.",
    "A held pass removes any step that asks them to get or buy a pass.",
    "A booked stay removes any step that asks them to book a stay.",
    "Steps they have already finished are omitted the same way, then the rest are numbered 1..N.",
    "",
    "## Answer space",
    "",
    "- Pass: `have` (already has one), `not-yet`, `unsure`, `skipped` (left unanswered).",
    "- Stay: `yes` (needs a place), `booked` (already booked), `browsing`, `skipped` (left unanswered).",
    "- Areas: every subset of the infrastructure areas, in program order. Names change the Sessions line and, when a stay step is shown, the island line. They do not add a step.",
    "- This table holds completed steps empty and no pass on the device. An owned pass removes the pass step the same way `have` does, even if the answer was `not-yet`, `unsure`, or `skipped`.",
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

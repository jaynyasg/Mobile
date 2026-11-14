import type { IntakeAnswers, PassAnswer, StayAnswer } from "./pathPlan";

export const INTAKE_KEY = "tatel.intake.v1";
export const INTAKE_RETAKE_KEY = "tatel.intake.retake";

export interface IntakeRecord extends IntakeAnswers {
  completed: string[];
}

export interface IntakeStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const passes = new Set<PassAnswer>(["have", "not-yet", "unsure"]);
const stays = new Set<StayAnswer>(["yes", "booked", "browsing"]);

export function readIntake(store: IntakeStore | null): IntakeRecord | null {
  const raw = store?.getItem(INTAKE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<IntakeRecord>;
    if (!parsed || !passes.has(parsed.hasPass as PassAnswer) || !stays.has(parsed.needsStay as StayAnswer)) return null;
    const areas = Array.isArray(parsed.areas) ? parsed.areas.filter((item): item is string => typeof item === "string") : [];
    const completed = Array.isArray(parsed.completed) ? parsed.completed.filter((item): item is string => typeof item === "string") : [];
    return { hasPass: parsed.hasPass as PassAnswer, needsStay: parsed.needsStay as StayAnswer, areas, completed };
  } catch {
    return null;
  }
}

export function writeIntake(store: IntakeStore | null, record: IntakeRecord): void {
  store?.setItem(INTAKE_KEY, JSON.stringify({
    hasPass: record.hasPass,
    areas: [...new Set(record.areas)],
    needsStay: record.needsStay,
    completed: [...new Set(record.completed)],
  }));
}

export function requestIntake(store: IntakeStore | null): void {
  store?.setItem(INTAKE_RETAKE_KEY, "1");
}

export function consumeIntakeRequest(store: IntakeStore | null): boolean {
  if (store?.getItem(INTAKE_RETAKE_KEY) !== "1") return false;
  store.setItem(INTAKE_RETAKE_KEY, "");
  return true;
}

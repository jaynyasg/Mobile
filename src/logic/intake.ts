import type { IntakeAnswers, PassAnswer, StayAnswer } from "./pathPlan";
import { passTier } from "./passPay";

export const INTAKE_KEY = "tatel.intake.v1";
export const INTAKE_RETAKE_KEY = "tatel.intake.retake";

export interface IntakeRecord extends IntakeAnswers {
  completed: string[];
  interests: string[];
  accommodation?: { island: string; name: string };
  progressVersion?: number;
  sessionGoals?: string[];
  sessionGuideDone?: boolean;
}

export interface IntakeStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const passes = new Set<PassAnswer>(["have", "not-yet", "unsure", "skipped"]);
const stays = new Set<StayAnswer>(["yes", "booked", "browsing", "skipped"]);

export function readIntake(store: IntakeStore | null): IntakeRecord | null {
  const raw = store?.getItem(INTAKE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<IntakeRecord>;
    if (!parsed || !passes.has(parsed.hasPass as PassAnswer) || !stays.has(parsed.needsStay as StayAnswer)) return null;
    const areas = Array.isArray(parsed.areas) ? parsed.areas.filter((item): item is string => typeof item === "string") : [];
    const completed = Array.isArray(parsed.completed) ? parsed.completed.filter((item): item is string => typeof item === "string" && (parsed.progressVersion === 2 || !["pass", "stay", "sessions"].includes(item))) : [];
    const interests = Array.isArray(parsed.interests) ? parsed.interests.filter((item): item is string => typeof item === "string") : [];
    const ticketPreference = passTier(parsed.ticketPreference) ?? undefined;
    const accommodation = typeof parsed.accommodation?.island === "string" && typeof parsed.accommodation?.name === "string" ? parsed.accommodation : undefined;
    const sessionGoals = Array.isArray(parsed.sessionGoals) ? parsed.sessionGoals.filter((item): item is string => typeof item === "string") : undefined;
    const sessionGuideDone = parsed.sessionGuideDone === true ? true : undefined;
    return { hasPass: parsed.hasPass as PassAnswer, needsStay: parsed.needsStay as StayAnswer, areas, completed, interests, ticketPreference, accommodation, sessionGoals, sessionGuideDone };
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
    interests: [...new Set(record.interests ?? [])],
    ticketPreference: record.ticketPreference,
    accommodation: record.accommodation,
    sessionGoals: record.sessionGoals,
    sessionGuideDone: record.sessionGuideDone,
    progressVersion: 2,
  }));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("tatel-intake-changed"));
}

export function requestIntake(store: IntakeStore | null): void {
  store?.setItem(INTAKE_RETAKE_KEY, "1");
}

export function consumeIntakeRequest(store: IntakeStore | null): boolean {
  if (store?.getItem(INTAKE_RETAKE_KEY) !== "1") return false;
  store.setItem(INTAKE_RETAKE_KEY, "");
  return true;
}

/**
 * A finished payment checks the pass step. The question answer stays, so someone
 * who said not-yet still sees Choose your pass, now checked. A retake can replace this.
 * With no answers yet, the record says they have a pass.
 */
export function notePassPurchased(store: IntakeStore | null): IntakeRecord {
  const current = readIntake(store);
  const next: IntakeRecord = {
    hasPass: current?.hasPass ?? "have",
    areas: current?.areas ?? [],
    needsStay: current?.needsStay ?? "browsing",
    completed: [...new Set([...(current?.completed ?? []), "pass"])],
    interests: current?.interests ?? [],
    ticketPreference: current?.ticketPreference,
    accommodation: current?.accommodation,
    sessionGoals: current?.sessionGoals,
    sessionGuideDone: current?.sessionGuideDone,
  };
  writeIntake(store, next);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("tatel-pass-owned"));
  return next;
}

/** The guest confirms the reservation; opening a hotel website is not a booking. */
export function confirmAccommodation(store: IntakeStore | null, accommodation?: IntakeRecord["accommodation"]): void {
  const current = readIntake(store);
  if (!current) return;
  writeIntake(store, { ...current, accommodation, completed: [...new Set([...current.completed, "stay"])] });
}

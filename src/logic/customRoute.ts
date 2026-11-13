import type { TransportMode } from "@/content/types";
import { legEnds, modeLabel, underwayMinutes } from "./transportPlan";

export const ROUTE_KEY = "tatel.route.v1";
/** Arrive this many minutes before the session starts. */
export const ARRIVE_BUFFER = 20;

export interface RouteStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface PlanSession {
  id: string;
  title: string;
  dayId: string;
  start: string | null;
  end: string | null;
  island: string;
  venue?: string | null;
}

export interface PlanLeg {
  from: string;
  to: string;
  depart: string | null;
  mode: string;
  duration: string;
  estimated: boolean;
  tight: boolean;
}

export interface PlanStop {
  session: PlanSession;
  leg: PlanLeg | null;
  clash: boolean;
}

export interface PlanDay {
  dayId: string;
  stops: PlanStop[];
}

export function readRoutePlan(store: RouteStore | null): string[] | null {
  const raw = store?.getItem(ROUTE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return null;
  }
}

export function writeRoutePlan(store: RouteStore | null, ids: string[]): void {
  store?.setItem(ROUTE_KEY, JSON.stringify(ids));
}

export function clockMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClock(minutes: number): string {
  const day = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(day / 60);
  const minute = day % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const face = hour % 12 || 12;
  return `${face}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function normIsland(value: string): string {
  const text = value.toLowerCase().replace(/\s*·.*$/, "").trim();
  if (text.startsWith("jost")) return "jost van dyke";
  if (text.startsWith("scrub")) return "scrub island";
  if (text.includes("thomas") || text.includes("red hook")) return "st. thomas";
  if (text.includes("john")) return "st. john";
  if (text.includes("lovango")) return "lovango";
  return text;
}

function samePlace(a: string, b: string): boolean {
  return normIsland(a) === normIsland(b);
}

function pairKey(from: string, to: string): string {
  return [normIsland(from), normIsland(to)].sort().join("|");
}

const ESTIMATES: Record<string, [number, number]> = {
  "lovango|st. thomas": [15, 30],
  "lovango|st. john": [10, 25],
  "st. john|st. thomas": [20, 40],
  "jost van dyke|st. john": [25, 45],
  "jost van dyke|lovango": [30, 55],
  "jost van dyke|st. thomas": [40, 70],
  "jost van dyke|scrub island": [40, 60],
  "scrub island|st. john": [40, 70],
  "lovango|scrub island": [45, 75],
  "scrub island|st. thomas": [50, 80],
};

function minuteLabel(range: [number, number]): string {
  return range[0] === range[1] ? `${range[0]} min` : `${range[0]}–${range[1]} min`;
}

interface Candidate {
  modeId: string;
  modeName: string;
  minutes: [number, number];
  sameDay: boolean;
}

const modeRank: Record<string, number> = { powerboat: 0, ferry: 1, yacht: 2 };

function better(next: Candidate, current: Candidate): boolean {
  if (next.sameDay !== current.sameDay) return next.sameDay;
  if (next.minutes[1] !== current.minutes[1]) return next.minutes[1] < current.minutes[1];
  return (modeRank[next.modeId] ?? 9) < (modeRank[current.modeId] ?? 9);
}

function findCrossing(modes: TransportMode[], dayId: string, from: string, to: string): Candidate | null {
  let best: Candidate | null = null;
  for (const mode of modes) {
    for (const day of mode.days) {
      for (const item of day.items) {
        if (item.kind !== "leg") continue;
        const ends = legEnds(item.title);
        if (!samePlace(ends.from, from) || !samePlace(ends.to, to)) continue;
        const minutes = underwayMinutes(item.detail);
        if (!minutes) continue;
        const candidate: Candidate = {
          modeId: mode.id,
          modeName: modeLabel(mode),
          minutes,
          sameDay: day.date === dayId,
        };
        if (!best || better(candidate, best)) best = candidate;
      }
    }
  }
  return best;
}

function crossing(modes: TransportMode[], dayId: string, from: string, to: string): { mode: string; minutes: [number, number]; estimated: boolean } {
  const found = findCrossing(modes, dayId, from, to);
  if (found) return { mode: found.modeName, minutes: found.minutes, estimated: false };
  const guess = ESTIMATES[pairKey(from, to)] ?? [45, 75];
  return { mode: "Water taxi", minutes: guess, estimated: true };
}

function byTime(a: PlanSession, b: PlanSession): number {
  const start = (clockMinutes(a.start) ?? 24 * 60) - (clockMinutes(b.start) ?? 24 * 60);
  if (start !== 0) return start;
  return a.title.localeCompare(b.title);
}

export function buildRoute(picks: PlanSession[], modes: TransportMode[], buffer = ARRIVE_BUFFER): PlanDay[] {
  const byDay = new Map<string, PlanSession[]>();
  for (const session of picks) {
    const list = byDay.get(session.dayId) ?? [];
    list.push(session);
    byDay.set(session.dayId, list);
  }
  const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return days.map(([dayId, list]) => {
    const ordered = list.slice().sort(byTime);
    const stops: PlanStop[] = [];
    ordered.forEach((session, index) => {
      const previous = ordered[index - 1];
      if (!previous) {
        stops.push({ session, leg: null, clash: false });
        return;
      }
      const previousEnd = clockMinutes(previous.end);
      const nextStart = clockMinutes(session.start);
      const clash = previousEnd != null && nextStart != null && nextStart < previousEnd;
      if (samePlace(previous.island, session.island)) {
        stops.push({ session, leg: null, clash });
        return;
      }
      const ride = crossing(modes, dayId, previous.island, session.island);
      const gap = previousEnd != null && nextStart != null ? nextStart - previousEnd : null;
      const needed = ride.minutes[1] + buffer;
      const tight = !clash && gap != null && gap < needed;
      const depart = nextStart == null ? null : nextStart - buffer - ride.minutes[1];
      stops.push({
        session,
        clash,
        leg: {
          from: previous.island,
          to: session.island,
          depart: depart == null ? null : depart < 0 ? "The night before" : formatClock(depart),
          mode: ride.mode,
          duration: minuteLabel(ride.minutes),
          estimated: ride.estimated,
          tight: tight || (depart != null && depart < 0),
        },
      });
    });
    return { dayId, stops };
  });
}

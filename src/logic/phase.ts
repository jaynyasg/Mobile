import { forum } from "../content";
import { ymd } from "./time";

export type ForumPhase =
  | { phase: "upcoming"; daysUntil: number }
  | { phase: "live"; dayId: string }
  | { phase: "ended" };

export function forumPhase(now: Date, timeZone = forum.timezone): ForumPhase {
  const today = ymd(now, timeZone);
  if (today < forum.startDate) {
    return { phase: "upcoming", daysUntil: daysBetween(today, forum.startDate) };
  }
  if (today > forum.endDate) return { phase: "ended" };
  const day = forum.days.find((item) => item.date === today);
  return { phase: "live", dayId: day?.id ?? forum.days[0].id };
}

export function phaseLabel(phase: ForumPhase): string {
  if (phase.phase === "ended") return "The forum has closed";
  if (phase.phase === "live") return "The forum is open";
  if (phase.daysUntil <= 0) return "Doors open today";
  if (phase.daysUntil === 1) return "Doors open tomorrow";
  return `Doors open in ${phase.daysUntil} days`;
}

export function suggestedDayId(now: Date, timeZone = forum.timezone): string {
  const phase = forumPhase(now, timeZone);
  if (phase.phase === "live") return phase.dayId;
  if (phase.phase === "ended") return forum.days[forum.days.length - 1].id;
  return forum.days[0].id;
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const [fromYear, fromMonth, fromDay] = fromYmd.split("-").map(Number);
  const [toYear, toMonth, toDay] = toYmd.split("-").map(Number);
  const start = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const end = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((end - start) / 86_400_000);
}

import { getProgram } from "../content/active";
import { ymd } from "./time";

export type ForumPhase =
  | { phase: "upcoming"; daysUntil: number }
  | { phase: "live"; dayId: string }
  | { phase: "ended" };

export function forumPhase(now: Date, timeZone = getProgram().forum.timezone): ForumPhase {
  const forum = getProgram().forum;
  const today = ymd(now, timeZone);
  if (today < forum.startDate) {
    return { phase: "upcoming", daysUntil: daysBetween(today, forum.startDate) };
  }
  if (today > forum.endDate) return { phase: "ended" };
  const day = forum.days.find((item) => item.date === today);
  return { phase: "live", dayId: day?.id ?? forum.days[0].id };
}

export function phaseLabel(phase: ForumPhase): string {
  if (phase.phase === "ended") return "The summit has closed";
  if (phase.phase === "live") return "The summit is open";
  if (phase.daysUntil <= 0) return "The summit opens today";
  if (phase.daysUntil === 1) return "The summit opens tomorrow";
  return `The summit opens in ${phase.daysUntil} days`;
}

export function suggestedDayId(now: Date, timeZone = getProgram().forum.timezone): string {
  const forum = getProgram().forum;
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

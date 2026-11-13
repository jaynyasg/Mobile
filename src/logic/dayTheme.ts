import type { Day, Session } from "@/content/types";
import { formatRange } from "./time";

export function summitDay(days: Day[], dayId: string | null | undefined): Day | undefined {
  if (!dayId) return undefined;
  return days.find((day) => day.id === dayId || day.date === dayId);
}

/** Chip text from the program day record. No theme is added when the day has none. */
export function dayChipLabel(day: Day): string {
  if (day.phase?.trim() && day.label?.trim()) return day.label.trim();
  return `${day.shortWeekday} ${day.dayNumber}`.trim();
}

export function sessionClock(session: Pick<Session, "start" | "end" | "timeLabel">, timeZone: string): string {
  if (session.start && session.end) return formatRange(session.start, session.end, timeZone);
  return session.timeLabel || "Time TBC";
}

/** Tue Jan 26 · The Problem · 10:00 AM AST, using the day's phase from the program. */
export function sessionDateLine(session: Pick<Session, "dayId" | "start" | "end" | "timeLabel">, days: Day[], timeZone: string): string {
  const clock = sessionClock(session, timeZone);
  const day = summitDay(days, session.dayId);
  const theme = day?.phase?.trim();
  if (!day || !theme) return clock;
  return `${day.shortWeekday} Jan ${day.dayNumber} · ${theme} · ${clock}`;
}

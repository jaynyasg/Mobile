import type { MeetingSlot, Session } from "../content/types";

export type MeetingDecision =
  | { ok: true }
  | { ok: false; session: Session; reason: string };

export function evaluateMeeting(slot: MeetingSlot, sessions: Session[]): MeetingDecision {
  const start = Date.parse(slot.start);
  const end = Date.parse(slot.end);
  const conflict = sessions.find((session) => {
    if (!session.isKeynote) return false;
    const sessionStart = Date.parse(session.start);
    const sessionEnd = Date.parse(session.end);
    return start < sessionEnd && sessionStart < end;
  });
  if (!conflict) return { ok: true };
  return {
    ok: false,
    session: conflict,
    reason: `Meeting requests pause during keynotes. “${conflict.title}” overlaps this time.`,
  };
}

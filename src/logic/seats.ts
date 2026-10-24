import type { Session } from "../content/types";

export function seatsRemaining(session: Session, userHolds: boolean): number {
  const used = session.seatsHeld + (userHolds ? 1 : 0);
  return Math.max(0, session.capacity - used);
}

export function canSaveSeat(session: Session, userHolds: boolean): boolean {
  if (!session.reservable || userHolds) return false;
  return session.capacity - session.seatsHeld > 0;
}

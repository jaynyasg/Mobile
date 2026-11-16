import type { Session } from "../content/types";
import { guidedSessions, type SessionPreferences } from "./sessionGuide";

/** Suggest bases near the actual sessions matching the guest's opening answers. */
export function suggestedStayIslands(sessions: readonly Session[], preferences: Pick<SessionPreferences, "areas" | "interests">): string[] {
  if (!preferences.areas.length && !preferences.interests.length) return [];
  return [...new Set(guidedSessions(sessions, { ...preferences, goals: [] }).map((session) => session.island))];
}

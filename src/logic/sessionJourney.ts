import type { Session } from "../content/types";

export const METHOD = [
  { phase: "The Problem", title: "Identify the problem", short: "Identify", line: "Name a real island need, who it affects, and the people who can help close the gap." },
  { phase: "The Plan / Solution", title: "Shape the solution", short: "Plan", line: "Bring operators, students, experts, and capital together around a practical use case and a testable plan." },
  { phase: "Build", title: "Build & test", short: "Build & test", line: "Build or apply the solution, test it with a real use case, and learn from the people who would use it." },
  { phase: "Showcase", title: "Showcase & expand", short: "Showcase & expand", line: "Show the result, gather feedback, and agree who will carry the work into a local pilot and new places." },
] as const;

export function connectedSessions(sessions: readonly Session[], session: Session): Session[] {
  if (!session.workstream) return [session];
  return sessions.filter(item => item.workstream === session.workstream).sort((a, b) => a.dayId.localeCompare(b.dayId) || (a.start ?? "").localeCompare(b.start ?? ""));
}

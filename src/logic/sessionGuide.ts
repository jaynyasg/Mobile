import type { Session } from "../content/types";
import { sessionInterest, TECH_INTERESTS } from "./techInterest";

export const SESSION_GOALS = [
  { id: "understand", title: "Understand the challenge", phase: "The Problem", line: "Hear local perspectives, examine evidence, and find a problem worth solving." },
  { id: "plan", title: "Shape a solution", phase: "The Plan / Solution", line: "Turn a challenge into a practical plan with people from different fields." },
  { id: "build", title: "Build something useful", phase: "Build", line: "Work on a prototype, tool, or service and put your skills into practice." },
  { id: "share", title: "Share ideas and find partners", phase: "Showcase", line: "Explore the results, offer feedback, and find ways to keep collaborating." },
] as const;

export type SessionGoal = typeof SESSION_GOALS[number]["id"];
export interface SessionPreferences { areas: string[]; interests: string[]; goals: SessionGoal[] }

export const SUBTOPIC_COPY: Record<typeof TECH_INTERESTS[number], string> = {
  EdTech: "Education, learning, and skills",
  AgriTech: "Farming and local food systems",
  MedTech: "Health and access to care",
  SportsTech: "Sport and the athlete experience",
  LegalTech: "Rights, rules, and legal services",
  MediaTech: "Creators, storytelling, and media",
  XR: "Immersive and virtual experiences",
  FilmTech: "Film, production, and screenings",
  NewsTech: "Journalism and newsrooms",
  MarketingTech: "Brands and reaching audiences",
  FinTech: "Funding, payments, and finance",
  TravelTech: "Journeys, transport, and bookings",
  HospitalityTech: "Hotels and the guest experience",
  EventTech: "Events and shared experiences",
  AdminTech: "Public services and everyday workflows",
};

export function sessionGoal(phase: string) {
  return SESSION_GOALS.find((goal) => goal.phase === phase);
}

export function availableSubtopics(sessions: readonly Session[], areas: readonly string[]) {
  return TECH_INTERESTS.map((id) => ({ id, line: SUBTOPIC_COPY[id], count: sessions.filter((session) => (!areas.length || areas.includes(session.pillarId)) && sessionInterest(session) === id).length })).filter((item) => item.count > 0);
}

/** Match every selected dimension; never label an unrelated fallback as a match. */
export function guidedSessions(sessions: readonly Session[], preferences: SessionPreferences): Session[] {
  return sessions.filter((session) => {
    if (preferences.areas.length && !preferences.areas.includes(session.pillarId)) return false;
    const interest = sessionInterest(session);
    if (preferences.interests.length && (!interest || !preferences.interests.includes(interest))) return false;
    const goal = sessionGoal(session.phase);
    if (preferences.goals.length && (!goal || !preferences.goals.includes(goal.id))) return false;
    return true;
  }).sort((a, b) => a.dayId.localeCompare(b.dayId) || (a.start ?? "9999").localeCompare(b.start ?? "9999") || a.title.localeCompare(b.title));
}

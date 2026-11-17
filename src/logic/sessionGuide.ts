import type { Session } from "../content/types";
import { sessionInterest, TECH_INTERESTS } from "./techInterest";
import { sessionNeeds } from "./islandNeeds";
import { METHOD } from "./sessionJourney";

export const SESSION_GOALS = [
  { id: "understand", title: "Understand the challenge", phase: "The Problem", line: "Hear local perspectives, examine evidence, and find a problem worth solving." },
  { id: "plan", title: "Shape a solution", phase: "The Plan / Solution", line: "Turn a challenge into a practical plan with people from different fields." },
  { id: "build", title: "Build and test a use case", phase: "Build", line: METHOD[2].line },
  { id: "share", title: "Showcase and expand the work", phase: "Showcase", line: METHOD[3].line },
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
  // Combine all selected areas. A shared field appears once, with all of its matching areas.
  const included = sessions.filter((session) => !areas.length || areas.includes(session.pillarId));
  return TECH_INTERESTS.map((id) => {
    const matches = included.filter((session) => sessionInterest(session) === id);
    return { id, line: SUBTOPIC_COPY[id], count: matches.length, areaIds: [...new Set(matches.map((session) => session.pillarId))] };
  }).filter((item) => item.count > 0);
}

/** Match every selected dimension; never label an unrelated fallback as a match. */
export function guidedSessions(sessions: readonly Session[], preferences: SessionPreferences): Session[] {
  return sessions.filter((session) => {
    if (preferences.areas.length && !preferences.areas.includes(session.pillarId)) return false;
    const interest = sessionInterest(session);
    const fields: string[] = [...sessionNeeds(session), ...(interest ? [interest] : [])];
    if (preferences.interests.length && !preferences.interests.some(value => fields.includes(value))) return false;
    const goal = sessionGoal(session.phase);
    if (preferences.goals.length && (!goal || !preferences.goals.includes(goal.id))) return false;
    return true;
  }).sort((a, b) => a.dayId.localeCompare(b.dayId) || (a.start ?? "9999").localeCompare(b.start ?? "9999") || a.title.localeCompare(b.title));
}

import type { Session } from "../content/types";

export const ISLAND_NEEDS = [
  { id: "need:food", title: "Food & agriculture", line: "Local harvests, fisheries, food supply, and access to buyers." },
  { id: "need:commerce", title: "Banking & local commerce", line: "Payments, local businesses, funding, ownership, and shared value." },
  { id: "need:services", title: "Health & public services", line: "Better access to care, reliable information, and everyday services." },
  { id: "need:energy", title: "Energy & resilience", line: "Power, connectivity, continuity, and essential services during disruption." },
  { id: "need:ocean", title: "Ocean, climate & environment", line: "Coastal observations, water, habitats, and responsible use of island resources." },
  { id: "need:hospitality", title: "Hospitality & mobility", line: "Welcoming guests and connecting arrivals, stays, boats, and experiences." },
  { id: "need:education", title: "Education & workforce", line: "Learning Labs, skills, mentorship, and pathways to opportunity." },
  { id: "need:culture", title: "Culture, film, sport & gaming", line: "Island stories, creative ownership, audiences, and immersive experiences." },
] as const;
export type IslandNeed = typeof ISLAND_NEEDS[number]["id"];

// Curated against the existing program: related sessions retain the same needs across all four days.
const SERIES: Record<IslandNeed, readonly string[]> = {
  "need:food": ["T2", "R4"],
  "need:commerce": ["TECH-B", "T2", "T5", "A3", "R4", "R5", "TRAVEL-B", "E4", "E5", "E8", "L2", "L3", "L4", "L6", "L8", "LAW-A", "LAW-B"],
  "need:services": ["T1", "T5", "T7", "A1", "A2", "A5", "A6", "A8", "L1", "L3", "L6", "TECH-A"],
  "need:energy": ["T4", "T8", "TECH-A"],
  "need:ocean": ["T3", "R6"],
  "need:hospitality": ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "TRAVEL-A", "TRAVEL-B", "AI-A"],
  "need:education": ["T6", "A4", "A7", "AI-A", "AI-B", "ENT-B", "E3", "E7", "E8", "L7"],
  "need:culture": ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "ENT-A", "ENT-B", "L2", "LAW-A"],
};
export function sessionNeeds(session: Pick<Session, "workstream" | "pillarId">): IslandNeed[] {
  return ISLAND_NEEDS.filter(need => SERIES[need.id].includes(session.workstream) || (need.id === "need:culture" && session.pillarId === "entertainment")).map(need => need.id);
}
export function availableNeeds(sessions: readonly Session[], areas: readonly string[]) {
  const included = sessions.filter(session => !areas.length || areas.includes(session.pillarId));
  return ISLAND_NEEDS.map(need => {
    const matches = included.filter(session => sessionNeeds(session).includes(need.id));
    return { ...need, count: matches.length, areaIds: [...new Set(matches.map(session => session.pillarId))] };
  }).filter(need => need.count > 0);
}

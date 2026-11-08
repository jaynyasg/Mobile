import type { Panelist, Session, SessionKind } from "../content/types";

export function filterAgenda(input: {
  sessions: Session[];
  panelists: Panelist[];
  dayId: string | "all";
  pillarId: string | "all";
  island: string | "all";
  kind: SessionKind;
  panelistId: string | "all";
  query: string;
  favoriteIds: string[];
  favoritesOnly: boolean;
}): Session[] {
  const needle = input.query.trim().toLowerCase();
  const names = new Map(input.panelists.map((person) => [person.id, person.name.toLowerCase()]));

  return input.sessions
    .filter((session) => {
      if (input.dayId !== "all" && session.dayId !== input.dayId) return false;
      if (input.pillarId !== "all" && session.pillarId !== input.pillarId) return false;
      if (input.island !== "all" && session.island !== input.island) return false;
      if (input.kind === "featured" && !session.featured) return false;
      if (input.kind === "regular" && session.featured) return false;
      if (input.kind === "circuit" && session.featureRole !== "Circuit feature") return false;
      if (input.favoritesOnly && !input.favoriteIds.includes(session.id)) return false;
      if (input.panelistId !== "all") {
        const involved = session.speakerIds.includes(input.panelistId) || session.candidateIds.includes(input.panelistId);
        if (!involved) return false;
      }
      if (!needle) return true;
      const people = [...session.speakerIds, ...session.candidateIds].map((id) => names.get(id) ?? "").join(" ");
      const haystack = `${session.title} ${session.description} ${session.outcome} ${session.island} ${session.format} ${people}`.toLowerCase();
      return haystack.includes(needle);
    })
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start) || Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
}

export function mySchedule(sessions: Session[], favoriteIds: string[]): Session[] {
  const ids = new Set(favoriteIds);
  return sessions.filter((session) => ids.has(session.id)).sort((a, b) => a.start.localeCompare(b.start));
}

export function upcomingSessions(sessions: Session[], now: Date, limit: number): Session[] {
  const future = sessions.filter((session) => Date.parse(session.end) > now.getTime());
  const source = future.length > 0 ? future : sessions;
  return source.slice(0, limit);
}

import type { Room, Session, Speaker, TrackId } from "../content/types";

export type AgendaLens = "all" | "favorites" | "seats";

export function filterAgenda(input: {
  sessions: Session[];
  speakers: Speaker[];
  rooms: Room[];
  dayId: string | "all";
  trackId: TrackId | "all";
  lens: AgendaLens;
  query: string;
  favoriteIds: string[];
  heldSeatIds: string[];
}): Session[] {
  const needle = input.query.trim().toLowerCase();
  const speakerName = new Map(input.speakers.map((speaker) => [speaker.id, speaker.name.toLowerCase()]));
  const roomName = new Map(input.rooms.map((room) => [room.id, room.name.toLowerCase()]));

  return input.sessions
    .filter((session) => {
      if (input.dayId !== "all" && session.dayId !== input.dayId) return false;
      if (input.trackId !== "all" && session.trackId !== input.trackId) return false;
      if (input.lens === "favorites" && !input.favoriteIds.includes(session.id)) return false;
      if (input.lens === "seats" && !input.heldSeatIds.includes(session.id)) return false;
      if (!needle) return true;
      const names = session.speakerIds.map((id) => speakerName.get(id) ?? "").join(" ");
      const haystack = `${session.title} ${session.summary} ${names} ${roomName.get(session.roomId) ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    })
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

export function mySchedule(sessions: Session[], favoriteIds: string[], heldSeatIds: string[]): Session[] {
  const ids = new Set([...favoriteIds, ...heldSeatIds]);
  return sessions.filter((session) => ids.has(session.id)).sort((a, b) => a.start.localeCompare(b.start));
}

export function upcomingSessions(sessions: Session[], now: Date, limit: number): Session[] {
  const visible = sessions.filter((session) => session.format !== "social");
  const future = visible.filter((session) => Date.parse(session.end) > now.getTime());
  const source = future.length > 0 ? future : visible;
  return source.slice(0, limit);
}

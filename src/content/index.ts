/**
 * Public TATEL Conversations program.
 * Plain TypeScript over generated JSON: no React and no React Native.
 * A website can import this module, or read tatel.json, the same way the app does.
 * Regenerate with scripts/generate-tatel-content.mjs. Do not edit tatel.json by hand.
 */
import { getProgram } from "./active";
import { bundle } from "./bundle";
import type { Panelist, Pass, Pillar, Place, Session, StayIsland, TransportMode, Venue } from "./types";

const data = bundle;

export const forum = data.forum;
export const panelists = data.panelists;
export const sessions = data.sessions;
export const venues = data.venues;
export const places = data.places;
export const sampleModel = data.sampleModel;
export const scenes = data.scenes;
export const stays = data.stays;
export const passes = data.passes;
export const transport = data.transport;
export const notifications = data.notifications;
export const credits = data.credits;
export const generatedFrom = data.generatedFrom;

export type * from "./types";

export function panelistById(id: string): Panelist | undefined {
  return getProgram().panelists.find((person) => person.id === id);
}

export function sessionById(id: string): Session | undefined {
  return getProgram().sessions.find((session) => session.id === id);
}

export function pillarById(id: string): Pillar | undefined {
  return getProgram().forum.pillars.find((pillar) => pillar.id === id);
}

export function dayById(id: string) {
  return getProgram().forum.days.find((day) => day.id === id);
}

export function sessionsForPanelist(panelistId: string): Session[] {
  return getProgram().sessions.filter(
    (session) => session.speakerIds.includes(panelistId) || session.candidateIds.includes(panelistId),
  );
}

export function participationLabel(session: Session, panelistId: string): string | null {
  return session.roles?.[panelistId] ?? (session.speakerIds.includes(panelistId) ? "Session lead" : null);
}

export function panelistNames(ids: string[]): string {
  return ids
    .map((id) => panelistById(id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

export function stayIslands(): StayIsland[] {
  return getProgram().stays.groups.flatMap((group) => group.islands);
}

export function stayById(id: string): StayIsland | undefined {
  return stayIslands().find((island) => island.id === id);
}

export function venueById(id: string): Venue | undefined {
  return getProgram().venues.find((venue) => venue.id === id);
}

export function placeById(id: string): Place | undefined {
  return getProgram().places.find((place) => place.id === id);
}

export function placesForIsland(island: string): Place[] {
  return getProgram().places.filter((place) => place.island === island);
}

export function venueLabel(session: Session): string {
  if (!session.venue.venueId && !session.venue.island) return "Venue unassigned";
  const venue = session.venue.venueId ? venueById(session.venue.venueId) : undefined;
  if (venue) return `${venue.name} · ${venue.island}`;
  return [session.venue.island, session.venue.venueId].filter(Boolean).join(" · ");
}

export function passById(id: string): Pass | undefined {
  return passes.items.find((pass) => pass.id === id);
}

export function transportModeById(id: string): TransportMode | undefined {
  return transport.modes.find((mode) => mode.id === id);
}

export function sceneForIsland(island: string) {
  const stay = stayIslands().find((item) => item.island === island);
  if (!stay) return scenes[0];
  return scenes.find((scene) => scene.image === stay.image) ?? scenes[0];
}

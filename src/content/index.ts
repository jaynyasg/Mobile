/**
 * Public TATEL Conversations program.
 * Plain TypeScript over generated JSON: no React and no React Native.
 * A website can import this module, or read tatel.json, the same way the app does.
 * Regenerate with scripts/generate-tatel-content.mjs. Do not edit tatel.json by hand.
 */
import raw from "./tatel.json";
import type {
  Credits,
  Forum,
  Notice,
  Panelist,
  Pass,
  Pillar,
  Scene,
  Session,
  StayGroup,
  StayIsland,
  SourceLink,
  TransportMode,
} from "./types";

interface ProgramData {
  generatedFrom: string;
  forum: Forum;
  panelists: Panelist[];
  sessions: Session[];
  scenes: Scene[];
  stays: { intro: string; brochureUrl: string; brochureNote: string; groups: StayGroup[] };
  passes: {
    legend: string;
    sourceUrl: string;
    sourceNote: string;
    previewLabel: string;
    items: Pass[];
  };
  transport: {
    checked: string;
    intro: string;
    venueAssumptions: string;
    borderNote: string;
    sources: SourceLink[];
    modes: TransportMode[];
  };
  notifications: Notice[];
  credits: Credits;
}

const data = raw as ProgramData;

export const forum = data.forum;
export const panelists = data.panelists;
export const sessions = data.sessions;
export const scenes = data.scenes;
export const stays = data.stays;
export const passes = data.passes;
export const transport = data.transport;
export const notifications = data.notifications;
export const credits = data.credits;
export const generatedFrom = data.generatedFrom;

export type * from "./types";

export function panelistById(id: string): Panelist | undefined {
  return panelists.find((person) => person.id === id);
}

export function sessionById(id: string): Session | undefined {
  return sessions.find((session) => session.id === id);
}

export function pillarById(id: string): Pillar | undefined {
  return forum.pillars.find((pillar) => pillar.id === id);
}

export function dayById(id: string) {
  return forum.days.find((day) => day.id === id);
}

export function sessionsForPanelist(panelistId: string): Session[] {
  return sessions.filter(
    (session) => session.speakerIds.includes(panelistId) || session.candidateIds.includes(panelistId),
  );
}

export function participationLabel(session: Session, panelistId: string): string | null {
  if (session.featured) {
    return session.candidateIds.includes(panelistId) ? forum.participation.featured : null;
  }
  if (session.speakerIds[0] === panelistId) return forum.participation.lead;
  if (session.speakerIds.includes(panelistId)) return forum.participation.contributor;
  return null;
}

export function panelistNames(ids: string[]): string {
  return ids
    .map((id) => panelistById(id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

export function stayIslands(): StayIsland[] {
  return stays.groups.flatMap((group) => group.islands);
}

export function stayById(id: string): StayIsland | undefined {
  return stayIslands().find((island) => island.id === id);
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

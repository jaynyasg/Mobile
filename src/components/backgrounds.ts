import { scenePhotos } from "@/theme";
import { homeMedia } from "./homeMedia";

export type SceneLoop = { mp4: string; webm?: string; poster: string };

// Per-screen loops. Missing keys use the Home day-night clip until the venue files arrive.
export const screenLoops: Record<string, SceneLoop> = {};

export function loopFor(phase?: string): SceneLoop {
  if (phase && screenLoops[phase]) return screenLoops[phase];
  return { mp4: homeMedia.mp4, webm: homeMedia.webm, poster: homeMedia.poster };
}

export type ScenePlate = {
  day: string;
  night: string;
  phase: string;
};

// Night matches day until the enhanced plates arrive.
// Point `night` at the new file and drop it in public/.
export function plate(day: string, phase: string, night = day): ScenePlate {
  return { day, night, phase };
}

const islands = scenePhotos.byIsland;

export const backgrounds = {
  program: plate(scenePhotos.day, "program"),
  session: {
    "St. Thomas": plate(islands["St. Thomas"], "session-st-thomas"),
    "St. John": plate(islands["St. John"], "session-st-john"),
    "Scrub Island": plate(islands["Scrub Island"], "session-scrub"),
    "Jost Van Dyke": plate(islands["Jost Van Dyke"], "session-jost"),
    Lovango: plate(islands.Lovango, "session-lovango"),
  } as Record<string, ScenePlate>,
  venues: plate(scenePhotos.community, "venues"),
  community: plate(scenePhotos.community, "community"),
  comments: plate(scenePhotos.community, "comments"),
  chat: plate(scenePhotos.community, "chat"),
  signIn: plate(scenePhotos.community, "sign-in"),
  more: plate(islands["St. John"], "more"),
  panelists: plate(islands["St. John"], "panelists"),
  network: plate(scenePhotos.community, "network"),
};

export function plateForIsland(island?: string | null, phase?: string): ScenePlate {
  const day = island && islands[island] ? islands[island] : scenePhotos.day;
  return plate(day, phase ?? `island-${island ?? "day"}`);
}

export function plateForPhoto(day: string, phase: string): ScenePlate {
  return plate(day, phase);
}

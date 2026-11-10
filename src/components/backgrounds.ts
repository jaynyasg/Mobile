import { homeMedia } from "./homeMedia";

export type SceneLoop = {
  mp4: string;
  webm?: string;
  poster: string;
  posterNight: string;
  focus?: string;
  zoom?: number;
};

// The only decorative moving background: White Bay coast.
// Generated scenery, not a photograph of a particular property.
// The Scrub harbor loop is not used.
export const coastal: SceneLoop = {
  mp4: homeMedia.mp4,
  poster: homeMedia.poster,
  posterNight: homeMedia.posterNight,
  focus: "center center",
  zoom: 1,
};

export const screenLoops: Record<string, SceneLoop> = {};

export function loopFor(phase?: string): SceneLoop {
  if (phase && screenLoops[phase]) return screenLoops[phase];
  return coastal;
}

export type ScenePlate = {
  day: string;
  night: string;
  phase: string;
};

function scene(phase: string): ScenePlate {
  return { day: coastal.poster, night: coastal.posterNight, phase };
}

export const backgrounds = {
  program: scene("program"),
  session: {
    "St. Thomas": scene("session-St. Thomas"),
    "St. John": scene("session-St. John"),
    "Scrub Island": scene("session-Scrub Island"),
    "Jost Van Dyke": scene("session-Jost Van Dyke"),
    Lovango: scene("session-Lovango"),
  } as Record<string, ScenePlate>,
  venues: scene("venues"),
  community: scene("community"),
  comments: scene("comments"),
  chat: scene("chat"),
  signIn: scene("sign-in"),
  more: scene("more"),
  panelists: scene("panelists"),
  network: scene("network"),
  home: scene("home"),
};

export function plateForIsland(island?: string | null, phase?: string): ScenePlate {
  if (island && backgrounds.session[island]) {
    const match = backgrounds.session[island];
    return phase ? { ...match, phase } : match;
  }
  return phase ? { ...backgrounds.program, phase } : backgrounds.program;
}

export function plateForPhoto(_day: string, phase: string): ScenePlate {
  const key = phase.startsWith("place-") ? phase : `place-${phase}`;
  return scene(key);
}

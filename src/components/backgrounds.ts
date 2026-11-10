import { homeMedia } from "./homeMedia";

export type SceneLoop = {
  mp4: string;
  webm?: string;
  poster: string;
  posterNight: string;
  focus?: string;
  zoom?: number;
};

function clip(name: string, focus = "center center", zoom = 1): SceneLoop {
  const base = `/beacon/loops/${name}`;
  return {
    mp4: `${base}-loop.mp4`,
    poster: `${base}-poster-day.jpg`,
    posterNight: `${base}-poster-night.jpg`,
    focus,
    zoom,
  };
}

// Zoom anchors the phone on the water. Landscape files still cannot
// invent a pool that only exists in a corner; Gallows and Hideout pool
// stay provisional until the portrait replacements arrive.
const ritz = clip("ritz-terrace", "50% 46%", 1.5);
const emerald = clip("emerald-path");
const hideoutDeck = clip("hideout-deck", "22% 55%", 1.8);
const hideoutPool = clip("hideout-pool-deck", "78% 88%", 2.1);
const gallows = clip("gallows-terrace", "82% 100%", 2.2);
const lovango = clip("lovango-deck", "48% 42%", 1.55);
const margaritaville = clip("margaritaville-balcony", "42% 55%", 1.35);
const scrubPool = clip("scrub-villa-pool", "68% 58%", 1.45);
const scrubBeach = clip("scrub-beach-club", "18% 78%", 1.8);

function bind(loop: SceneLoop, phases: string[], into: Record<string, SceneLoop>) {
  for (const phase of phases) into[phase] = loop;
}

export const screenLoops: Record<string, SceneLoop> = {};
bind(ritz, ["program", "session-St. Thomas", "venue-st-thomas", "place-ritz-carlton-st-thomas"], screenLoops);
bind(emerald, ["session-St. John", "venue-st-john", "place-emerald-beach-resort", "more", "panelists"], screenLoops);
bind(scrubPool, ["session-Scrub Island", "venue-scrub-island"], screenLoops);
bind(scrubBeach, ["place-scrub-island-resort"], screenLoops);
bind(
  hideoutDeck,
  ["session-Jost Van Dyke", "venue-jost-van-dyke", "community", "comments", "chat", "sign-in", "profile", "network", "place-hideout-white-bay"],
  screenLoops,
);
bind(hideoutPool, ["venues"], screenLoops);
bind(lovango, ["session-Lovango", "venue-lovango", "place-lovango-resort-beach-club"], screenLoops);
bind(margaritaville, ["place-margaritaville-vacation-club"], screenLoops);
bind(gallows, ["place-gallows-point-resort"], screenLoops);

const fallback = ritz;

export function loopFor(phase?: string): SceneLoop {
  if (phase && screenLoops[phase]) return screenLoops[phase];
  return fallback;
}

export type ScenePlate = {
  day: string;
  night: string;
  phase: string;
};

function scene(loop: SceneLoop, phase: string): ScenePlate {
  return { day: loop.poster, night: loop.posterNight, phase };
}

export const backgrounds = {
  program: scene(ritz, "program"),
  session: {
    "St. Thomas": scene(ritz, "session-St. Thomas"),
    "St. John": scene(emerald, "session-St. John"),
    "Scrub Island": scene(scrubPool, "session-Scrub Island"),
    "Jost Van Dyke": scene(hideoutDeck, "session-Jost Van Dyke"),
    Lovango: scene(lovango, "session-Lovango"),
  } as Record<string, ScenePlate>,
  venues: scene(hideoutPool, "venues"),
  community: scene(hideoutDeck, "community"),
  comments: scene(hideoutDeck, "comments"),
  chat: scene(hideoutDeck, "chat"),
  signIn: scene(hideoutDeck, "sign-in"),
  more: scene(emerald, "more"),
  panelists: scene(emerald, "panelists"),
  network: scene(hideoutDeck, "network"),
  home: { day: homeMedia.poster, night: homeMedia.poster, phase: "home" },
};

export function plateForIsland(island?: string | null, phase?: string): ScenePlate {
  if (island && backgrounds.session[island]) {
    const match = backgrounds.session[island];
    return phase ? { ...match, phase } : match;
  }
  return phase ? { ...backgrounds.program, phase } : backgrounds.program;
}

export function plateForPhoto(day: string, phase: string): ScenePlate {
  const loop = loopFor(phase.startsWith("place-") ? phase : `place-${phase}`);
  return { day: loop.poster || day, night: loop.posterNight, phase: phase.startsWith("place-") ? phase : `place-${phase}` };
}

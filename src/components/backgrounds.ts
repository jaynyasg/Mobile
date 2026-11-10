import { homeMedia } from "./homeMedia";

export type SceneLoop = {
  mp4: string;
  webm?: string;
  poster: string;
  posterNight: string;
  focus?: string;
};

function clip(name: string, focus = "center center"): SceneLoop {
  const base = `/beacon/loops/${name}`;
  return {
    mp4: `${base}-loop.mp4`,
    poster: `${base}-poster-day.jpg`,
    posterNight: `${base}-poster-night.jpg`,
    focus,
  };
}

const ritz = clip("ritz-terrace");
const emerald = clip("emerald-path");
const hideoutDeck = clip("hideout-deck", "32% center");
const hideoutPool = clip("hideout-pool-deck", "58% center");
const gallows = clip("gallows-terrace", "68% center");
const lovango = clip("lovango-deck");
const margaritaville = clip("margaritaville-balcony");
const scrubPool = clip("scrub-villa-pool", "62% center");
const scrubBeach = clip("scrub-beach-club");

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

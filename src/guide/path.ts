export const GUIDE_KEY = "tatel.guide";
export const TOUR_KEY = "tatel.tourSeen";
export const WALKTHROUGH_REPLAY_KEY = "tatel.walkthroughReplay";
export const WALKTHROUGH_NAME = "Steps Walk-through";

/** Auto-advance dwell. The old beat was 2.5s; readers need at least 7s. */
export const TOUR_DWELL_MS = 7_000;

const tourLine: Record<string, string> = {
  welcome: "Welcome: watch the film",
  tracks: "Interests: choose your topics",
  sessions: "Sessions: save your favorites",
  transport: "Routes: taxis and boats",
  stay: "Accommodation: choose your island home",
  know: "Preparation guide: before you travel",
  pass: "Tickets: get your pass",
  chat: "Chat: join the room",
};

export interface GuideStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface GuideStep {
  id: string;
  headline: string;
  line: string;
  cta: string;
}

export const guideSteps = [
  { id: "welcome", headline: "Watch the welcome", line: "A short film, then you are in.", cta: "Play" },
  { id: "tracks", headline: "Choose your interests", line: "Explore Tech, AI, Travel, Entertainment, and Law. Your choices help us suggest sessions.", cta: "Choose" },
  { id: "pass", headline: "Choose your ticket", line: "Stay ashore, take a day charter, or live aboard.", cta: "Open Tickets" },
  { id: "stay", headline: "Find your accommodation", line: "Choose an island and book directly with your hotel or villa.", cta: "Open stays" },
  { id: "sessions", headline: "Save your sessions", line: "Tap a heart to add a session to My schedule.", cta: "Open Sessions" },
  { id: "transport", headline: "Plan your route", line: "Connect island stops by boat and reach the docks by taxi.", cta: "Open Routes" },
  { id: "know", headline: "Preparation guide", line: "Documents, money, driving, and the border. Island hops are by boat.", cta: "Open" },
  { id: "chat", headline: "Join the chat", line: "Talk with people at TATEL.", cta: "Open chat" },
] as const satisfies readonly GuideStep[];

export type GuideStepId = (typeof guideSteps)[number]["id"];

export interface GuideProgress {
  marked: readonly string[];
  introPlayed: boolean;
  trackCount: number;
  savedSessions: number;
  openedNotes: boolean;
}

export function readGuide(store: GuideStore | null): string[] {
  const raw = store?.getItem(GUIDE_KEY) ?? "";
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export function markGuide(store: GuideStore | null, id: string): void {
  if (!store || !id) return;
  const next = new Set(readGuide(store));
  next.add(id);
  store.setItem(GUIDE_KEY, [...next].join(","));
}

export function tourTitle(index: number): string {
  const step = guideSteps[index];
  if (!step) return "";
  return tourLine[step.id];
}

export function tourCaption(index: number): string {
  const step = guideSteps[index];
  if (!step) return "";
  return `${WALKTHROUGH_NAME} · Step ${index + 1} of ${guideSteps.length} · ${tourLine[step.id]}`;
}

export function requestWalkthrough(store: GuideStore | null): void {
  store?.setItem(WALKTHROUGH_REPLAY_KEY, "1");
}

export function consumeWalkthrough(store: GuideStore | null): boolean {
  if (store?.getItem(WALKTHROUGH_REPLAY_KEY) !== "1") return false;
  store.setItem(WALKTHROUGH_REPLAY_KEY, "");
  return true;
}

/** Height of the tour caption, used so it can sit clear of the spotlighted card. */
export const TOUR_BUBBLE = 220;

/** Place the caption under the card when it fits above the dock, otherwise above the card. */
export function captionTop(cardTop: number, cardHeight: number, dockTop: number, insetTop = 8, bubbleHeight = TOUR_BUBBLE): number {
  const gap = 12;
  const below = cardTop + cardHeight + gap;
  if (below + bubbleHeight <= dockTop - 8) return below;
  return Math.max(insetTop, cardTop - bubbleHeight - gap);
}

export function captionOverlapsCard(cardTop: number, cardHeight: number, dockTop: number, insetTop = 8, bubbleHeight = TOUR_BUBBLE): boolean {
  const top = captionTop(cardTop, cardHeight, dockTop, insetTop, bubbleHeight);
  return top + bubbleHeight > cardTop && top < cardTop + cardHeight;
}

export function hasSeenTour(store: GuideStore | null): boolean {
  return store?.getItem(TOUR_KEY) === "1";
}

export function markTourSeen(store: GuideStore | null): void {
  store?.setItem(TOUR_KEY, "1");
}

export function firstUnfinished(done: readonly boolean[]): number {
  const index = done.findIndex((item) => !item);
  return index < 0 ? 0 : index;
}

export function stepDone(id: string, progress: GuideProgress): boolean {
  if (progress.marked.includes(id)) return true;
  if (id === "welcome") return progress.introPlayed;
  if (id === "tracks") return progress.trackCount > 0;
  if (id === "sessions") return progress.savedSessions > 0;
  if (id === "know") return progress.openedNotes;
  return false;
}

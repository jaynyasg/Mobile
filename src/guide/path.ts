export const GUIDE_KEY = "tatel.guide";
export const TOUR_KEY = "tatel.tourSeen";
export const WALKTHROUGH_REPLAY_KEY = "tatel.walkthroughReplay";
export const WALKTHROUGH_NAME = "Steps Walk-through";

/** Auto-advance dwell. The old beat was 2.5s; readers need at least 7s. */
export const TOUR_DWELL_MS = 7_000;

const tourLine: Record<string, string> = {
  welcome: "Welcome: watch the film",
  tracks: "Interests: pick your infrastructures",
  sessions: "Sessions: select your session",
  transport: "Transport: see the routes",
  stay: "Stays: find where you sleep",
  know: "Guide: know before you go",
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
  { id: "tracks", headline: "Pick your infrastructures", line: "Tell us which areas you're into: Tech, AI, Travel, Entertainment, Law. We'll tailor your Sessions and route.", cta: "Choose" },
  { id: "sessions", headline: "Select Your Session", line: "Save the ones you want.", cta: "Open Sessions" },
  { id: "transport", headline: "See how to get around", line: "Powerboat, ferries, or a yacht.", cta: "Open Transport" },
  { id: "stay", headline: "Find your stay", line: "Where you sleep on each island.", cta: "Open stays" },
  { id: "know", headline: "Know before you go", line: "Passports, boats, sun, and the clock.", cta: "Open" },
  { id: "pass", headline: "Get your pass", line: "Beach, boat, or a VIP group.", cta: "Open Tickets" },
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

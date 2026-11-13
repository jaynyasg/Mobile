export const STAMPS_KEY = "tatel.stamps";

export interface StampStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

function readList(store: StampStore | null, key: string): string[] {
  const raw = store?.getItem(key) ?? "";
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export function readStamps(store: StampStore | null): string[] {
  return readList(store, STAMPS_KEY);
}

/** Returns true when the stamp is new. */
export function addStamp(store: StampStore | null, id: string): boolean {
  if (!store || !id) return false;
  const current = new Set(readStamps(store));
  if (current.has(id)) return false;
  current.add(id);
  store.setItem(STAMPS_KEY, [...current].join(","));
  return true;
}

export function islandStamp(zoneId: string): string {
  return `island:${zoneId}`;
}

export function sessionStamp(id: string): string {
  return `session:${id}`;
}

export function reelStamp(id: string): string {
  return `reel:${id}`;
}

export function knowStamp(id: string): string {
  return `know:${id}`;
}

export interface Quest {
  id: string;
  title: string;
  line: string;
  stamp: string;
}

export interface QuestSession {
  id: string;
  title: string;
  island: string;
  dayId: string;
  start: string | null;
}

export interface QuestLeg {
  date: string;
  title: string;
  time: string;
}

export function buildQuests(input: {
  dayId: string;
  sessions: QuestSession[];
  ferryLegs: QuestLeg[];
  sunsetWelcome: { date: string; description: string } | null;
}): Quest[] {
  const quests: Quest[] = [];
  const lovango = input.sessions
    .filter((session) => session.dayId === input.dayId && session.island === "Lovango" && session.start)
    .sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""))[0];
  if (lovango?.start) {
    const hour = Number(lovango.start.slice(11, 13));
    const minute = lovango.start.slice(14, 16);
    const label = `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
    quests.push({
      id: `lovango-${lovango.id}`,
      title: `Lovango at ${label}`,
      line: lovango.title,
      stamp: sessionStamp(lovango.id),
    });
  }
  const ferry = input.ferryLegs.find((leg) => leg.date === input.dayId && /→\s*(Great Harbour, )?Jost/.test(leg.title));
  if (ferry) {
    quests.push({
      id: "ferry-jost",
      title: "Take the ferry to Jost",
      line: ferry.time,
      stamp: reelStamp("transport"),
    });
  }
  const sunset = input.sunsetWelcome;
  if (sunset && /sunset welcome/i.test(sunset.description)) {
    quests.push({
      id: "sunset-welcome",
      title: "Join the sunset welcome",
      line: "Monday arrival on St. Thomas.",
      stamp: islandStamp("tech"),
    });
  }
  return quests;
}

export function questsForProgram(input: {
  dayId: string;
  sessions: QuestSession[];
  modes: { id: string; days: { date: string; items: { kind: string; title?: string; time?: string }[] }[] }[];
  weekAgenda: { date: string; description: string }[];
}): Quest[] {
  const ferry = input.modes.find((mode) => mode.id === "ferry");
  const ferryLegs: QuestLeg[] = [];
  for (const day of ferry?.days ?? []) {
    for (const item of day.items) {
      if (item.kind === "leg" && item.title && item.time) ferryLegs.push({ date: day.date, title: item.title, time: item.time });
    }
  }
  const sunset = input.weekAgenda.find((item) => /sunset welcome/i.test(item.description)) ?? null;
  return buildQuests({ dayId: input.dayId, sessions: input.sessions, ferryLegs, sunsetWelcome: sunset });
}

export function adventureLine(quests: Quest[], stamps: string[], fallback: string): { title: string; line: string; stamp: string | null } {
  const open = quests.find((quest) => !stamps.includes(quest.stamp));
  if (open) return { title: open.title, line: open.line, stamp: open.stamp };
  return { title: "Today's adventure", line: fallback, stamp: null };
}

export function pulse(reduced: boolean): void {
  if (reduced || typeof navigator === "undefined") return;
  const vibrate = (navigator as Navigator & { vibrate?: (pattern: number) => boolean }).vibrate;
  vibrate?.call(navigator, 12);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

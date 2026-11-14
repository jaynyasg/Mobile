export const INTRO_DAY_KEY = "tatel.introDay";
export const EXPLORED_KEY = "tatel.explored";
export const CHAPTER_KEY = "tatel.reelsSeen";

export interface ReelStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface ReelConnection {
  reducedMotion: boolean;
  saveData: boolean;
  slow: boolean;
}

export function localDay(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function introPlayback(store: ReelStore | null, connection: ReelConnection, date = new Date()): "video" | "poster" | "skip" {
  if (store?.getItem(INTRO_DAY_KEY) === localDay(date)) return "skip";
  if (connection.reducedMotion || connection.saveData || connection.slow) return "poster";
  return "video";
}

export function markIntroPlayed(store: ReelStore | null, date = new Date()): void {
  store?.setItem(INTRO_DAY_KEY, localDay(date));
}

function readSet(store: ReelStore | null, key: string): Set<string> {
  const raw = store?.getItem(key) ?? "";
  return new Set(raw.split(",").map((item) => item.trim()).filter(Boolean));
}

function writeSet(store: ReelStore | null, key: string, values: Set<string>): void {
  store?.setItem(key, [...values].join(","));
}

export function hasSeenChapter(store: ReelStore | null, id: string): boolean {
  return readSet(store, CHAPTER_KEY).has(id);
}

export function markChapterSeen(store: ReelStore | null, id: string): void {
  const values = readSet(store, CHAPTER_KEY);
  values.add(id);
  writeSet(store, CHAPTER_KEY, values);
}

export function isExplored(store: ReelStore | null, zoneId: string): boolean {
  return readSet(store, EXPLORED_KEY).has(zoneId);
}

export function markExplored(store: ReelStore | null, zoneId: string): void {
  const values = readSet(store, EXPLORED_KEY);
  values.add(zoneId);
  writeSet(store, EXPLORED_KEY, values);
}

export function localReelStore(): ReelStore | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function sessionReelStore(): ReelStore | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

export function readConnection(): ReelConnection {
  if (typeof window === "undefined") return { reducedMotion: false, saveData: false, slow: false };
  const reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const slow = connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
  return { reducedMotion, saveData: Boolean(connection?.saveData), slow };
}

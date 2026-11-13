export const TRACKS_KEY = "tatel.tracks";
export const UNLOCK_SEEN_KEY = "tatel.unlockSeen";

export interface TrackStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

function readList(store: TrackStore | null, key: string): string[] {
  const raw = store?.getItem(key) ?? "";
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export function readTracks(store: TrackStore | null): string[] {
  return readList(store, TRACKS_KEY);
}

export function writeTracks(store: TrackStore | null, ids: string[]): void {
  store?.setItem(TRACKS_KEY, [...new Set(ids)].join(","));
}

export function unlockSeen(store: TrackStore | null): boolean {
  return store?.getItem(UNLOCK_SEEN_KEY) === "1";
}

export function markUnlockSeen(store: TrackStore | null): void {
  store?.setItem(UNLOCK_SEEN_KEY, "1");
}

export function webTrackStore(): TrackStore | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

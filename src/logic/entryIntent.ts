import type { IntakeStore } from "./intake";
export type EntryIntent = "ticket" | "stay" | "explore";
const KEY = "tatel.entryIntent";
export function saveEntryIntent(store: IntakeStore | null, intent: EntryIntent) { try { store?.setItem(KEY, intent); } catch { /* The app remains browsable when storage is unavailable. */ } }
export function takeEntryIntent(store: IntakeStore | null): EntryIntent | null {
  try {
  const intent = store?.getItem(KEY);
  if (!["ticket", "stay", "explore"].includes(intent ?? "")) return null;
  store?.setItem(KEY, "");
  return intent as EntryIntent;
  } catch { return null; }
}

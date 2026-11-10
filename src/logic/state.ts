import type { Citation } from "./assistant";

export const STORAGE_KEY = "tatel.personal.v1";
export const PASS_PAYLOAD_PREFIX = "tatel:pass-preview:";

export interface Profile {
  name: string;
  title: string;
  company: string;
  bio: string;
}

export interface ChatMessage {
  id: string;
  from: "you" | "note";
  text: string;
  at: string;
}

export interface GuideTurn {
  id: string;
  role: "you" | "guide";
  text: string;
  citations: Citation[];
}

export interface PersonalState {
  favoriteIds: string[];
  readNotificationIds: string[];
  networkingOptIn: boolean;
  profile: Profile;
  threads: Record<string, ChatMessage[]>;
  guide: GuideTurn[];
}

export type Action =
  | { type: "hydrate"; state: PersonalState }
  | { type: "toggleFavorite"; id: string }
  | { type: "markNotificationRead"; id: string }
  | { type: "markAllNotificationsRead"; ids: string[] }
  | { type: "setNetworkingOptIn"; value: boolean }
  | { type: "updateProfile"; patch: Partial<Profile> }
  | { type: "sendMessage"; panelistId: string; message: ChatMessage }
  | { type: "addGuideTurn"; turn: GuideTurn }
  | { type: "deleteAllData" };

export function blankState(): PersonalState {
  return {
    favoriteIds: [],
    readNotificationIds: [],
    networkingOptIn: false,
    profile: { name: "", title: "", company: "", bio: "" },
    threads: {},
    guide: [],
  };
}

export function initialState(): PersonalState {
  return blankState();
}

export function passPayload(passId: string): string {
  return `${PASS_PAYLOAD_PREFIX}${passId}`;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function reducer(state: PersonalState, action: Action): PersonalState {
  switch (action.type) {
    case "hydrate":
      return sanitizeState(action.state);
    case "toggleFavorite":
      return { ...state, favoriteIds: toggle(state.favoriteIds, action.id) };
    case "markNotificationRead":
      if (state.readNotificationIds.includes(action.id)) return state;
      return { ...state, readNotificationIds: [...state.readNotificationIds, action.id] };
    case "markAllNotificationsRead":
      return { ...state, readNotificationIds: [...new Set([...state.readNotificationIds, ...action.ids])] };
    case "setNetworkingOptIn":
      return { ...state, networkingOptIn: action.value };
    case "updateProfile":
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case "sendMessage":
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.panelistId]: [...(state.threads[action.panelistId] ?? []), action.message],
        },
      };
    case "addGuideTurn":
      return { ...state, guide: [...state.guide, action.turn].slice(-20) };
    case "deleteAllData":
      return blankState();
    default:
      return state;
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function sanitizeState(value: unknown): PersonalState {
  const base = blankState();
  if (!value || typeof value !== "object") return base;
  const record = value as Record<string, unknown>;
  const profileRaw = record.profile;
  const profile =
    profileRaw && typeof profileRaw === "object"
      ? {
          name: str((profileRaw as Profile).name),
          title: str((profileRaw as Profile).title),
          company: str((profileRaw as Profile).company),
          bio: str((profileRaw as Profile).bio),
        }
      : base.profile;

  return {
    favoriteIds: stringList(record.favoriteIds),
    readNotificationIds: stringList(record.readNotificationIds),
    networkingOptIn: record.networkingOptIn === true,
    profile,
    threads: sanitizeThreads(record.threads),
    guide: sanitizeGuide(record.guide),
  };
}

function sanitizeThreads(value: unknown): PersonalState["threads"] {
  if (!value || typeof value !== "object") return {};
  const threads: PersonalState["threads"] = {};
  for (const [key, messages] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(messages)) continue;
    const clean = messages.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const message = item as ChatMessage;
      if (typeof message.id !== "string" || typeof message.text !== "string" || typeof message.at !== "string") return [];
      if (message.from !== "you" && message.from !== "note") return [];
      return [{ id: message.id, from: message.from, text: message.text, at: message.at }];
    });
    threads[key] = clean;
  }
  return threads;
}

function sanitizeGuide(value: unknown): GuideTurn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const turn = item as GuideTurn;
    if (typeof turn.id !== "string" || typeof turn.text !== "string") return [];
    if (turn.role !== "you" && turn.role !== "guide") return [];
    const citations = Array.isArray(turn.citations)
      ? turn.citations.flatMap((citation) => {
          if (!citation || typeof citation !== "object") return [];
          const entry = citation as Citation;
          if (typeof entry.title !== "string" || typeof entry.id !== "string") return [];
          if (entry.kind !== "session" && entry.kind !== "panelist" && entry.kind !== "screen") return [];
          return [{ title: entry.title, kind: entry.kind, id: entry.id }];
        })
      : [];
    return [{ id: turn.id, role: turn.role, text: turn.text, citations }];
  });
}

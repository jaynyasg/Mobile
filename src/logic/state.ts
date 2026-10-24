import type { Session } from "../content/types";
import type { Citation } from "./assistant";
import { canSaveSeat } from "./seats";

export const PASS_ID = "PA-20481";
export const PASS_PAYLOAD = `portico:badge:${PASS_ID}`;
export const STORAGE_KEY = "portico.personal.v1";

export interface Profile {
  name: string;
  title: string;
  company: string;
  bio: string;
}

export interface ChatMessage {
  id: string;
  from: "you" | "them";
  text: string;
  at: string;
  scripted?: boolean;
}

export interface MeetingRequest {
  id: string;
  attendeeId: string;
  slotId: string;
  createdAt: string;
}

export interface AskedQuestion {
  id: string;
  sessionId: string;
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
  heldSeatIds: string[];
  readNotificationIds: string[];
  networkingOptIn: boolean;
  profile: Profile;
  threads: Record<string, ChatMessage[]>;
  meetingRequests: MeetingRequest[];
  pollVotes: Record<string, string>;
  questions: AskedQuestion[];
  sharedCardSponsorIds: string[];
  guide: GuideTurn[];
}

export type Action =
  | { type: "hydrate"; state: PersonalState }
  | { type: "toggleFavorite"; id: string }
  | { type: "toggleSeat"; session: Session }
  | { type: "markNotificationRead"; id: string }
  | { type: "markAllNotificationsRead"; ids: string[] }
  | { type: "setNetworkingOptIn"; value: boolean }
  | { type: "updateProfile"; patch: Partial<Profile> }
  | { type: "sendMessage"; attendeeId: string; message: ChatMessage }
  | { type: "requestMeeting"; request: MeetingRequest }
  | { type: "vote"; pollId: string; optionId: string }
  | { type: "askQuestion"; question: AskedQuestion }
  | { type: "leaveCard"; sponsorId: string }
  | { type: "addGuideTurn"; turn: GuideTurn }
  | { type: "deleteAllData" };

const sampleProfile: Profile = {
  name: "Jordan Hale",
  title: "Product",
  company: "Independent",
  bio: "Here for the climate sessions and the longer company-building conversations.",
};

export function blankState(): PersonalState {
  return {
    favoriteIds: [],
    heldSeatIds: [],
    readNotificationIds: [],
    networkingOptIn: false,
    profile: { name: "", title: "", company: "", bio: "" },
    threads: {},
    meetingRequests: [],
    pollVotes: {},
    questions: [],
    sharedCardSponsorIds: [],
    guide: [],
  };
}

export function initialState(): PersonalState {
  return {
    ...blankState(),
    profile: { ...sampleProfile },
    threads: {
      "samira-qureshi": [
        {
          id: "seed-samira",
          from: "them",
          text: "Are you going to the grid session on Tuesday? I have a question about factories that is not a pitch.",
          at: "2026-10-23T18:05:00-07:00",
          scripted: true,
        },
      ],
    },
  };
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
    case "toggleSeat": {
      const holds = state.heldSeatIds.includes(action.session.id);
      if (holds) {
        return { ...state, heldSeatIds: state.heldSeatIds.filter((id) => id !== action.session.id) };
      }
      if (!canSaveSeat(action.session, false)) return state;
      return { ...state, heldSeatIds: [...state.heldSeatIds, action.session.id] };
    }
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
          [action.attendeeId]: [...(state.threads[action.attendeeId] ?? []), action.message],
        },
      };
    case "requestMeeting": {
      const exists = state.meetingRequests.some(
        (request) => request.attendeeId === action.request.attendeeId && request.slotId === action.request.slotId,
      );
      if (exists) return state;
      return { ...state, meetingRequests: [...state.meetingRequests, action.request] };
    }
    case "vote":
      return { ...state, pollVotes: { ...state.pollVotes, [action.pollId]: action.optionId } };
    case "askQuestion":
      return { ...state, questions: [...state.questions, action.question] };
    case "leaveCard":
      return { ...state, sharedCardSponsorIds: toggle(state.sharedCardSponsorIds, action.sponsorId) };
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
  const base = initialState();
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
    heldSeatIds: stringList(record.heldSeatIds),
    readNotificationIds: stringList(record.readNotificationIds),
    networkingOptIn: record.networkingOptIn === true,
    profile,
    threads: sanitizeThreads(record.threads),
    meetingRequests: sanitizeMeetings(record.meetingRequests),
    pollVotes: sanitizeVotes(record.pollVotes),
    questions: sanitizeQuestions(record.questions),
    sharedCardSponsorIds: stringList(record.sharedCardSponsorIds),
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
      if (message.from !== "you" && message.from !== "them") return [];
      return [{ id: message.id, from: message.from, text: message.text, at: message.at, scripted: Boolean(message.scripted) }];
    });
    threads[key] = clean;
  }
  return threads;
}

function sanitizeMeetings(value: unknown): MeetingRequest[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const request = item as MeetingRequest;
    if (typeof request.id !== "string" || typeof request.attendeeId !== "string" || typeof request.slotId !== "string") {
      return [];
    }
    return [{ id: request.id, attendeeId: request.attendeeId, slotId: request.slotId, createdAt: str(request.createdAt) }];
  });
}

function sanitizeVotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const votes: Record<string, string> = {};
  for (const [key, option] of Object.entries(value as Record<string, unknown>)) {
    if (typeof option === "string") votes[key] = option;
  }
  return votes;
}

function sanitizeQuestions(value: unknown): AskedQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const question = item as AskedQuestion;
    if (typeof question.id !== "string" || typeof question.sessionId !== "string" || typeof question.text !== "string") {
      return [];
    }
    return [{ id: question.id, sessionId: question.sessionId, text: question.text, at: str(question.at) }];
  });
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
          if (entry.kind !== "session" && entry.kind !== "speaker" && entry.kind !== "sponsor" && entry.kind !== "screen") {
            return [];
          }
          return [{ title: entry.title, kind: entry.kind, id: entry.id }];
        })
      : [];
    return [{ id: turn.id, role: turn.role, text: turn.text, citations }];
  });
}

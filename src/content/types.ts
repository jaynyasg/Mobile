export type TrackId = "build" | "capital" | "climate" | "design" | "policy" | "assembly";

export type SessionFormat =
  | "keynote"
  | "talk"
  | "panel"
  | "workshop"
  | "conversation"
  | "social"
  | "gathering";

export interface Day {
  id: string;
  weekday: string;
  shortWeekday: string;
  month: string;
  dayNumber: string;
  date: string;
}

export interface Track {
  id: TrackId;
  name: string;
  description: string;
  color: string;
}

export interface Room {
  id: string;
  name: string;
  floor: string;
  summary: string;
}

export interface Venue {
  name: string;
  addressLine: string;
  locality: string;
  summary: string;
  pinNote: string;
  latitude: number;
  longitude: number;
  rooms: Room[];
}

export interface ReleaseNotes {
  version: string;
  date: string;
  items: string[];
}

export interface Forum {
  id: string;
  name: string;
  edition: string;
  tagline: string;
  organizer: string;
  dateLabel: string;
  startDate: string;
  endDate: string;
  timezone: string;
  venue: Venue;
  days: Day[];
  tracks: Track[];
  conduct: string[];
  releaseNotes: ReleaseNotes;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
}

export interface Session {
  id: string;
  title: string;
  summary: string;
  dayId: string;
  start: string;
  end: string;
  trackId: TrackId;
  roomId: string;
  speakerIds: string[];
  format: SessionFormat;
  capacity: number;
  seatsHeld: number;
  reservable: boolean;
  isKeynote: boolean;
}

export interface Attendee {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  interests: string[];
  openToMeetings: boolean;
  networkingOptIn: boolean;
  reply: string;
}

export interface MeetingSlot {
  id: string;
  weekday: string;
  start: string;
  end: string;
}

export interface Deal {
  id: string;
  title: string;
  detail: string;
  code?: string;
}

export type SponsorTier = "host" | "patron" | "partner";

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  summary: string;
  deals: Deal[];
}

export interface SubEvent {
  id: "studio-walk" | "talent-market";
  name: string;
  summary: string;
  whenLabel: string;
  where: string;
  start: string;
  end: string;
}

export interface Exhibitor {
  id: string;
  subEventId: SubEvent["id"];
  name: string;
  table: string;
  summary: string;
  category: string;
  roles?: string[];
}

export interface ForumNotification {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  kind: "desk" | "schedule" | "deal" | "gathering" | "reminder";
}

export interface Poll {
  id: string;
  sessionId: string;
  question: string;
  options: { id: string; label: string }[];
}

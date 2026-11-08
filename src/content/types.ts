export interface Day {
  id: string;
  date: string;
  label: string;
  phase: string;
  weekday: string;
  shortWeekday: string;
  dayNumber: string;
}

export interface Pillar {
  id: string;
  name: string;
  island: string;
  region: string;
}

export interface Forum {
  id: string;
  name: string;
  edition: string;
  kicker: string;
  dateLabel: string;
  placeLabel: string;
  startDate: string;
  endDate: string;
  timezone: string;
  timezoneLabel: string;
  draftNotice: string;
  featuredStaffing: string;
  participation: {
    featured: string;
    lead: string;
    contributor: string;
  };
  closing: string;
  days: Day[];
  pillars: Pillar[];
}

export interface Panelist {
  id: string;
  name: string;
  company: string;
  title: string;
  photo: string;
  proposedPillarId: string;
  proposedIsland: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  outcome: string;
  dayId: string;
  start: string;
  end: string;
  pillarId: string;
  island: string;
  region: string;
  phase: string;
  format: string;
  featured: boolean;
  featureRole: string | null;
  speakerIds: string[];
  candidateIds: string[];
  specialists: string;
  status: string;
  venue: string | null;
  sourcePage: number | null;
  sourceUrl: string;
  workstream: string;
}

export type SessionKind = "all" | "featured" | "circuit" | "regular";

export interface Scene {
  id: number;
  name: string;
  image: string;
  source: string;
  sha256: string;
}

export interface StayProvider {
  name: string;
  href: string | null;
  localDeck: boolean;
}

export interface StaySection {
  heading: string;
  providers: StayProvider[];
  notes: string[];
}

export interface StayIsland {
  id: string;
  island: string;
  route: string;
  dock: string;
  image: string;
  imageAlt: string;
  sections: StaySection[];
}

export interface StayGroup {
  heading: string;
  routeLabel: string | null;
  intro: string | null;
  islands: StayIsland[];
}

export interface Pass {
  id: string;
  name: string;
  price: string;
  unit: string;
  minimum: string | null;
  paragraphs: string[];
  bullets: string[];
}

export interface TransportSessionStop {
  kind: "session";
  sessionId: string;
}

export interface TransportLeg {
  kind: "leg";
  time: string;
  title: string;
  detail: string;
  caution: boolean;
}

export type TransportItem = TransportSessionStop | TransportLeg;

export interface TransportDay {
  date: string;
  start: string;
  overnight: string;
  map: string;
  mapDescription: string;
  items: TransportItem[];
}

export interface TransportMode {
  id: string;
  name: string;
  summary: string;
  description: string;
  warning: string;
  days: TransportDay[];
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  sentAt: string;
}

export interface Credits {
  sentinel: string;
  sentinelLicense: string;
  sentinelDocumentation: string;
  sentinelPeriod: string;
  sentinelNote: string;
  coastline: string;
  portraits: string;
  logo: string;
  scenes: string;
  presentedBy: string;
}

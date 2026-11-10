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
  timingNote: string;
  weekAgenda: { date: string; label: string; description: string }[];
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
  displayName: string | null;
  bio: string;
  bioSourceLabel: string;
  origin: string;
  affiliations: string[];
  keynote: boolean;
  proposedPillarId: string;
  proposedIsland: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  outcome: string;
  dayId: string;
  start: string | null;
  end: string | null;
  timeLabel: string | null;
  supplemental: boolean;
  optional: boolean;
  pillarId: string;
  island: string;
  region: string;
  phase: string;
  format: string;
  featured: boolean;
  featureRole: string | null;
  speakerIds: string[];
  candidateIds: string[];
  roles: Record<string, string>;
  specialists: string;
  status: string;
  sourceNote: string | null;
  venue: SessionVenue;
  sourcePage: number | null;
  sourceUrl: string;
  workstream: string;
}

export interface SessionVenue {
  island: string | null;
  venueId: string | null;
  specific: string | null;
  label: string;
}

export interface VenuePhoto {
  src: string;
  alt: string;
}

export interface StayLink {
  name: string;
  href: string | null;
  localDeck: boolean;
}

export interface Venue {
  id: string;
  name: string;
  island: string;
  region: string;
  route: string;
  dock: string;
  photos: VenuePhoto[];
  video: string | null;
  model: string | null;
  boat: StayLink[];
  land: StayLink[];
  notes: string[];
  note: string;
}

export interface SampleModel {
  src: string;
  label: string;
}

export interface PlacePhoto {
  id: string;
  alt: string;
  hero: boolean;
  uncertain: boolean;
  confidence: string;
  webp640: string;
  webp1280: string;
  jpeg: string;
}

export interface PlaceModel {
  src: string;
  label: string;
}

export interface Place {
  id: string;
  name: string;
  island: string;
  islandVenueId: string;
  source: "accommodations" | "app-addition";
  sourceNote: string;
  hero: string;
  photos: PlacePhoto[];
  models: PlaceModel[];
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

export interface ProgramData {
  generatedFrom: string;
  contentUrl: string;
  forum: Forum;
  panelists: Panelist[];
  sessions: Session[];
  venues: Venue[];
  places: Place[];
  sampleModel: SampleModel;
  scenes: Scene[];
  stays: { intro: string; brochureUrl: string; brochureNote: string; groups: StayGroup[] };
  passes: {
    legend: string;
    sourceUrl: string;
    sourceNote: string;
    previewLabel: string;
    items: Pass[];
  };
  transport: {
    checked: string;
    intro: string;
    venueAssumptions: string;
    borderNote: string;
    sources: SourceLink[];
    modes: TransportMode[];
  };
  notifications: Notice[];
  credits: Credits;
}

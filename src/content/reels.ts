import { homeMedia } from "@/components/homeMedia";

/** Used only when a reel file is missing. */
export const REEL_FALLBACK_MP4 = homeMedia.mp4;
export const REEL_FALLBACK_POSTER = homeMedia.poster;

/** The intro burns TATEL into the last three seconds, so the overlay title steps aside. */
export const INTRO_TITLE_HOLD_MS = 3_000;

export function showIntroTitle(elapsedMs: number, durationMs: number): boolean {
  return elapsedMs < durationMs - INTRO_TITLE_HOLD_MS;
}

export interface Reel {
  id: string;
  title: string;
  kicker: string;
  /** Path under public/. Missing files fall back to the coastal loop. */
  mp4: string;
  poster: string;
  durationMs: number;
  kind: "intro" | "chapter";
  /** Zone id stored when the chapter is entered. */
  zoneId?: string;
}

export const reels = {
  intro: {
    id: "intro",
    title: "TATEL",
    kicker: "The tech summit on water",
    mp4: "/reels/tatel-welcome-intro.mp4",
    poster: "/reels/tatel-welcome-intro-poster.jpg",
    durationMs: 17_500,
    kind: "intro",
  },
  sessions: {
    id: "sessions",
    title: "Sessions",
    kicker: "Enter the program",
    mp4: "/reels/sessions.mp4",
    poster: "/reels/sessions.jpg",
    durationMs: 7_000,
    kind: "chapter",
  },
  venues: {
    id: "venues",
    title: "Venues",
    kicker: "The islands",
    mp4: "/reels/venues.mp4",
    poster: "/reels/venues.jpg",
    durationMs: 7_000,
    kind: "chapter",
  },
  stays: {
    id: "stays",
    title: "Stays",
    kicker: "Where you sleep",
    mp4: "/reels/stays.mp4",
    poster: "/reels/stays.jpg",
    durationMs: 7_000,
    kind: "chapter",
  },
  transport: {
    id: "transport",
    title: "Transport",
    kicker: "Sample routes",
    mp4: "/reels/transport.mp4",
    poster: "/reels/transport.jpg",
    durationMs: 7_000,
    kind: "chapter",
  },
  community: {
    id: "community",
    title: "Community",
    kicker: "The room",
    mp4: "/reels/community.mp4",
    poster: "/reels/community.jpg",
    durationMs: 7_000,
    kind: "chapter",
  },
  pass: {
    id: "pass",
    title: "Pass",
    kicker: "Your passage",
    mp4: "/reels/pass.mp4",
    poster: "/reels/pass.jpg",
    durationMs: 7_000,
    kind: "chapter",
  },
  tech: {
    id: "tech",
    title: "Tech",
    kicker: "A zone to explore",
    mp4: "/reels/tech.mp4",
    poster: "/reels/tech-poster.jpg",
    durationMs: 7_000,
    kind: "chapter",
    zoneId: "tech",
  },
  ai: {
    id: "ai",
    title: "AI",
    kicker: "A zone to explore",
    mp4: "/reels/ai.mp4",
    poster: "/reels/ai-poster.jpg",
    durationMs: 7_000,
    kind: "chapter",
    zoneId: "ai",
  },
  travel: {
    id: "travel",
    title: "Travel",
    kicker: "A zone to explore",
    mp4: "/reels/travel.mp4",
    poster: "/reels/travel-poster.jpg",
    durationMs: 7_000,
    kind: "chapter",
    zoneId: "travel",
  },
  entertainment: {
    id: "entertainment",
    title: "Entertainment",
    kicker: "A zone to explore",
    mp4: "/reels/entertainment.mp4",
    poster: "/reels/entertainment-poster.jpg",
    durationMs: 7_000,
    kind: "chapter",
    zoneId: "entertainment",
  },
  law: {
    id: "law",
    title: "Law",
    kicker: "A zone to explore",
    mp4: "/reels/law.mp4",
    poster: "/reels/law-poster.jpg",
    durationMs: 7_000,
    kind: "chapter",
    zoneId: "law",
  },
} as const satisfies Record<string, Reel>;

export type ReelId = keyof typeof reels;

export const zoneReelIds = ["tech", "ai", "travel", "entertainment", "law"] as const satisfies readonly ReelId[];

export const chapterReelIds = [
  "sessions",
  "venues",
  "stays",
  "transport",
  "community",
  "pass",
  ...zoneReelIds,
] as const satisfies readonly ReelId[];

export function reelById(id: string): Reel | undefined {
  return (reels as Record<string, Reel>)[id];
}

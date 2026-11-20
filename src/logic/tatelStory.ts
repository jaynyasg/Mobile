import type { ReelId } from "../content/reels";

const LETTERS = ["tech", "ai", "travel", "entertainment", "law"] as const;

export interface AreaCopy {
  headline: string;
  body: string;
}

/** Website lines for the five letters. Each one is different. */
export const AREA_COPY: Record<(typeof LETTERS)[number], AreaCopy> = {
  tech: {
    headline: "Technology that works here",
    body: "Build the digital and technical systems islands run on. Pilot practical tools locally, then adapt and expand them to other places.",
  },
  ai: {
    headline: "AI with local knowledge",
    body: "Put artificial intelligence to work on real island problems with local operators, students, and developers. Build with local knowledge and responsible use of data.",
  },
  travel: {
    headline: "Better journeys, connected islands",
    body: "Improve how people are hosted and move to, between, and around the islands. Connect hospitality, transport, and local businesses.",
  },
  entertainment: {
    headline: "Island culture, new possibilities",
    body: "Build the creators, platforms, and economy for culture and entertainment from the islands. Connect film, music, sport, and gaming with ownership and opportunity.",
  },
  law: {
    headline: "Build with trust",
    body: "Develop the legal frameworks and legal technology that help new products, ownership, and investment take root—and travel responsibly to new places.",
  },
};

export const FULL_NAME = "Tech, AI, Travel, Entertainment, and Law";

export const ISLANDS_LINE = "The U.S. Virgin Islands and the British Virgin Islands, in the Caribbean just east of Puerto Rico.";

export const ISLANDS_NOTE =
  "The summit connects St. Thomas, St. John, and Lovango in the USVI with Scrub Island and a location near Tortola in the BVI. The Entertainment venue and landing point are being confirmed. St. Croix is part of the wider Virgin Islands story, not a summit stop. Check Routes and the Preparation guide for island transfers and international arrivals.";

/** Each chapter has one caption on the film and a separate, untimed reading view. */
interface StoryChapter {
  id: string;
  numeral: string;
  heading: string;
  headline: string;
  caption: string;
  readLabel: string;
  film: ReelId;
  paragraphs: readonly string[];
}

export const storyChapters = [
  {
    id: "what", numeral: "I", heading: "What is TATEL?", film: "intro",
    headline: "TATEL is a Technology Mill.",
    caption: "Four days in the Virgin Islands to turn local needs into working technology.",
    readLabel: "Inside the Technology Mill",
    paragraphs: [
      "A four-day summit across the U.S. and British Virgin Islands, turning real island needs into technology that can grow beyond them.",
      "Our islands once powered the world through sugar mills. TATEL is a Technology Mill, connecting the Caribbean’s history of industry and trade to its future as a place to build, own, and shape what comes next.",
      "TATEL is a four-day summit hosted by founders building systems and community under 1878, LLC and legal technologist as well as education operators creating new pathways and Learning Labs for professional advancement in island areas at the non-profit school Center for Educational Growth (CFEG).",
      "Founders, creators, developers, investors, students, and industry leaders come together with island communities. Sessions connect resorts, beaches, and hospitality venues by water. Build useful ideas, meet extraordinary people, and make room for the islands. Your ticket determines your transport and accommodation arrangements.",
    ],
  },
  {
    id: "sessions", numeral: "II", heading: "How panels & sessions work", film: "sessions",
    headline: "Build it in the room, then test it live.",
    caption: "Follow one island challenge from its first question to a working demonstration.",
    readLabel: "Read the method",
    paragraphs: [
      "Every TATEL panel takes a real infrastructure need and works it through the same path: find the problem, build the answer, take it across the water, and grow it every year.",
      "Across connected sessions, operators, students, experts, and investors identify the problem, shape a solution, build and test a use case, then showcase the results. Each session advances one part of the journey; the work develops across all four days.",
      "Record what was tested, what you learned, who owns the next step, and what needs another trial. Your work notebook helps you carry the thread forward. Share progress with collaborators in Chat and bring evidence back to the next annual review.",
    ],
  },
  {
    id: "needs", numeral: "III", heading: "The island needs", film: "tech",
    headline: "Five letters. Five islands.",
    caption: "Tech, AI, Travel, Entertainment, and Law each have an island home. Which area would you like to help build?",
    readLabel: "Explore the five areas",
    paragraphs: [
      "These needs connect the five TATEL infrastructure areas. Choose the needs and specific fields you care about to find relevant sessions and island stays.",
    ],
  },
  {
    id: "schedule", numeral: "IV", heading: "Schedule & where", film: "transport",
    headline: "Four days. Connected work.",
    caption: "January 26–29, 2027. Identify the problem, shape the solution, build and test, then showcase the result.",
    readLabel: "See the days and islands",
    paragraphs: [
      "Connected sessions carry a challenge through the four days. You can follow a full series or join where your experience helps most. Each day works across the five infrastructure areas; your session choices and confirmed transport shape your route. Exact venues and some timings remain to be confirmed.",
    ],
  },
  {
    id: "islands", numeral: "V", heading: "Why the Virgin Islands?", film: "venues",
    headline: "A place to build. A place to belong.",
    caption: "Between sessions, there’s time for a swim, a shared table, and a conversation with someone who calls these islands home.",
    readLabel: "Meet the islands",
    paragraphs: [
      "A meeting place for Caribbean people, cultures, food, and ideas. Sailing, reefs, beautiful beaches, and shared tables become the setting for new collaborations.",
      ISLANDS_NOTE,
      "Meet panelists from the Caribbean and a wider international network. Open their profiles, follow connected sessions, and break the ice in Chat. Bring a question; leave room for the collaborator, friend, or unexpected introduction that changes what happens next.",
      "Discover beaches, local flavors, sailing, and the program's red-carpet screening. Collect island stamps as you go. Choose your ticket, plan your stay, save meaningful sessions, and discover the rest. Independent activities and accommodation have their own availability and prices.",
    ],
  },
] as const satisfies readonly StoryChapter[];

export type Chapter = (typeof storyChapters)[number];

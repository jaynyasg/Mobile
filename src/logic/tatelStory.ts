import { METHOD } from "./sessionJourney";
const LETTERS = ["tech", "ai", "travel", "entertainment", "law"] as const;

/** How long each letter stays lit before the next one. */
export const LETTER_BEAT_MS = 9_000;
/** How long each day stays up before the next one. */
export const DAY_BEAT_MS = 12_000;

export function storyBeat(kind: "letter" | "day" | "name" | "goal" | "islands" | "arc" | "experience"): number {
  return kind === "letter" ? LETTER_BEAT_MS : DAY_BEAT_MS;
}

/** The next slide, or null when the story should close into the app. */
export function advanceStory(index: number, count: number): number | null {
  if (count <= 0 || index < 0) return null;
  const next = index + 1;
  return next >= count ? null : next;
}

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

export interface TatelLetter {
  id: (typeof LETTERS)[number];
  letter: string;
  name: string;
  island: string;
}

export interface StorySlide {
  id: string;
  kind: "goal" | "name" | "letter" | "islands" | "arc" | "day" | "experience";
  kicker: string;
  title: string;
  line: string;
  note: string;
  letter?: string;
  reelId?: TatelLetter["id"];
}

export function letterPlaceLine(name: string, island: string): string {
  return `${name} · ${island === "Near Tortola" ? "near Tortola" : island}`;
}

export function dayCoverLine(dayNumber: string, phase: string): string {
  return `January ${dayNumber} · ${phase}`;
}

/** Plain line for a phase that is already in the program. Unknown phases stay blank. */
export function dayFlowLine(phase: string): string {
  return METHOD.find(step => step.phase === phase)?.line ?? "";
}

export function storyIntro(days: readonly { id: string; dayNumber: string }[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return "A summit on the water across the Virgin Islands.";
  const year = first.id.slice(0, 4);
  return `A summit on the water across the Virgin Islands, Jan ${first.dayNumber}–${last.dayNumber}, ${year}.`;
}

export function tatelLetters(pillars: readonly { id: string; name: string; island: string }[]): TatelLetter[] {
  return LETTERS.flatMap((id) => {
    const pillar = pillars.find((item) => item.id === id);
    if (!pillar) return [];
    return [{ id, letter: pillar.name.slice(0, 1).toUpperCase(), name: pillar.name, island: pillar.island }];
  });
}

/** A short day line taken from the session formats. Unknown shapes fall back to the most common format. */
export function dayBlurb(formats: readonly string[]): string {
  const blob = formats.join(" ").toLowerCase();
  if (blob.includes("problem panel") && blob.includes("evidence")) return "Problem panels and evidence.";
  if (blob.includes("solution workshop")) return "Planning solutions.";
  if (blob.includes("facilitated build") || blob.includes("build lab")) return "Building.";
  if (blob.includes("featured showcase") || blob.includes("demo and adoption")) return "Showcasing results.";
  const counts = new Map<string, number>();
  for (const format of formats) counts.set(format, (counts.get(format) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "";
}

/**
 * Letter beats use that letter's film. The goal, the name, the islands, the
 * day order, and the day beats keep the film already playing.
 */
export function storyBackground<T extends { mp4: string }>(
  slide: { kind: StorySlide["kind"]; reelId?: string } | undefined,
  current: T | null,
  library: Record<string, T>,
): T | null {
  if (!slide || slide.kind !== "letter") return current;
  const reel = slide.reelId ? library[slide.reelId] : undefined;
  return reel ?? current;
}

export function storySlides(input: {
  pillars: readonly { id: string; name: string; island: string }[];
  days: readonly { id: string; phase: string; shortWeekday: string; dayNumber: string }[];
  formatsByDay: Readonly<Record<string, readonly string[]>>;
}): StorySlide[] {
  const letters = tatelLetters(input.pillars);
  const goal: StorySlide = {
    id: "goal",
    kind: "goal",
    kicker: "What is TATEL?",
    title: "A Technology Mill. An island adventure.",
    line: "A four-day summit across the U.S. and British Virgin Islands, turning real island needs into technology that can grow beyond them.",
    note: "Founders, creators, developers, investors, students, and industry leaders come together with island communities. Sessions connect resorts, beaches, and hospitality venues by water. Build useful ideas, meet extraordinary people, and make room for the islands. Your ticket determines your transport and accommodation arrangements.",
  };
  const name: StorySlide = {
    id: "name",
    kind: "name",
    kicker: "Built here. Shared with the world.",
    title: "The people behind the purpose",
    line: "Founders building systems and community under 1878, LLC, alongside legal technologists and education operators at the Center for Educational Growth (CFEG).",
    note: "CFEG is a nonprofit school creating Learning Labs and pathways for professional advancement. TATEL connects people, knowledge, technology, and investment so the islands can build, own, and shape what comes next. The ambition is local opportunity with global reach.",
  };
  const letterSlides: StorySlide[] = letters.map((item) => ({
    id: item.id,
    kind: "letter",
    kicker: "The infrastructure we are building",
    title: AREA_COPY[item.id].headline,
    line: letterPlaceLine(item.name, item.island),
    note: AREA_COPY[item.id].body,
    letter: item.letter,
    reelId: item.id,
  }));
  const islands: StorySlide = {
    id: "islands",
    kind: "islands",
    kicker: "The Virgin Islands",
    title: "Why the Virgin Islands?",
    line: ISLANDS_LINE,
    note: "A meeting place for Caribbean people, cultures, food, and ideas. Sailing, reefs, beautiful beaches, and shared tables become the setting for new collaborations. From St. Croix's wider island story to the summit's five areas, this is a place to build opportunity that stays with the community—and can reach the world.",
  };
  const arc: StorySlide = {
    id: "arc",
    kind: "arc",
    kicker: "January 26–29, 2027",
    title: "Four days. Connected work.",
    line: "Identify. Plan. Build and test. Showcase and expand.",
    note: "Connected sessions carry a challenge through the four days. You can follow a full series or join where your experience helps most. Each day works across the five infrastructure areas; your session choices and confirmed transport shape your route. Exact venues and some timings remain to be confirmed.",
  };
  const days: StorySlide[] = input.days.map((day) => ({
    id: day.id,
    kind: "day",
    kicker: "Sessions",
    title: METHOD.find(step => step.phase === day.phase)?.title ?? day.phase,
    line: dayCoverLine(day.dayNumber, day.phase),
    note: dayFlowLine(day.phase),
  }));
  const people: StorySlide = {
    id: "people", kind: "experience", kicker: "The company is part of the magic", title: "A spark. A conversation. A possibility.",
    line: "Meet people who make you think bigger—and make the trip more fun.",
    note: "Meet panelists from the Caribbean and a wider international network. Open their profiles, follow connected sessions, and break the ice in Chat. Bring a question; leave room for the collaborator, friend, or unexpected introduction that changes what happens next.",
  };
  const getaway: StorySlide = {
    id: "getaway", kind: "experience", kicker: "Ambition meets island life", title: "Come alive between the sessions.",
    line: "Sun on your skin. Salt in the air. A reason to dress up after a day of big ideas.",
    note: "Discover beaches, local flavors, sailing, and the program's red-carpet screening. Collect island stamps as you go. Choose your ticket, plan your stay, save meaningful sessions, and discover the rest. Independent activities and accommodation have their own availability and prices.",
  };
  const mill: StorySlide = { id: "mill", kind: "goal", kicker: "The Technology Mill", title: "From island industry to island possibility", line: "The Caribbean's history of industry and trade meets its future as a place to build, own, and create.", note: "TATEL uses the idea of a Technology Mill to turn needs, stories, and challenges into practical technology and businesses. Pilot locally, adapt what works elsewhere, and leave a legacy that the next generation can build on." };
  const method: StorySlide = { id: "method", kind: "arc", kicker: "How panels and sessions work", title: "Working rooms. Real island needs.", line: "Name the gap. Bring the right people together. Build an answer and test it.", note: "Across connected sessions, operators, students, experts, and investors identify the problem, shape a solution, build and test a use case, then showcase the results. Each session advances one part of the journey; the work develops across all four days." };
  const needs: StorySlide = { id: "needs", kind: "name", kicker: "Island needs, shared possibilities", title: "Where will you make a difference?", line: "Food & agriculture · Banking & local commerce · Health & public services · Energy & resilience", note: "Ocean, climate & environment · Hospitality & mobility · Education & workforce · Culture, film, sport & gaming. These needs connect the five TATEL infrastructure areas. Choose the needs and specific fields you care about to find relevant sessions and island stays." };
  const continuation: StorySlide = { id: "continuation", kind: "experience", kicker: "After the showcase", title: "Carry it across the water", line: "Pilot locally. Expand thoughtfully. Return to the work each year.", note: "Record what was tested, what you learned, who owns the next step, and what needs another trial. Your work notebook helps you carry the thread forward. Share progress with collaborators in Chat and bring evidence back to the next annual review." };
  return [goal, name, mill, method, ...letterSlides, needs, arc, ...days, continuation, islands, people, getaway];
}

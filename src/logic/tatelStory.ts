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
    body: "Build practical tools for island life: food systems, water, energy, ports, connectivity, and public services.",
  },
  ai: {
    headline: "AI with local knowledge",
    body: "Explore how artificial intelligence can help people and organizations, using local knowledge and data responsibly.",
  },
  travel: {
    headline: "Better journeys, connected islands",
    body: "Bring hotels, boats, destinations, and local businesses together to make travel easier and create new opportunities.",
  },
  entertainment: {
    headline: "Island culture, new possibilities",
    body: "Connect film, music, sport, and gaming with technology. Create experiences that benefit both creators and their communities.",
  },
  law: {
    headline: "Build with trust",
    body: "Work through the legal questions behind new ideas: data rights, ownership, business, and responsible use of technology.",
  },
};

export const FULL_NAME = "Tech, AI, Travel, Entertainment, and Law";

export const ISLANDS_LINE = "The U.S. Virgin Islands and the British Virgin Islands, in the Caribbean just east of Puerto Rico.";

export const ISLANDS_NOTE =
  "The summit brings you to St. Thomas, St. John, and Lovango in the U.S. Virgin Islands, and Jost Van Dyke and Scrub Island in the British Virgin Islands. Plan boat transfers between summit stops. Crossing between the two territories means clearing an international border; check the Preparation guide before you travel.";

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
  return `${name} · on or near ${island}`;
}

export function dayCoverLine(dayNumber: string, phase: string): string {
  return `January ${dayNumber} · ${phase}`;
}

/** Plain line for a phase that is already in the program. Unknown phases stay blank. */
export function dayFlowLine(phase: string): string {
  if (phase === "The Problem") return "Hear from people who know the islands. Use the sessions to understand local needs, share evidence, and choose a challenge worth solving.";
  if (phase === "The Plan / Solution") return "Turn what you've learned into a practical plan. Work with people from other fields to decide what to build and who it will help.";
  if (phase === "Build") return "Put the plan to work. Collaborate on prototypes, tools, and services that can support a lasting island technology economy.";
  if (phase === "Showcase") return "Share what you've made, meet potential partners, and decide how the work can continue after the summit.";
  return "";
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
    kicker: "An extraordinary setting. A shared ambition.",
    title: "Make waves. Make it matter.",
    line: "TATEL brings local communities and global experts together in the Virgin Islands to turn bold ideas into useful work.",
    note: "Come for the people, the blue water, and the possibility. Help build practical technology through an incubator and expert network that keeps the work moving long after the summit. The adventure should leave something lasting.",
  };
  const name: StorySlide = {
    id: "name",
    kind: "name",
    kicker: "The name",
    title: FULL_NAME,
    line: "Five infrastructure areas. One invitation to make things happen.",
    note: "Bring your expertise, your questions, or your next big idea. Founders, creators, learners, investors, and island organizations come together in hands-on sessions on shore and on the water. You don't need to know every field. Curiosity belongs here.",
  };
  const letterSlides: StorySlide[] = letters.map((item) => ({
    id: item.id,
    kind: "letter",
    kicker: "What TATEL stands for",
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
    title: "Let the islands draw you in.",
    line: ISLANDS_LINE,
    note: ISLANDS_NOTE,
  };
  const arc: StorySlide = {
    id: "arc",
    kind: "arc",
    kicker: "January 26–29, 2027",
    title: "Four days to move an idea forward",
    line: "Understand the problem. Make a plan. Build together. Share the results.",
    note: "Find a challenge you care about. Meet your collaborators. Make something tangible together. Around that shared purpose, leave space for a swim, a beautiful meal, and a conversation you didn't see coming. Venues and some timings are still being confirmed.",
  };
  const days: StorySlide[] = input.days.map((day) => ({
    id: day.id,
    kind: "day",
    kicker: "Sessions",
    title: day.phase,
    line: dayCoverLine(day.dayNumber, day.phase),
    note: dayFlowLine(day.phase),
  }));
  const people: StorySlide = {
    id: "people", kind: "experience", kicker: "The company is part of the magic", title: "A spark. A conversation. A possibility.",
    line: "Meet people who make you think bigger—and make the trip more fun.",
    note: "Explore the panelists, find sessions around your interests and goals, and break the ice in Chat. Come with a question. Leave room for the collaborator, friend, or unexpected introduction that changes what happens next.",
  };
  const getaway: StorySlide = {
    id: "getaway", kind: "experience", kicker: "Ambition meets island life", title: "Come alive between the sessions.",
    line: "Sun on your skin. Salt in the air. A reason to dress up after a day of big ideas.",
    note: "Discover beaches, local flavors, and the program's red-carpet screening. Collect island stamps as you go. Shape a trip with time to build, time to connect, and time to let go. Your ticket, stay, sessions, and island guide are next.",
  };
  return [goal, name, ...letterSlides, islands, arc, ...days, people, getaway];
}

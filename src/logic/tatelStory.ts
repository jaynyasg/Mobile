const LETTERS = ["tech", "ai", "travel", "entertainment", "law"] as const;

/** How long each letter stays lit before the next one. */
export const LETTER_BEAT_MS = 3_500;
/** How long each day stays up before the next one. */
export const DAY_BEAT_MS = 5_000;

export function storyBeat(kind: "letter" | "day" | "name" | "goal" | "islands" | "arc"): number {
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
    headline: "The Place-Operating System",
    body: "Physical assets — farms, water, ports, energy, broadband, property, public services — become one digital backbone.",
  },
  ai: {
    headline: "AI That Understands a Place",
    body: "Institutional records and local knowledge become governed intelligence a place can act on.",
  },
  travel: {
    headline: "One Journey Across Waters",
    body: "Dozens of separate operators become one bookable, trackable journey that connects local businesses with the world.",
  },
  entertainment: {
    headline: "The Place as a World",
    body: "Culture, film, sport and gaming become value the creators and the community own, and can share in new expansive ways, that matter.",
  },
  law: {
    headline: "The Rules That Let the Build Travel",
    body: "A working system and newly developed systems are implemented, expanded upon, applied across places, and carried to the next place.",
  },
};

export const FULL_NAME = "Tech, AI, Travel, Entertainment, and Law";

export const ISLANDS_LINE = "The U.S. Virgin Islands and the British Virgin Islands, in the Caribbean just east of Puerto Rico.";

export const ISLANDS_NOTE =
  "The USVI is a United States territory. Its main islands are St. Thomas, St. John, and St. Croix. The BVI is a British Overseas Territory beside it. Its main islands include Tortola, Virgin Gorda, Anegada, and Jost Van Dyke. This summit meets on or near St. Thomas, St. John, Lovango, Jost Van Dyke, and Scrub Island. Boats are the only way from one of these islands to another. Be on the Beach uses the public ferry. Be on the Boat is a private charter for the day. Be on Board is the VIP charter you stay on for all 5 days.";

export interface TatelLetter {
  id: (typeof LETTERS)[number];
  letter: string;
  name: string;
  island: string;
}

export interface StorySlide {
  id: string;
  kind: "goal" | "name" | "letter" | "islands" | "arc" | "day";
  kicker: string;
  title: string;
  line: string;
  note: string;
  letter?: string;
  reelId?: TatelLetter["id"];
}

export function letterPlaceLine(name: string, island: string): string {
  return `${name}: located on or near ${island}`;
}

export function dayCoverLine(dayNumber: string, phase: string): string {
  return `Jan ${dayNumber} sessions cover ${phase}`;
}

/** Plain line for a phase that is already in the program. Unknown phases stay blank. */
export function dayFlowLine(phase: string): string {
  if (phase === "The Problem") return "Jan 26 sessions name what is broken in these places: the farms, water, ports, energy, records, journeys, stories, and rules.";
  if (phase === "The Plan / Solution") return "Jan 27 takes that problem and turns it into a plan the island can run.";
  if (phase === "Build") return "Jan 28 builds solutions across the infrastructure areas, so a tech economy forms here. The aim is production we can ship, and use later to grow that area.";
  if (phase === "Showcase") return "Jan 29 shows what the build produced, so it can be carried to the next place and grow that infrastructure area.";
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
    kicker: "The goal",
    title: "Solve it where it is",
    line: `The work is the problems in five infrastructure areas: ${FULL_NAME}.`,
    note: "Each problem belongs to a place. Farms, water, ports, energy, broadband, property, and public services. Then the records, the journeys, the stories, and the rules around them.",
  };
  const name: StorySlide = {
    id: "name",
    kind: "name",
    kicker: "The name",
    title: FULL_NAME,
    line: `TATEL spells ${FULL_NAME}.`,
    note: "The long form first. The next screens take one letter at a time.",
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
    title: "Two territories, one archipelago",
    line: ISLANDS_LINE,
    note: ISLANDS_NOTE,
  };
  const arc: StorySlide = {
    id: "arc",
    kind: "arc",
    kicker: "Why the days run in this order",
    title: "Problem, then plan, then build, then showcase",
    line: "Jan 26, then 27, then 28, then 29. Each day uses what the day before made.",
    note: "Name the problem in the place. Turn it into a plan. Build solutions across the infrastructure areas so a tech economy can form, with production we can ship. Then show that production so it can grow the area later.",
  };
  const days: StorySlide[] = input.days.map((day) => ({
    id: day.id,
    kind: "day",
    kicker: "Sessions",
    title: day.phase,
    line: dayCoverLine(day.dayNumber, day.phase),
    note: dayFlowLine(day.phase),
  }));
  return [goal, name, ...letterSlides, islands, arc, ...days];
}

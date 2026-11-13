const LETTERS = ["tech", "ai", "travel", "entertainment", "law"] as const;

/** How long each letter stays lit before the next one. */
export const LETTER_BEAT_MS = 2_500;
/** How long each day stays up before the next one. */
export const DAY_BEAT_MS = 4_000;

export function storyBeat(kind: "letter" | "day"): number {
  return kind === "letter" ? LETTER_BEAT_MS : DAY_BEAT_MS;
}

/** The next slide, or null when the story should close into the app. */
export function advanceStory(index: number, count: number): number | null {
  if (count <= 0 || index < 0) return null;
  const next = index + 1;
  return next >= count ? null : next;
}

export interface TatelLetter {
  id: (typeof LETTERS)[number];
  letter: string;
  name: string;
  island: string;
}

export interface StorySlide {
  id: string;
  kind: "letter" | "day";
  kicker: string;
  title: string;
  line: string;
  letter?: string;
  reelId?: TatelLetter["id"];
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

export function storySlides(input: {
  pillars: readonly { id: string; name: string; island: string }[];
  days: readonly { id: string; phase: string; shortWeekday: string; dayNumber: string }[];
  formatsByDay: Readonly<Record<string, readonly string[]>>;
}): StorySlide[] {
  const letters: StorySlide[] = tatelLetters(input.pillars).map((item) => ({
    id: item.id,
    kind: "letter",
    kicker: "What TATEL stands for",
    title: item.name,
    line: item.island,
    letter: item.letter,
    reelId: item.id,
  }));
  const days: StorySlide[] = input.days.map((day) => ({
    id: day.id,
    kind: "day",
    kicker: `${day.shortWeekday} Jan ${day.dayNumber}`,
    title: day.phase,
    line: dayBlurb(input.formatsByDay[day.id] ?? []),
  }));
  return [...letters, ...days];
}

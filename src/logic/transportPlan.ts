import type { Session, TransportDay, TransportItem, TransportLeg, TransportMode } from "@/content/types";

/** Measured on the route posters. Fractions of the map crop, 1440×1020, above the credit lines. */
export const ISLAND_ON_MAP: Record<string, { x: number; y: number }> = {
  "St. Thomas": { x: 521 / 1440, y: 782 / 1020 },
  Lovango: { x: 618 / 1440, y: 703 / 1020 },
  "St. John": { x: 648 / 1440, y: 766 / 1020 },
  "Jost Van Dyke": { x: 734 / 1440, y: 525 / 1020 },
  "Scrub Island": { x: 1290 / 1440, y: 512 / 1020 },
};

export const MAP_WIDTH = 1440;
export const MAP_CROP = 1020;

export function modeLabel(mode: TransportMode): string {
  if (mode.id === "powerboat") return "Powerboat";
  if (mode.id === "ferry") return "Ferries & launches";
  if (mode.id === "yacht") return "Yacht";
  return mode.name;
}

export interface RouteLeg {
  time: string;
  from: string;
  to: string;
  detail: string;
  caution: boolean;
}

export interface RouteStop {
  key: string;
  number: number | null;
  sessionId: string | null;
  title: string | null;
  island: string | null;
  when: string | null;
  status: string | null;
  legs: RouteLeg[];
}

export function legEnds(title: string): { from: string; to: string } {
  const parts = title.split(/\s*→\s*/).map((part) => part.replace(/\s*·.*$/, "").trim()).filter(Boolean);
  if (parts.length < 2) return { from: title.trim(), to: "" };
  return { from: parts[0], to: parts[parts.length - 1] };
}

function asLeg(item: TransportLeg): RouteLeg {
  const ends = legEnds(item.title);
  return { time: item.time, from: ends.from, to: ends.to, detail: item.detail, caution: item.caution };
}

export function routeStops(
  day: TransportDay,
  sessionById: (id: string) => Session | undefined,
  when: (session: Session) => string,
): RouteStop[] {
  const stops: RouteStop[] = [];
  let pending: RouteLeg[] = [];
  let number = 0;
  for (const item of day.items) {
    if (item.kind === "leg") {
      pending.push(asLeg(item));
      continue;
    }
    const session = sessionById(item.sessionId);
    number += 1;
    stops.push({
      key: item.sessionId,
      number,
      sessionId: session?.id ?? item.sessionId,
      title: session?.title ?? null,
      island: session?.island ?? null,
      when: session ? when(session) : null,
      status: session?.status ?? null,
      legs: pending,
    });
    pending = [];
  }
  if (pending.length) {
    const last = pending[pending.length - 1];
    stops.push({
      key: `after-${last.time}-${last.from}`,
      number: null,
      sessionId: null,
      title: null,
      island: null,
      when: null,
      status: null,
      legs: pending,
    });
  }
  return stops;
}

/** Minutes stated as on the water, underway, or a crossing. Null when the sentence does not say. */
export function underwayMinutes(detail: string): [number, number] | null {
  const hour = detail.match(/(\d+)h(\d{2})?\s*[–-]\s*(\d+)h(\d{2})?\s+underway/i);
  if (hour) {
    const start = Number(hour[1]) * 60 + Number(hour[2] ?? 0);
    const end = Number(hour[3]) * 60 + Number(hour[4] ?? 0);
    return [start, end];
  }
  const water = detail.match(/(\d+)\s*[–-]\s*(\d+)\+?\s*(?:minutes?\s+)?on the water/i);
  if (water) return [Number(water[1]), Number(water[2])];
  const under = detail.match(/(\d+)\s*[–-]\s*(\d+)\+?\s*(?:minutes?\s+)?underway/i);
  if (under) return [Number(under[1]), Number(under[2])];
  const crossing = detail.match(/(\d+)\s*[–-]\s*(\d+)-minute crossing/i);
  if (crossing) return [Number(crossing[1]), Number(crossing[2])];
  const approxRange = detail.match(/approximately\s+(\d+)\s*[–-]\s*(\d+)\s+minutes/i);
  if (approxRange) return [Number(approxRange[1]), Number(approxRange[2])];
  const approx = detail.match(/approximately\s+(\d+)(?:\s*[–-]minute|\s+minutes)/i);
  if (approx) return [Number(approx[1]), Number(approx[1])];
  const estimated = detail.match(/crossing estimated\s+(\d+)\s*[–-]\s*(\d+)\s+minutes/i);
  if (estimated) return [Number(estimated[1]), Number(estimated[2])];
  return null;
}

export function routeSummary(dayIndex: number, items: TransportItem[], islands: string[]): string {
  const unique = new Set(islands.filter(Boolean));
  const islandLabel = `${unique.size} ${unique.size === 1 ? "island" : "islands"}`;
  const legs = items.filter((item): item is TransportLeg => item.kind === "leg");
  const ranges = legs.map((leg) => underwayMinutes(leg.detail));
  if (legs.length > 0 && ranges.every((range): range is [number, number] => range !== null)) {
    const low = ranges.reduce((sum, range) => sum + range[0], 0);
    const high = ranges.reduce((sum, range) => sum + range[1], 0);
    const span = low === high ? `${low} min` : `${low}–${high} min`;
    return `Day ${dayIndex} · ${islandLabel} · ${span} underway`;
  }
  const crossings = legs.length;
  const crossingLabel = `${crossings} ${crossings === 1 ? "crossing" : "crossings"}`;
  return crossings ? `Day ${dayIndex} · ${islandLabel} · ${crossingLabel}` : `Day ${dayIndex} · ${islandLabel}`;
}

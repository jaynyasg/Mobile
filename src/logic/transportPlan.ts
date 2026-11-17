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

const PLACE_QUERY: Record<string, string> = {
  "st. thomas": "American Yacht Harbor, Red Hook, St. Thomas, USVI",
  "red hook": "American Yacht Harbor, Red Hook, St. Thomas, USVI",
  lovango: "Lovango Resort and Beach Club, USVI",
  "st. john": "Cruz Bay Ferry Dock, St. John, USVI",
  "cruz bay": "Cruz Bay Ferry Dock, St. John, USVI",
  "jost van dyke": "Great Harbour, Jost Van Dyke, British Virgin Islands",
  jost: "Great Harbour, Jost Van Dyke, British Virgin Islands",
  "great harbour": "Great Harbour, Jost Van Dyke, British Virgin Islands",
  "scrub island": "Scrub Island Marina, British Virgin Islands",
  scrub: "Scrub Island Marina, British Virgin Islands",
  "trellis bay": "Trellis Bay, Beef Island, British Virgin Islands",
  "west end": "West End Ferry Terminal, Tortola, British Virgin Islands",
};

function placeKey(value: string): string {
  return value.toLowerCase().replace(/\s*·.*$/, "").trim();
}

export function placeQuery(name: string): string {
  return PLACE_QUERY[placeKey(name)] ?? `${name}, Virgin Islands`;
}

export function legStops(title: string): string[] {
  return title.split(/\s*→\s*/).map((part) => part.replace(/\s*·.*$/, "").trim()).filter(Boolean);
}

export function mapsForStops(stops: string[]): string {
  const points = stops.map(placeQuery);
  if (points.length < 2) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(points[0] ?? "Virgin Islands")}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", points[0]);
  url.searchParams.set("destination", points[points.length - 1]);
  const waypoints = points.slice(1, -1);
  if (waypoints.length) url.searchParams.set("waypoints", waypoints.join("|"));
  return url.toString();
}

const ALONG: Record<string, string> = {
  "st. thomas|lovango": "Leave American Yacht Harbor at Red Hook. Go east through Pillsbury Sound, Great St. James to the south and St. John's north shore ahead, and land at Lovango.",
  "red hook|lovango": "Leave the Lovango pier at Red Hook. The resort ferry crosses Pillsbury Sound to Lovango Cay. Reservations are required on the resort boat.",
  "lovango|st. john": "Leave Lovango and head south, past Henley Cay, into the Cruz Bay dock.",
  "lovango|cruz bay": "Leave Lovango and head south, past Henley Cay, into the Cruz Bay dock.",
  "st. john|jost van dyke": "Leave Cruz Bay heading north. This hop leaves the USVI for the BVI. Have a passport and the BVI entry card. Great Harbour is the landing, with Tortola off to the east.",
  "cruz bay|great harbour": "Leave Cruz Bay heading north into the BVI. Have a passport and the BVI entry card. Land at Great Harbour. Tortola is off to the east.",
  "jost van dyke|scrub island": "Leave Great Harbour and run east. Tortola's north shore stays to the south, then Guana Island and Marina Cay, then Scrub Island Marina. You are already in the BVI.",
  "jost|scrub": "Leave Great Harbour and run east toward Scrub Island Marina, Tortola's north shore to the south.",
  "lovango|st. thomas": "Leave Lovango and head west through Pillsbury Sound into American Yacht Harbor at Red Hook.",
  "st. john|lovango": "Leave Cruz Bay heading north, past Henley Cay, to the Lovango landing.",
  "jost van dyke|st. john": "Leave Great Harbour heading south, back into the USVI. Have your passport ready. Cruz Bay is the dock.",
  "scrub island|jost van dyke": "Leave Scrub Island Marina and run west, past Marina Cay and Guana Island, into Great Harbour.",
};

export function legInstruction(title: string): { stops: string[]; along: string; mapsUrl: string } {
  const stops = legStops(title);
  if (stops.some(stop => /near tortola/i.test(stop))) return { stops, along: "The venue and landing point near Tortola are being confirmed. Arrange this connection with your operator once the location is announced.", mapsUrl: "" };
  const mapsUrl = mapsForStops(stops);
  const keys = stops.map(placeKey);
  if (keys.includes("trellis")) {
    return {
      stops,
      along: "This hop is more than one boat. Take the launch from Scrub Island into Trellis Bay on Beef Island, taxi across Tortola to West End, then the ferry to Jost Van Dyke. TATEL has not reserved the seats.",
      mapsUrl,
    };
  }
  const pair = `${keys[0] ?? ""}|${keys[keys.length - 1] ?? ""}`;
  const along = ALONG[pair] ?? (stops.length > 1
    ? `Go from ${stops[0]} to ${stops[stops.length - 1]}. Open the map for this hop. The team confirms the boat.`
    : "Open the map for this stop.");
  return { stops, along, mapsUrl };
}

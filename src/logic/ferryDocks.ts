/**
 * Owner-provided Google Maps pins for public ferry docks.
 * A pin is attached to a route only when the owner's label matches that end of the trip.
 * Lovango's Red Hook stop is the resort pier, not the public Red Hook ferry dock.
 */

export interface FerryDock {
  id: string;
  name: string;
  detail: string;
  url: string;
}

export interface DockGroup {
  id: string;
  island: string;
  docks: readonly FerryDock[];
}

export const DOCK_GROUPS: readonly DockGroup[] = [
  {
    id: "st-thomas",
    island: "St. Thomas",
    docks: [
      {
        id: "red-hook",
        name: "Red Hook ferry dock, St. Thomas",
        detail: "To Cruz Bay, and to the BVI.",
        url: "https://maps.app.goo.gl/8cdjqA5aRwP3D75w9",
      },
      {
        id: "charlotte-downtown",
        name: "Charlotte Amalie Ferry Dock, St. Thomas",
        detail: "Downtown waterfront.",
        url: "https://maps.app.goo.gl/hTfCpLDycUMkkkzg7",
      },
      {
        id: "blyden",
        name: "Native Son Ferry, Blyden Marine Terminal",
        detail: "Charlotte Amalie, St. Thomas. BVI ferries.",
        url: "https://maps.app.goo.gl/qxrNSKmnPP2ZcdsTA",
      },
    ],
  },
  {
    id: "st-john",
    island: "St. John",
    docks: [
      {
        id: "cruz-bay",
        name: "Cruz Bay Ferry Dock, St. John",
        detail: "St. John.",
        url: "https://maps.app.goo.gl/pD3gcJcqz9q9svaD6",
      },
    ],
  },
  {
    id: "tortola",
    island: "Tortola",
    docks: [
      {
        id: "west-end",
        name: "West End Ferry Dock, Tortola",
        detail: "BVI.",
        url: "https://maps.app.goo.gl/N3er1d1VBo393Hpx5",
      },
      {
        id: "road-town",
        name: "Road Town Fast Ferry terminal, Road Town waterfront",
        detail: "Tortola. This pin is Road Town Fast Ferry’s terminal, not every Road Town dock.",
        url: "https://maps.app.goo.gl/FZyRgyawKPZCYv5C7",
      },
      {
        id: "trellis",
        name: "Trellis Bay, Beef Island, Tortola",
        detail: "Beef Island. The Scrub Island guest ferry departs here. Speedy’s also lists boats from Trellis Bay to Spanish Town.",
        url: "https://maps.app.goo.gl/EQJk9J5TPCWS2RxG7",
      },
      {
        id: "beef-island",
        name: "Beef Island Ferry Dock, BVI",
        detail: "A separate pin from Trellis Bay. The official schedule does not use this name for the Trellis Bay boats.",
        url: "https://maps.app.goo.gl/MLbYtU72LzW2evwt8",
      },
    ],
  },
  {
    id: "jost",
    island: "Jost Van Dyke",
    docks: [
      {
        id: "jost",
        name: "Jost Van Dyke Ferry Dock, Great Harbour",
        detail: "BVI.",
        url: "https://maps.app.goo.gl/SkRqfXnEa1zGwPgr8",
      },
    ],
  },
];

export const FERRY_DOCKS: readonly FerryDock[] = DOCK_GROUPS.flatMap((group) => group.docks);

/** FareHarbor booking for the Lovango resort ferry. Tracking parameters are already stripped. */
export const LOVANGO_FERRY_BOOK_URL =
  "https://fareharbor.com/embeds/book/lovangoresortstjohn/items/?flow=1267756&full-items=yes";

export interface DockMention {
  id: string;
  /** Label that keeps a shared or partial stop from sounding like every operator’s dock. */
  label: string;
}

export interface LegBoarding {
  /** Dock you leave from, when that end has a pin. */
  board: string[];
  /** Dock this boat lands at, when that end has a pin. */
  land: string[];
  /** A pin the page supports for only part of the card, such as one operator. */
  extra: DockMention[];
  book: boolean;
  /** Shown when a named end of the trip still has no pin. */
  note: string | null;
}

const boarding: Record<string, LegBoarding> = {
  "red-hook-cruz": { board: ["red-hook"], land: ["cruz-bay"], extra: [], book: false, note: null },
  "charlotte-cruz": { board: ["charlotte-downtown"], land: ["cruz-bay"], extra: [], book: false, note: null },
  "charlotte-road-town": {
    board: ["blyden"],
    land: [],
    extra: [{ id: "road-town", label: "Road Town Fast Ferry terminal, on the days Road Town Fast Ferry runs" }],
    book: false,
    note: "BVI Tourism says Road Town Fast Ferry, Native Son, and Smith's Ferry alternate days on this route, and the times stay the same. It does not name Native Son’s or Smith’s dock in Road Town. The Road Town pin is only the Road Town Fast Ferry terminal.",
  },
  "red-hook-west-end": {
    board: ["red-hook"],
    land: ["west-end"],
    extra: [{ id: "road-town", label: "5:45pm continues to the Road Town Fast Ferry terminal" }],
    book: false,
    note: "BVI Tourism says the 8:30am and 1:45pm end at West End. The 5:45pm stops at West End and continues to Road Town. That boat is Road Town Fast Ferry.",
  },
  "west-end-jost": {
    board: ["west-end"],
    land: ["jost"],
    extra: [],
    book: false,
    note: null,
  },
  "jost-virgin-gorda": {
    board: ["jost"],
    land: [],
    extra: [],
    book: false,
    note: "Spanish Town, Virgin Gorda has no pin here.",
  },
  "road-town-virgin-gorda": {
    board: [],
    land: [],
    extra: [{ id: "road-town", label: "Road Town Fast Ferry departs its waterfront terminal" }],
    book: false,
    note: "The same page also lists Speedy’s from Road Town. It does not name Speedy’s dock, so Speedy’s does not get this pin. Spanish Town has no pin here.",
  },
  "charlotte-virgin-gorda": {
    board: [],
    land: [],
    extra: [],
    book: false,
    note: "Speedy’s Saturday boat names Charlotte Amalie and does not name the dock, so no pin is attached.",
  },
  "cruz-lovango": {
    board: ["cruz-bay"],
    land: [],
    extra: [],
    book: true,
    note: "The resort says this ferry departs Cruz Bay. Lovango Cay has no pin here.",
  },
  "red-hook-lovango": {
    board: [],
    land: [],
    extra: [],
    book: true,
    note: "The resort says guests use Lovango’s pier in Red Hook. That is the resort pier, not the public Red Hook ferry dock.",
  },
  "trellis-scrub": {
    board: ["trellis"],
    land: [],
    extra: [],
    book: false,
    note: "The resort guest ferry departs Trellis Bay. Scrub Island has no pin. The Beef Island Ferry Dock is a different pin.",
  },
  "scrub-trellis": {
    board: [],
    land: ["trellis"],
    extra: [],
    book: false,
    note: "Scrub Island has no pin. This boat lands at Trellis Bay. The Beef Island Ferry Dock is a different pin.",
  },
};

export const BOARDED_LEG_IDS = Object.keys(boarding);

export function dockById(id: string): FerryDock {
  const dock = FERRY_DOCKS.find((item) => item.id === id);
  if (!dock) throw new Error(`Unknown ferry dock ${id}`);
  return dock;
}

export function boardingFor(legId: string): LegBoarding {
  return boarding[legId] ?? { board: [], land: [], extra: [], book: false, note: null };
}

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

export const FERRY_DOCKS: readonly FerryDock[] = [
  {
    id: "red-hook",
    name: "Red Hook ferry dock, St. Thomas",
    detail: "To Cruz Bay, and to the BVI.",
    url: "https://maps.app.goo.gl/8cdjqA5aRwP3D75w9",
  },
  {
    id: "cruz-bay",
    name: "Cruz Bay Ferry Dock, St. John",
    detail: "St. John.",
    url: "https://maps.app.goo.gl/pD3gcJcqz9q9svaD6",
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
  {
    id: "jost",
    name: "Jost Van Dyke Ferry Dock, Great Harbour",
    detail: "BVI.",
    url: "https://maps.app.goo.gl/SkRqfXnEa1zGwPgr8",
  },
];

/** FareHarbor booking for the Lovango resort ferry. Tracking parameters are already stripped. */
export const LOVANGO_FERRY_BOOK_URL =
  "https://fareharbor.com/embeds/book/lovangoresortstjohn/items/?flow=1267756&full-items=yes";

export interface LegBoarding {
  /** Dock you leave from, when that end has a pin. */
  board: string[];
  /** Dock this boat lands at, when that end has a pin. */
  land: string[];
  book: boolean;
  /** Shown when this route's departure dock is not one of the pins. */
  note: string | null;
}

const boarding: Record<string, LegBoarding> = {
  "red-hook-cruz": { board: ["red-hook"], land: ["cruz-bay"], book: false, note: null },
  "charlotte-cruz": { board: ["charlotte-downtown"], land: ["cruz-bay"], book: false, note: null },
  "charlotte-road-town": {
    board: ["blyden"],
    land: [],
    book: false,
    note: "This pin is Native Son at Blyden Marine Terminal, the BVI ferry terminal in Charlotte Amalie. The schedule lists Road Town Fast Ferry, Native Son, and Smith's Ferry on alternating days. It does not name a separate dock for each of them. Road Town has no pin here.",
  },
  "red-hook-west-end": {
    board: ["red-hook"],
    land: [],
    book: false,
    note: "West End, Tortola has no pin here.",
  },
  "west-end-jost": {
    board: [],
    land: ["jost"],
    book: false,
    note: "This boat leaves West End, Tortola. That dock has no pin here. Great Harbour is where it lands.",
  },
  "jost-virgin-gorda": {
    board: ["jost"],
    land: [],
    book: false,
    note: "Spanish Town, Virgin Gorda has no pin here.",
  },
  "road-town-virgin-gorda": {
    board: [],
    land: [],
    book: false,
    note: "Road Town and Spanish Town have no pins here.",
  },
  "charlotte-virgin-gorda": {
    board: [],
    land: [],
    book: false,
    note: "The schedule names Charlotte Amalie and does not name the dock, so no pin is attached.",
  },
  "cruz-lovango": {
    board: ["cruz-bay"],
    land: [],
    book: true,
    note: "The resort says this ferry departs Cruz Bay. Lovango Cay has no pin here.",
  },
  "red-hook-lovango": {
    board: [],
    land: [],
    book: true,
    note: "The resort says guests use Lovango’s pier in Red Hook. That is the resort pier, not the public Red Hook ferry dock.",
  },
  "trellis-scrub": {
    board: [],
    land: [],
    book: false,
    note: "Trellis Bay and Scrub Island have no pins here.",
  },
};

export const BOARDED_LEG_IDS = Object.keys(boarding);

export function dockById(id: string): FerryDock {
  const dock = FERRY_DOCKS.find((item) => item.id === id);
  if (!dock) throw new Error(`Unknown ferry dock ${id}`);
  return dock;
}

export function boardingFor(legId: string): LegBoarding {
  return boarding[legId] ?? { board: [], land: [], book: false, note: null };
}

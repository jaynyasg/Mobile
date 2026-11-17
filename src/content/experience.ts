import type { ProgramData } from "./types";

export const ENTERTAINMENT_AREA = "Near Tortola";
export const ENTERTAINMENT_VENUE = "near-tortola";
export const LOCATION_NOTE = "Entertainment takes place near Tortola, BVI. The exact venue, landing point, and transfers are to be confirmed.";
const oldArea = /Jost Van Dyke|Great Harbour|White Bay/i;

/** Approved event geography takes precedence over older cached or website program data.
 * Real property locations, panelists, photographs and video sources are never relabeled. */
export function applyExperienceContent(program: ProgramData): ProgramData {
  const sessions = program.sessions.map(session => session.island === "Jost Van Dyke" || session.island === ENTERTAINMENT_AREA ? {
    ...session, island: ENTERTAINMENT_AREA, region: "BVI",
    venue: { island: ENTERTAINMENT_AREA, venueId: ENTERTAINMENT_VENUE, specific: null, label: "to be confirmed" },
  } : session);
  const replaceArea = (value: string) => value.replace(/Jost Van Dyke/g, ENTERTAINMENT_AREA);
  return {
    ...program, sessions,
    forum: { ...program.forum, pillars: program.forum.pillars.map(pillar => pillar.id === "entertainment" ? { ...pillar, island: ENTERTAINMENT_AREA } : pillar) },
    venues: program.venues.map(venue => venue.id === "jost-van-dyke" || venue.id === ENTERTAINMENT_VENUE ? {
      ...venue, id: ENTERTAINMENT_VENUE, name: ENTERTAINMENT_AREA, island: ENTERTAINMENT_AREA,
      dock: "Landing point to be confirmed", note: LOCATION_NOTE, notes: [LOCATION_NOTE], land: [], boat: [],
    } : venue),
    // The Hideout remains a real Jost Van Dyke property; it is not a venue near Tortola.
    places: program.places.filter(place => place.island !== "Jost Van Dyke"),
    stays: { ...program.stays, groups: program.stays.groups.map(group => ({ ...group, islands: group.islands.map(island => island.id === "jost-van-dyke" || island.id === ENTERTAINMENT_VENUE ? {
      ...island, id: ENTERTAINMENT_VENUE, island: ENTERTAINMENT_AREA, dock: "Confirm your base with the team once the venue is announced.",
      sections: [{ heading: "Plan your stay near Tortola", providers: [{ name: "Explore BVI accommodation", href: "https://www.bvitourism.com/", localDeck: false }], notes: [LOCATION_NOTE, "Property availability and access to the summit venue must be confirmed before booking."] }],
    } : island) })) },
    transport: { ...program.transport, venueAssumptions: LOCATION_NOTE, modes: program.transport.modes.map(mode => ({
      ...mode, description: replaceArea(mode.description), warning: `${LOCATION_NOTE} ${replaceArea(mode.warning)}`.replace(`${LOCATION_NOTE} ${LOCATION_NOTE} `, `${LOCATION_NOTE} `),
      days: mode.days.map(day => ({ ...day, start: oldArea.test(day.start) ? "Start near Tortola; boarding point and departure time to be confirmed." : day.start,
        overnight: oldArea.test(day.overnight) ? "Near Tortola; confirm your berth or accommodation with the provider." : day.overnight,
        // Old route pictures contain a precise Jost stop and cannot represent the replacement venue.
        map: "", mapDescription: "Entertainment venue near Tortola; the route is being updated.",
        items: day.items.map(item => item.kind === "leg" && oldArea.test(`${item.title} ${item.detail}`) ? {
          ...item, title: replaceArea(item.title).replace(/Great Harbour/g, ENTERTAINMENT_AREA), time: "Transfer to be confirmed", detail: LOCATION_NOTE, caution: true,
        } : item),
      })),
    })) },
  };
}

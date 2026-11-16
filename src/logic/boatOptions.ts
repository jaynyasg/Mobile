import { FERRY_DOCKS } from "./ferryDocks";

/**
 * How someone actually gets on a boat.
 * Speeds and the "not reserved" line come from the program transport notes.
 * Public ferries are cited. Nothing here is a TATEL fare or a reserved seat.
 */

/** Boats are the only way between islands. Taxis stay on one island. */
export const BOATS_ONLY =
  "Boats are the only way to move from island to island. Nothing drives between them. A taxi stays on the island it starts on: hotel to dock, or across one island between two boats.";

export const BOAT_ACCESS = [
  {
    id: "beach",
    title: "Be on the Beach",
    pass: "This pass is public ferries and public transportation.",
    reserve: "Public ferries run on a fixed schedule. Reserve with the operator. Routes lists the current published times and links each operator's page. A timetable for January 26–29, 2027 is not published, except the Lovango resort ferry, which posts dates through April 25, 2027. Check before you travel.",
    board: "Docks are listed by island: St. Thomas, St. John, Tortola, and Jost Van Dyke. Tap one to open it in Maps. A taxi stays on the island it starts on, from where you sleep to the dock.",
    without: "Already on this pass, the public ferry is how you change islands. To ride a private day charter, upgrade to Be on the Boat in Tickets. To stay on one charter for all 5 days, upgrade to Be on Board.",
  },
  {
    id: "boat",
    title: "Be on the Boat",
    pass: "This pass is a private charter for the day. It takes a group to the sessions. It is not a public ferry.",
    reserve: "Open Tickets and choose Be on the Boat. You do not buy a public ticket. Groups leave at different times. The team confirms the boat and the time. No January departure is reserved yet.",
    board: "Board at the dock named for that departure. The plan uses Red Hook, Cruz Bay, the Lovango landing, Great Harbour, and Scrub Island Marina.",
    without: "If you hold Be on the Beach, you are on the public ferry instead. Upgrade in Tickets for the day charter, or keep the public ferry.",
  },
  {
    id: "board",
    title: "Be on Board",
    pass: "This is the VIP charter you stay on for all 5 days. A full boat is 8 shares at $5,000, $40,000 for the boat. Choose the full boat for your own group, or say you are open to sharing.",
    reserve: "Start a VIP group in Tickets and pick full boat or open to sharing. The team confirms the boat and the berth. This is not a public ferry and not the day charter.",
    board: "The team tells you where to board. The sample plan starts near Red Hook. Later stops are confirmed with the boat.",
    without: "Without this pass you do not stay on the charter. Upgrade in Tickets, or use Be on the Boat for a day charter, or Be on the Beach for the public ferry.",
  },
] as const;

export interface BoatSource {
  title: string;
  url: string;
}

export interface BoatDock {
  name: string;
  query: string;
  /** Owner pin. Search is used only when this is absent. */
  url?: string;
}

export interface BoatOption {
  id: "powerboat" | "ferry" | "yacht";
  title: string;
  kicker: string;
  what: string;
  shared: string;
  speed: string;
  comfort: string;
  pass: string;
  how: string;
  board: string;
  checkIn: string;
  bring: string;
  docks: BoatDock[];
  sources: BoatSource[];
}

export function mapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsDirections(origin: string, destination: string, waypoints: string[] = []): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  if (waypoints.length) url.searchParams.set("waypoints", waypoints.join("|"));
  return url.toString();
}

const docks = {
  redHook: { name: "Red Hook, St. Thomas", query: "American Yacht Harbor, Red Hook, St. Thomas, USVI" },
  redHookFerry: {
    name: "Red Hook ferry dock, St. Thomas",
    query: "Red Hook ferry dock, St. Thomas",
    url: "https://maps.app.goo.gl/8cdjqA5aRwP3D75w9",
  },
  charlotteDowntown: {
    name: "Charlotte Amalie Ferry Dock, downtown waterfront",
    query: "Charlotte Amalie Ferry Dock, St. Thomas",
    url: "https://maps.app.goo.gl/hTfCpLDycUMkkkzg7",
  },
  blyden: {
    name: "Native Son Ferry, Blyden Marine Terminal",
    query: "Blyden Marine Terminal, Charlotte Amalie, St. Thomas",
    url: "https://maps.app.goo.gl/qxrNSKmnPP2ZcdsTA",
  },
  cruzSearch: { name: "Cruz Bay, St. John", query: "Cruz Bay Ferry Dock, St. John, USVI" },
  cruz: {
    name: "Cruz Bay Ferry Dock, St. John",
    query: "Cruz Bay Ferry Dock, St. John, USVI",
    url: "https://maps.app.goo.gl/pD3gcJcqz9q9svaD6",
  },
  lovango: { name: "Lovango landing", query: "Lovango Resort and Beach Club, USVI" },
  jostSearch: { name: "Great Harbour, Jost Van Dyke", query: "Great Harbour, Jost Van Dyke, British Virgin Islands" },
  jost: {
    name: "Jost Van Dyke Ferry Dock, Great Harbour",
    query: "Great Harbour, Jost Van Dyke, British Virgin Islands",
    url: "https://maps.app.goo.gl/SkRqfXnEa1zGwPgr8",
  },
  westEnd: { name: "West End, Tortola", query: "West End Ferry Terminal, Tortola, British Virgin Islands" },
  scrub: { name: "Scrub Island Marina", query: "Scrub Island Marina, British Virgin Islands" },
};

export const boatOptions: BoatOption[] = [
  {
    id: "powerboat",
    title: "Be on the Boat",
    kicker: "Private charter for the day",
    what: "A private charter that takes a group to the sessions for the day. Groups leave at different times. The plan estimates a fast boat at roughly 20–25 knots where that speed is allowed. It does not name the length or the operator. The team confirms the actual boat.",
    shared: "Private charter, shared with your group for the day. Not a public ferry.",
    speed: "Planning speed about 20–25 knots. That is an estimate, not a reserved departure.",
    comfort: "A day boat: you ride with your group from session to session, then you are off it. It is not the charter you sleep on.",
    pass: "Included with Be on the Boat. Open Tickets and choose that pass. Be on the Beach is the public ferry instead. Be on Board is the charter you stay on for all 5 days.",
    how: "You do not buy a public ticket. The team assigns the day charter. Groups depart at different times. No January timetable is reserved yet.",
    board: "Board at the dock named for that morning. The plan starts near Red Hook on St. Thomas and uses Cruz Bay, the Lovango landing, Great Harbour on Jost Van Dyke, and Scrub Island Marina as the other stops.",
    checkIn: "On the St. Thomas mornings, the plan says check in by 8:30am near Red Hook. Other mornings are confirmed by the team. Arrive before the boat leaves. A late arrival does not hold the boat.",
    bring: "Your pass on this phone. A passport, and the BVI entry card, on any hop from the USVI into the BVI. Dress for sun and spray.",
    docks: [docks.redHook, docks.cruzSearch, docks.lovango, docks.jostSearch, docks.scrub],
    sources: [
      { title: "BVI entry card and sea arrival", url: "https://www.bvitourism.com/travel/entry-requirements" },
    ],
  },
  {
    id: "ferry",
    title: "Be on the Beach",
    kicker: "Public ferry and public transportation",
    what: "Scheduled ferries and resort launches that already run between these islands. You share the boat with other passengers and you leave on the operator's clock. A taxi is only for land on one island, such as across Tortola between the Scrub launch and the West End ferry.",
    shared: "Shared. A public ferry or a resort launch, not your own boat.",
    speed: "Lovango says its guest ferry is about 15–30 minutes from Red Hook and about 10 minutes from Cruz Bay.",
    comfort: "A passenger ferry or a small resort launch. You wait for the next published boat if you miss one.",
    pass: "This is what Be on the Beach uses: public ferries between islands, and taxis on land. It is not included with Be on the Boat or Be on Board.",
    how: "Reserve with the operator. Lovango’s resort ferry is for its guests and needs a reservation. The Scrub Island ferry is for resort guests. New Horizon runs between West End, Tortola and Great Harbour, Jost Van Dyke. These seats are not booked for you. Check with the operator before you travel. For a private charter, upgrade in Tickets.",
    board: "St. Thomas to St. John leaves from the Red Hook ferry dock or the Charlotte Amalie dock on the downtown waterfront, and lands at Cruz Bay. BVI ferries from Charlotte Amalie leave from Native Son at Blyden Marine Terminal. West End, Great Harbour, and the Road Town Fast Ferry terminal are on the list below. The Scrub Island guest ferry leaves from Trellis Bay. Lovango’s resort ferry leaves from the resort’s pier in Red Hook and from Cruz Bay.",
    checkIn: "Be at the dock in time for the operator’s check-in. A sample in the plan allows about 30 minutes. Confirm that with the operator. The boat will not wait.",
    bring: "The ticket or reservation from that operator. A passport and the BVI entry card if the ferry crosses from the USVI into the BVI.",
    docks: FERRY_DOCKS.map((dock) => ({ name: dock.name, query: dock.name, url: dock.url })),
    sources: [
      { title: "Lovango, getting there", url: "https://www.lovangovi.com/getting-to-lovango/" },
      { title: "Scrub Island, location and launch", url: "https://www.scrubisland.com/location/" },
      { title: "New Horizon Ferry, schedule", url: "https://www.newhorizonferry.com/schedule/" },
      { title: "BVI Tourism, ferry schedules", url: "https://www.bvitourism.com/ferry-schedules" },
      { title: "Inter Island Boat Services", url: "https://www.interislandboatservices.com/" },
    ],
  },
  {
    id: "yacht",
    title: "Be on Board",
    kicker: "The charter you stay on",
    what: "A charter you stay on for all 5 days. A full boat is 8 shares at $5,000, $40,000. You take the full boat for your own group, or you share. The sample notes also describe a slower overnight yacht at about six knots. That figure is a planning estimate, not a promise of which boat VIP uses. The team confirms the boat.",
    shared: "Your group, or a boat you chose to share. Not a public ferry, and not the day charter.",
    speed: "The team confirms the boat. A sailing sample in the plan uses about six knots and does not fit five islands in one afternoon. Do not treat that sample as the VIP timetable.",
    comfort: "You live on this boat for the voyage. The berth and the captain are confirmed by the team. They are not booked in this plan.",
    pass: "Included with Be on Board, the VIP pass. In Tickets, start a group of 8 shares. Choose a full boat or say you are open to sharing. Be on the Boat is only a day charter. Be on the Beach is the public ferry.",
    how: "Start a VIP group in Tickets and pick full boat or open to sharing. The team confirms the boat, the berth, and where you meet it.",
    board: "The sample starts near Red Hook, with the yacht and crew ready, and overnight berths are named only as authorized stops at St. John, Jost Van Dyke, or the next island. The exact dock is confirmed with the captain.",
    checkIn: "There is no public check-in desk. The plan says the yacht and crew are ready for departure. The team tells you where to meet them.",
    bring: "Your pass, a passport, and the BVI entry card before any international hop. Soft bags are easier on a tender. The captain confirms the rest.",
    docks: [docks.redHook, docks.cruzSearch, docks.jostSearch, docks.scrub],
    sources: [
      { title: "BVI Tourism, arriving by sea", url: "https://www.bvitourism.com/travel/arriving-by-sea" },
    ],
  },
];

export interface StayHop {
  island: string;
  how: string;
  from: string;
  to: string;
  origin: string;
  destination: string;
}

/** From a named stay to the session dock. No minutes we do not have a source for. */
export const stayHops: StayHop[] = [
  {
    island: "St. Thomas",
    how: "Taxi. Emerald Beach Resort and Lindbergh Bay Hotel & Villas are on Lindbergh Bay, by Cyril E. King Airport. The conference boats in this plan leave from Red Hook, on the east end. The road crosses the island through Charlotte Amalie. The team does not publish a taxi fare or a minute count.",
    from: "Lindbergh Bay",
    to: "Red Hook",
    origin: "Emerald Beach Resort, St. Thomas",
    destination: "American Yacht Harbor, Red Hook, St. Thomas",
  },
  {
    island: "St. John",
    how: "Walk if you are staying in Cruz Bay. From the Westin in Great Cruz Bay, take a taxi back to the Cruz Bay dock. The fare is not listed here.",
    from: "Great Cruz Bay",
    to: "Cruz Bay dock",
    origin: "Westin St. John, Great Cruz Bay",
    destination: "Cruz Bay Ferry Dock, St. John",
  },
  {
    island: "Lovango",
    how: "The resort and the landing are the same small island. Walk from the room to the boat. There is no car ferry.",
    from: "Lovango Resort",
    to: "Lovango landing",
    origin: "Lovango Resort and Beach Club",
    destination: "Lovango Resort and Beach Club, USVI",
  },
  {
    island: "Jost Van Dyke",
    how: "The Hideout is on White Bay. Great Harbour is the next bay, where the public ferry lands. Ask the hotel for a taxi or a short water taxi. The team will confirm which bay your session uses.",
    from: "White Bay",
    to: "Great Harbour",
    origin: "The Hideout, White Bay, Jost Van Dyke",
    destination: "Great Harbour, Jost Van Dyke",
  },
  {
    island: "Scrub Island",
    how: "The resort and the marina are on the same island. Walk down to the marina.",
    from: "Scrub Island Resort",
    to: "Scrub Island Marina",
    origin: "Scrub Island Resort",
    destination: "Scrub Island Marina, British Virgin Islands",
  },
];

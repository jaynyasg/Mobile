import { FERRY_DOCKS } from "./ferryDocks";

/**
 * How someone actually gets on a boat.
 * Speeds and the "not reserved" line come from the program transport notes.
 * Public ferries are cited. Nothing here is a TATEL fare or a reserved seat.
 */

/** Boats are the only way between islands. Taxis stay on one island. */
export const BOATS_ONLY =
  "Plan boat transfers between summit stops. Taxis connect your accommodation, sessions, and docks on the same island. Allow time for both parts of the journey.";

export const BOAT_ACCESS = [
  {
    id: "beach",
    title: "Be on the Beach",
    pass: "Attend land-based sessions with Be on the Beach. Arrange your own public ferries and local transfers when you visit another island.",
    reserve: "Public ferries run on fixed schedules. Check the operator links in Routes for your travel dates, reserve your seats, and confirm the return sailing. Your TATEL ticket does not book these transfers.",
    board: "Docks are listed by island: St. Thomas, St. John, Tortola, and Jost Van Dyke. Tap one to open it in Maps. A taxi stays on the island it starts on, from where you sleep to the dock.",
    without: "Compare Be on the Boat for a private day charter, or Be on Board for a five-day onboard stay. Ticket details are in Tickets.",
  },
  {
    id: "boat",
    title: "Be on the Boat",
    pass: "Be on the Boat connects sessions by private day charter. You travel with a group and arrange your own accommodation on land.",
    reserve: "Choose Be on the Boat in Tickets. The team confirms your boat, boarding dock, and departure time. Wait for that confirmation before planning connecting transfers.",
    board: "Board at the dock named for that departure. The plan uses Red Hook, Cruz Bay, the Lovango landing, Great Harbour, and Scrub Island Marina.",
    without: "Be on the Beach guests arrange their own transfers. Compare the day-charter experience in Tickets if you prefer to travel with a group.",
  },
  {
    id: "board",
    title: "Be on Board",
    pass: "Stay aboard for five days. A full boat has eight shares at $5,000 each ($40,000 total). Bring your own group of eight or ask to share with other guests.",
    reserve: "Choose Be on Board in Tickets. Add your contact details and boat preference to start a booking. The team confirms your charter and berth.",
    board: "Use the boarding location and time in your charter confirmation. The team will also confirm your island stops.",
    without: "An overnight berth is part of Be on Board. Beach and Boat guests arrange accommodation on land; compare all three experiences in Tickets.",
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
    what: "Travel between island sessions on a private day charter with your group. The team confirms your boat and departure times. You return to accommodation on land at night.",
    shared: "Private charter, shared with your group for the day. Not a public ferry.",
    speed: "Planning speed about 20–25 knots. That is an estimate, not a reserved departure.",
    comfort: "A day boat: you ride with your group from session to session, then you are off it. It is not the charter you sleep on.",
    pass: "Day-charter travel is included with Be on the Boat. Book your hotel separately. Compare all three experiences in Tickets.",
    how: "Choose Be on the Boat in Tickets, then follow the team's charter confirmation. Groups may have different departure times; check the details for your own booking.",
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
    pass: "Be on the Beach gives you access to land-based sessions. Arrange and pay for your own ferries and taxis if you want to attend sessions on other islands.",
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
    what: "Make the yacht your home for five days. Be on Board combines an overnight stay with travel between island stops. Bring your group of eight or ask to share. A full boat costs $40,000: eight shares at $5,000 each.",
    shared: "Your group, or a boat you chose to share. Not a public ferry, and not the day charter.",
    speed: "Travel times depend on your assigned boat, weather, and route. Use the itinerary confirmed by the team when choosing sessions.",
    comfort: "Sleep aboard throughout the charter. The team confirms your berth and the facilities on your assigned boat.",
    pass: "Be on Board includes an onboard stay. Start a booking for eight shares in Tickets, with your own group or a request to share. Be on the Boat guests use day charters; Be on the Beach guests arrange their own transfers.",
    how: "Choose Be on Board in Tickets, select your boat preference, and enter your contact details. You'll receive a group booking link for payment. The team confirms the charter arrangements.",
    board: "Meet your captain at the dock in your booking confirmation. Check the boarding location before arranging a taxi or connecting ferry.",
    checkIn: "Confirm your arrival time with the team. Ask about check-in and check-out dates for the five-day charter, including any nights outside the four-day summit.",
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
    how: "Take a taxi from Emerald Beach Resort or Lindbergh Bay Hotel & Villas to Red Hook on the east end of St. Thomas. Confirm your boarding dock first, then ask your hotel or driver about the fare and how much travel time to allow.",
    from: "Lindbergh Bay",
    to: "Red Hook",
    origin: "Emerald Beach Resort, St. Thomas",
    destination: "American Yacht Harbor, Red Hook, St. Thomas",
  },
  {
    island: "St. John",
    how: "Walk to the dock if you're staying in Cruz Bay. From the Westin in Great Cruz Bay, arrange a taxi to Cruz Bay and confirm the fare with your driver.",
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

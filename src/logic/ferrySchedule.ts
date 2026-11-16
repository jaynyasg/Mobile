/**
 * Public ferry times for the Be on the Beach pass.
 * Every clock time is copied from the page named in `sourceUrl`.
 * None of these pages publish a timetable for January 26–29, 2027.
 */

export interface FerryLeg {
  id: string;
  title: string;
  from: string;
  to: string;
  /** Summit island this arrival serves. */
  island: string;
  operator: string;
  days: string;
  departures: string[];
  /** Printed by the operator. Null when the page does not say. */
  crossing: string | null;
  crossingMinutes: number | null;
  sourceTitle: string;
  sourceUrl: string;
  asOf: string;
  /** Resort host line, when the schedule prints a phone number. */
  phone?: string;
  phoneLabel?: string;
  special?: string;
}

/** Primary source for St. Thomas–St. John passenger ferries. */
export const OFFICIAL_USVI_FERRY_URL = "https://stjohnticketing.com/schedules/";

/** Primary source for Tortola, Virgin Gorda, Jost Van Dyke, and St. Thomas–BVI ferries. */
export const OFFICIAL_BVI_FERRY_URL = "https://www.bvitourism.com/ferry-schedules";

export const BVI_ENTRY =
  "A trip into the British Virgin Islands needs a passport and a customs check. Complete the BVI entry card before you go. These times are subject to change.";

const BVI_AS_OF =
  "Official BVI ferry schedules. Subject to change. BVI Tourism says the regular schedule resumed November 1, 2026. Not a separate January 26–29, 2027 table. Check the official page before you travel.";

export const FERRY_NOTE =
  "Public ferries run on a fixed schedule. St. Thomas to St. John times below are from the official USVI ferry schedule, effective November 1, 2026. They are not a separate poster for January 26–29, 2027. Schedules can change. Check the official schedule before you travel.";

export const CHARTER_CONTRAST =
  "Be on the Boat day charters leave at set group times the team confirms. Be on Board is the charter you stay on, and it runs on your group's own schedule. Neither one uses this public timetable.";

/** Scrub Island resort guest ferry. Times are the owner's Oct 29, 2026 sheet, not the hourly BVI Tourism line. */
export const SCRUB_FERRY_URL = "https://www.scrubisland.com/";
export const SCRUB_FERRY_LABEL = "Complimentary guest ferry, effective Oct 29, 2026, subject to change.";
export const SCRUB_FERRY_PHONE = "tel:+12843943440";
export const SCRUB_FERRY_SPECIAL =
  "Special runs are $300 one way during regular hours. Any run after 10:30 pm must be requested through Resort Hosts. Call Resort Hosts.";
const SCRUB_FROM_TRELLIS = ["5:45am", "6:45am", "7:45am", "8:45am", "9:45am", "11:45am", "1:45pm", "2:45pm", "3:45pm", "4:45pm", "5:45pm", "7:45pm", "9:45pm", "10:45pm"];
const SCRUB_FROM_ISLAND = ["6:30am", "7:30am", "8:30am", "9:30am", "11:30am", "1:30pm", "2:30pm", "3:30pm", "4:30pm", "5:30pm", "7:30pm", "9:30pm", "10:30pm"];

export const ferryLegs: FerryLeg[] = [
  {
    id: "red-hook-cruz",
    title: "Red Hook to Cruz Bay",
    from: "Red Hook, St. Thomas",
    to: "Cruz Bay, St. John",
    island: "St. John",
    operator: "St. John Ferry Ticketing Co., for Transportation Services of St. John and Varlack Ventures",
    days: "Daily. 5:30am from Red Hook is Monday–Friday only. From the schedule image effective November 1, 2026.",
    departures: ["5:30am Mon–Fri", "6:00am", "7:00am", "8:00am", "9:00am", "10:00am", "11:00am", "12:00pm", "1:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm", "6:00pm", "7:00pm", "8:00pm", "10:00pm", "11:30pm"],
    crossing: "St. John Ferry Ticketing says the Red Hook ferry time is approximately 20 minutes.",
    crossingMinutes: 20,
    sourceTitle: "Official USVI ferry schedule",
    sourceUrl: OFFICIAL_USVI_FERRY_URL,
    asOf: "Official schedule effective November 1, 2026. Subject to change. Not a separate January 26–29, 2027 table. Check the official schedule before you travel.",
  },
  {
    id: "charlotte-cruz",
    title: "Charlotte Amalie to Cruz Bay",
    from: "Charlotte Amalie ferry terminal",
    to: "Cruz Bay, St. John",
    island: "St. John",
    operator: "St. John Ferry Ticketing Co., for Transportation Services of St. John and Varlack Ventures",
    days: "The same official schedule, effective November 1, 2026. The page had said this downtown boat was suspended until that date.",
    departures: ["10:00am", "12:30pm"],
    crossing: "The official page prints these departure times and does not give a separate downtown crossing time. The 20-minute note is for the Red Hook boat.",
    crossingMinutes: null,
    sourceTitle: "Official USVI ferry schedule",
    sourceUrl: OFFICIAL_USVI_FERRY_URL,
    asOf: "Official schedule effective November 1, 2026. Subject to change. Check the official schedule before you travel.",
  },
  {
    id: "charlotte-road-town",
    title: "Charlotte Amalie to Road Town",
    from: "Charlotte Amalie, St. Thomas",
    to: "Road Town, Tortola",
    island: "Tortola",
    operator: "Road Town Fast Ferry, Native Son, and Smith's Ferry. They alternate days. The departure times stay the same.",
    days: "Daily. BVI Tourism says the regular schedule resumed November 1, 2026.",
    departures: ["9:00am", "2:00pm", "4:00pm", "5:30pm"],
    crossing: null,
    crossingMinutes: null,
    sourceTitle: "Official BVI ferry schedules",
    sourceUrl: OFFICIAL_BVI_FERRY_URL,
    asOf: BVI_AS_OF,
  },
  {
    id: "red-hook-west-end",
    title: "Red Hook to West End",
    from: "Red Hook, St. Thomas",
    to: "West End, Tortola",
    island: "Tortola",
    operator: "Road Town Fast Ferry, as listed by BVI Tourism. The 5:45pm continues to Road Town.",
    days: "Daily on the BVI Tourism regular schedule.",
    departures: ["8:30am", "1:45pm", "5:45pm"],
    crossing: null,
    crossingMinutes: null,
    sourceTitle: "Official BVI ferry schedules",
    sourceUrl: OFFICIAL_BVI_FERRY_URL,
    asOf: BVI_AS_OF,
  },
  {
    id: "west-end-jost",
    title: "West End to Jost Van Dyke",
    from: "West End, Tortola",
    to: "Great Harbour, Jost Van Dyke",
    island: "Jost Van Dyke",
    operator: "New Horizon Ferry, as listed on the official BVI ferry schedules",
    days: "Daily.",
    departures: ["8:00am", "10:00am", "1:00pm", "4:00pm", "6:00pm"],
    crossing: null,
    crossingMinutes: null,
    sourceTitle: "Official BVI ferry schedules",
    sourceUrl: OFFICIAL_BVI_FERRY_URL,
    asOf: BVI_AS_OF,
  },
  {
    id: "jost-virgin-gorda",
    title: "Jost Van Dyke to Virgin Gorda",
    from: "Great Harbour, Jost Van Dyke",
    to: "Spanish Town, Virgin Gorda",
    island: "Virgin Gorda",
    operator: "New Horizon Ferry, as listed on the official BVI ferry schedules",
    days: "Wednesday only. The return listed on the same page leaves Spanish Town at 4:00pm.",
    departures: ["8:00am Wednesday"],
    crossing: null,
    crossingMinutes: null,
    sourceTitle: "Official BVI ferry schedules",
    sourceUrl: OFFICIAL_BVI_FERRY_URL,
    asOf: BVI_AS_OF,
  },
  {
    id: "road-town-virgin-gorda",
    title: "Road Town to Virgin Gorda",
    from: "Road Town, Tortola",
    to: "Spanish Town, Virgin Gorda",
    island: "Virgin Gorda",
    operator: "Speedy's Ferry, as listed on the official BVI ferry schedules",
    days: "Monday through Thursday, plus 6:00pm from Road Town on Friday. The same page also lists Road Town Fast Ferry daily at 6:45am, 8:30am, 10:00am, 12:30pm, 3:30pm, and 5:00pm.",
    departures: ["7:45am", "9:00am", "10:40am", "1:30pm", "4:30pm", "6:00pm Friday"],
    crossing: null,
    crossingMinutes: null,
    sourceTitle: "Official BVI ferry schedules",
    sourceUrl: OFFICIAL_BVI_FERRY_URL,
    asOf: BVI_AS_OF,
  },
  {
    id: "charlotte-virgin-gorda",
    title: "Charlotte Amalie to Virgin Gorda",
    from: "Charlotte Amalie, St. Thomas",
    to: "Spanish Town, Virgin Gorda",
    island: "Virgin Gorda",
    operator: "Speedy's Ferry, as listed on the official BVI ferry schedules",
    days: "Saturday only. The return listed on the same page leaves Spanish Town at 8:30am Saturday. Summit week is Tuesday–Friday, so this Saturday boat does not run then.",
    departures: ["4:00pm Saturday"],
    crossing: null,
    crossingMinutes: null,
    sourceTitle: "Official BVI ferry schedules",
    sourceUrl: OFFICIAL_BVI_FERRY_URL,
    asOf: BVI_AS_OF,
  },
  {
    id: "cruz-lovango",
    title: "Cruz Bay to Lovango",
    from: "Cruz Bay, St. John",
    to: "Lovango Cay",
    island: "Lovango",
    operator: "Lovango Resort ferry",
    days: "January 1–April 25, 2027, which includes the summit. Monday–Saturday from Cruz Bay, and a shorter Sunday list. Reservations are required.",
    departures: ["10:35am", "1:00pm", "3:30pm", "8:00pm Mon–Sat", "9:15pm", "9:45pm Mon–Sat"],
    crossing: "The resort says about a 10-minute crossing from Cruz Bay.",
    crossingMinutes: 10,
    sourceTitle: "Lovango Resort, getting there",
    sourceUrl: "https://www.lovangovi.com/getting-to-lovango/",
    asOf: "Published by the resort for January 1–April 25, 2027. This one does cover January 26–29. It can still change.",
  },
  {
    id: "red-hook-lovango",
    title: "Red Hook to Lovango",
    from: "Red Hook, St. Thomas",
    to: "Lovango Cay",
    island: "Lovango",
    operator: "Lovango Resort ferry",
    days: "Every day, December 17, 2026–July 16, 2027. Reservations are required.",
    departures: ["10:00am", "12:45pm", "2:15pm", "3:15pm", "4:15pm", "5:15pm", "8:40pm"],
    crossing: "The resort says about 15–30 minutes from Red Hook.",
    crossingMinutes: 30,
    sourceTitle: "Lovango Resort, getting there",
    sourceUrl: "https://www.lovangovi.com/getting-to-lovango/",
    asOf: "Published by the resort through July 16, 2027, so it covers the summit week. It can still change.",
  },
  {
    id: "trellis-scrub",
    title: "Trellis Bay to Scrub Island",
    from: "Trellis Bay, Beef Island, Tortola",
    to: "Scrub Island",
    island: "Scrub Island",
    operator: "Scrub Island resort guest ferry",
    days: SCRUB_FERRY_LABEL,
    departures: SCRUB_FROM_TRELLIS,
    crossing: "The resort sheet says the ferry runs are approximately 10 minutes each way.",
    crossingMinutes: 10,
    sourceTitle: "Scrub Island",
    sourceUrl: SCRUB_FERRY_URL,
    asOf: SCRUB_FERRY_LABEL,
    phone: SCRUB_FERRY_PHONE,
    phoneLabel: "Resort Hosts +1 284-394-3440",
    special: SCRUB_FERRY_SPECIAL,
  },
  {
    id: "scrub-trellis",
    title: "Scrub Island to Trellis Bay",
    from: "Scrub Island",
    to: "Trellis Bay, Beef Island, Tortola",
    island: "Trellis Bay",
    operator: "Scrub Island resort guest ferry",
    days: SCRUB_FERRY_LABEL,
    departures: SCRUB_FROM_ISLAND,
    crossing: "The resort sheet says the ferry runs are approximately 10 minutes each way.",
    crossingMinutes: 10,
    sourceTitle: "Scrub Island",
    sourceUrl: SCRUB_FERRY_URL,
    asOf: SCRUB_FERRY_LABEL,
    phone: SCRUB_FERRY_PHONE,
    phoneLabel: "Resort Hosts +1 284-394-3440",
    special: SCRUB_FERRY_SPECIAL,
  },
];

export interface FerrySession {
  id: string;
  title: string;
  island: string;
  dayId: string;
  start: string | null;
  featured?: boolean;
}

export interface FerryCatch {
  legId: string;
  operator: string;
  depart: string;
  from: string;
  status: "ok" | "tight" | "miss";
  line: string;
}

const DOCK_BUFFER = 20;

export function clockMinutes(label: string): number | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const mer = match[3]?.toLowerCase();
  if (mer === "pm" && hour < 12) hour += 12;
  if (mer === "am" && hour === 12) hour = 0;
  if (!mer && hour <= 7) hour += 12;
  return hour * 60 + minute;
}

export function sessionClock(start: string): number | null {
  const match = start.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function departOnly(label: string): number | null {
  return clockMinutes(label.replace(/\s+(Mon|Wed|Sat|Sun).*/i, ""));
}

export function catchFerry(sessionMinutes: number, leg: FerryLeg): FerryCatch | null {
  let best: FerryCatch | null = null;
  for (const label of leg.departures) {
    const depart = departOnly(label);
    if (depart == null) continue;
    const known = leg.crossingMinutes != null;
    const arrival = known ? depart + (leg.crossingMinutes as number) : null;
    let status: FerryCatch["status"] = "miss";
    if (known) {
      const ready = (arrival as number) + DOCK_BUFFER;
      if (ready <= sessionMinutes) status = sessionMinutes - (arrival as number) < 45 ? "tight" : "ok";
    } else if (depart < sessionMinutes) {
      status = sessionMinutes - depart < 90 ? "tight" : "ok";
    }
    const line = known
      ? `${label} from ${leg.from}. About ${leg.crossingMinutes} minutes on the water, then ${DOCK_BUFFER} minutes to leave the dock. The session room is not confirmed.`
      : `${label} from ${leg.from}. This page does not print the crossing time, so a boat inside 90 minutes of the session is tight.`;
    const candidate: FerryCatch = { legId: leg.id, operator: leg.operator, depart: label, from: leg.from, status, line };
    if (status === "miss") continue;
    if (!best || statusRank(candidate.status) < statusRank(best.status) || (candidate.status === best.status && depart > (departOnly(best.depart) ?? 0))) {
      best = candidate;
    }
  }
  return best;
}

function statusRank(status: FerryCatch["status"]): number {
  if (status === "ok") return 0;
  if (status === "tight") return 1;
  return 2;
}

export function adviceForSession(session: FerrySession): { catches: FerryCatch[]; missed: string[] } {
  const minutes = session.start ? sessionClock(session.start) : null;
  if (minutes == null) return { catches: [], missed: [] };
  const legs = ferryLegs.filter((leg) => leg.island === session.island);
  const catches: FerryCatch[] = [];
  const missed: string[] = [];
  for (const leg of legs) {
    const caught = catchFerry(minutes, leg);
    if (caught) catches.push(caught);
    else if (leg.departures.length) missed.push(`${leg.title} has no published boat that lands before this session.`);
  }
  return { catches, missed };
}

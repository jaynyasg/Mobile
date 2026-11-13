/**
 * Build src/content/tatel.json from the TATEL website export.
 *
 *   TATEL_SOURCE=/path/to/tatel-site node scripts/generate-tatel-content.mjs
 *
 * Canonical input: raw/public/tatel/downloads/tatel-2027-program.json
 * Accommodations: venues.json
 * Portraits are copied only when the file already exists under assets/tatel/portraits.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(process.env.TATEL_SOURCE ?? "/tmp/tatel-site");
const programPath = path.join(sourceRoot, "raw/public/tatel/downloads/tatel-2027-program.json");
const venuesPath = path.join(sourceRoot, "venues.json");
const portraitDir = path.join(repoRoot, "assets/tatel/portraits");

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const downloaded = JSON.parse(readFileSync(programPath, "utf8"));
const venueFile = JSON.parse(readFileSync(venuesPath, "utf8"));
const { program, sessions: sessionsRaw, agendas, presenters } = downloaded;

if (sessionsRaw.length !== 205) throw new Error(`Expected 205 sessions, found ${sessionsRaw.length}`);
if (presenters.length !== 49) throw new Error(`Expected 49 presenters, found ${presenters.length}`);

const used = new Map();
function uniqueSlug(name) {
  const base = slug(name) || "panelist";
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

const idByName = new Map(presenters.map((person) => [person.name, uniqueSlug(person.name)]));

const days = program.days.map((day) => {
  const date = new Date(`${day.date}T12:00:00-04:00`);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Virgin", weekday: "long" }).format(date);
  return {
    id: day.date,
    date: day.date,
    label: day.label,
    phase: day.phase,
    weekday,
    shortWeekday: weekday.slice(0, 3),
    dayNumber: day.date.slice(-2),
  };
});

const pillars = program.pillars.map((pillar) => ({
  id: slug(pillar.name),
  name: pillar.name,
  island: pillar.island,
  region: pillar.region,
}));
const pillarByName = new Map(pillars.map((pillar) => [pillar.name, pillar]));

const venues = venueFile.islands.map((island) => {
  const localDeck = (stay) => Boolean(stay.linkType === "pdf-preview" || (stay.url && stay.url.endsWith(".pdf")));
  return {
    id: slug(island.island),
    name: island.island,
    island: island.island,
    region: island.region,
    route: island.route,
    dock: island.dock,
    photos: [{ src: path.basename(island.image.src), alt: island.image.alt }],
    video: null,
    model: null,
    boat: island.onTheBoat.map((stay) => ({ name: stay.name, href: localDeck(stay) ? null : stay.url, localDeck: localDeck(stay) })),
    land: island.onTheBeachOrLand.map((stay) => ({ name: stay.name, href: localDeck(stay) ? null : stay.url, localDeck: localDeck(stay) })),
    notes: Object.values(island.notes ?? {}).filter(Boolean),
    noteBoat: island.notes?.onTheBoat ?? "",
    noteLand: island.notes?.onTheBeachOrLand ?? "",
    note: "Accommodation stop from brochure pages 21–22. The specific venue for each session is to be confirmed.",
  };
});
const venueByIsland = new Map(venues.map((venue) => [venue.island, venue]));

function sessionVenue(session) {
  const venue = venueByIsland.get(session.island);
  if (!venue) throw new Error(`${session.id} has no accommodations entry for ${session.island}`);
  return { island: session.island, venueId: venue.id, specific: null, label: "to be confirmed" };
}

const sessions = sessionsRaw.map((session) => {
  const pillar = pillarByName.get(session.track);
  if (!pillar) throw new Error(`Unknown pillar ${session.track}`);
  const speakerIds = (session.speakers ?? []).map((name) => {
    const id = idByName.get(name);
    if (!id) throw new Error(`${session.id} names ${name}, who is not on the roster`);
    return id;
  });
  const roles = {};
  for (const [name, role] of Object.entries(session.roles ?? {})) {
    const id = idByName.get(name);
    if (!id) throw new Error(`${session.id} role names ${name}, who is not on the roster`);
    roles[id] = role;
  }
  const timed = Boolean(session.start && session.end);
  return {
    id: session.id,
    title: session.title,
    description: session.description ?? "",
    outcome: session.outcome ?? "",
    dayId: session.date,
    start: timed ? `${session.date}T${session.start}:00-04:00` : null,
    end: timed ? `${session.date}T${session.end}:00-04:00` : null,
    timeLabel: session.timeLabel ?? null,
    supplemental: session.supplemental === true,
    optional: session.optional === true,
    pillarId: pillar.id,
    island: session.island,
    region: pillar.region,
    phase: session.phase ?? "",
    format: session.format ?? "",
    featured: session.featured === true,
    featureRole: session.featureRole ?? null,
    speakerIds,
    candidateIds: [],
    roles,
    specialists: session.specialists ?? "",
    status: session.status ?? "",
    sourceNote: session.sourceNote ?? null,
    venue: sessionVenue(session),
    sourcePage: session.sourcePage ?? null,
    sourceUrl: session.sourceUrl ?? "",
    workstream: session.workstream ?? "",
  };
});

function portraitFile(photoPath) {
  const base = path.basename(photoPath ?? "");
  if (!base || base.toLowerCase().endsWith(".svg")) return "";
  const stem = base.replace(/\.[^.]+$/, "");
  const webp = `${stem}.webp`;
  if (stem && existsSync(path.join(portraitDir, webp))) return webp;
  if (base && existsSync(path.join(portraitDir, base))) return base;
  return "";
}

const firstSession = new Map();
for (const session of sessions) {
  for (const id of session.speakerIds) {
    if (!firstSession.has(id)) firstSession.set(id, session);
  }
}

const panelists = presenters.map((person) => {
  const id = idByName.get(person.name);
  const home = firstSession.get(id);
  const photo = portraitFile(person.photo);
  return {
    id,
    name: person.name,
    displayName: person.displayName ?? null,
    company: person.company ?? "",
    title: person.role ?? "",
    photo,
    bio: person.bio ?? "",
    bioSourceLabel: person.bioSourceLabel ?? "",
    origin: person.origin ?? "",
    affiliations: Array.isArray(person.affiliations) ? person.affiliations : [],
    keynote: person.keynote === true,
    proposedPillarId: home?.pillarId ?? "",
    proposedIsland: home?.island ?? "",
  };
});

const transport = {
  checked: agendas.checked,
  intro: agendas.intro,
  venueAssumptions: agendas.venueAssumptions,
  borderNote: agendas.borderNote,
  sources: agendas.sources,
  modes: agendas.modes.map((mode) => ({
    id: mode.id,
    name: mode.name,
    summary: mode.summary,
    description: mode.description,
    warning: mode.warning,
    days: mode.days.map((day) => ({
      date: day.date,
      start: day.start,
      overnight: day.overnight,
      map: `${mode.id}-${day.date}.png`,
      mapDescription: `${mode.name}, ${day.date}`,
      items: day.items.map((item) =>
        item.sessionId
          ? { kind: "session", sessionId: item.sessionId }
          : { kind: "leg", time: item.time, title: item.title, detail: item.detail, caution: item.caution === true },
      ),
    })),
  })),
};

const stayGroups = [
  {
    heading: "U.S. Virgin Islands",
    routeLabel: "ROUTES 01–03",
    intro: null,
    islands: venues.filter((venue) => venue.region === "USVI").map(stayIsland),
  },
  {
    heading: "British Virgin Islands",
    routeLabel: "ROUTES 04–05",
    intro: venueFile.source.bviIntro,
    islands: venues.filter((venue) => venue.region === "BVI").map(stayIsland),
  },
];

function stayIsland(venue) {
  return {
    id: venue.id,
    island: venue.island,
    route: venue.route,
    dock: `Dock · ${venue.dock}`,
    image: venue.photos[0]?.src ?? "",
    imageAlt: venue.photos[0]?.alt ?? venue.island,
    sections: [
      { heading: "On the boat", providers: venue.boat, notes: venue.noteBoat ? [venue.noteBoat] : [] },
      { heading: "On the beach or on land", providers: venue.land, notes: venue.noteLand ? [venue.noteLand] : [] },
    ],
  };
}

const content = {
  generatedFrom: "TATEL website raw/public/tatel/downloads/tatel-2027-program.json plus venues.json",
  contentUrl: "/api/program",
  forum: {
    id: "tatel",
    name: "TATEL",
    edition: "Conversations",
    kicker: "The tech summit on water",
    dateLabel: "January 26 – 29, 2027",
    placeLabel: "Four days · across the Virgin Islands",
    startDate: program.weekAgenda?.[0]?.date ?? days[0].date,
    endDate: program.weekAgenda?.[program.weekAgenda.length - 1]?.date ?? days[days.length - 1].date,
    timezone: "America/Virgin",
    timezoneLabel: program.timezone,
    draftNotice: "January 26–29, 2027 · Four days across the Virgin Islands.",
    timingNote: program.timingNote ?? "",
    weekAgenda: program.weekAgenda ?? [],
    featuredStaffing: "Each session has one lead. Timed appearances are conflict-free; untimed activities still require scheduling.",
    participation: {
      featured: "Session lead",
      lead: "Session lead",
      contributor: "Session lead",
    },
    closing: "Different perspectives. One shared horizon.",
    days,
    pillars,
  },
  panelists,
  sessions,
  venues,
  sampleModel: {
    src: "/sample/viewer-sample.glb",
    label: "Sample model for the viewer. This is not a venue.",
  },
  scenes: [
    { id: 1, name: "Cyril E. King Airport", image: "scene-01.jpg", source: "", sha256: "" },
    { id: 2, name: "Red Hook · IGY Marina", image: "scene-02.jpg", source: "", sha256: "" },
    { id: 3, name: "Lovango Cay", image: "scene-03.jpg", source: "", sha256: "" },
    { id: 4, name: "Cruz Bay · VI National Park", image: "scene-04.jpg", source: "", sha256: "" },
    { id: 5, name: "Jost Van Dyke", image: "scene-05.jpg", source: "", sha256: "" },
    { id: 6, name: "Tortola · West End", image: "scene-06.jpg", source: "", sha256: "" },
    { id: 7, name: "Scrub Island Resort", image: "scene-07.jpg", source: "", sha256: "" },
    { id: 8, name: "Terrence B. Lettsome Airport", image: "scene-08.jpg", source: "", sha256: "" },
  ],
  stays: {
    intro: venueFile.source.intro,
    brochureUrl: venueFile.source.brochure,
    brochureNote: venueFile.source.sourcePagesNote,
    groups: stayGroups,
  },
  passes: {
    legend: "Choose your passage - Early bird pricing",
    sourceUrl: "https://www.tatelexclusive.com/attend",
    sourceNote: "Pass prices reflect this preview. Final inclusions and availability need confirmation before checkout goes live.",
    previewLabel: "DESIGN PREVIEW · NO PAYMENT COLLECTED",
    items: [
      { id: "beach", name: "BE on the Beach", price: "$1,900", unit: "PER GUEST", minimum: null, paragraphs: ["Beach pass details to be confirmed."], bullets: [] },
      {
        id: "boat",
        name: "BE on the boat.",
        price: "$2,500",
        unit: "PER GUEST",
        minimum: null,
        paragraphs: ["Journey one route across three islands and conference on the water — dock panels and beach panels with builders, founders, and investors, plus the onboard mini-panel underway between every leg."],
        bullets: ["Dock and beach panels for builders, founders & investors", "One route · 3 islands — choose Route 1 or Route 2", "The onboard mini-panel underway between stops"],
      },
      {
        id: "vip",
        name: "STAY onboard - All inclusive VIP",
        price: "$5,000",
        unit: "PER GUEST",
        minimum: "Minimum of 8 guests",
        paragraphs: [],
        bullets: [
          "Stay on the boats for the conference — every destination, at each stop along the way",
          "VIP sessions, beaches, boats and local water excursions with your own local guide and concierge",
          "Personal local guides at every island with curated lunches & dinners",
          "Sessions not just on the water — but in the water",
          "The entire four-day conference",
        ],
      },
    ],
  },
  transport,
  notifications: [
    {
      id: "draft-notice",
      title: "Program",
      body: "January 26–29, 2027 · Four days across the Virgin Islands. Speakers, session times, and specific venues remain subject to confirmation.",
      sentAt: "2026-11-09T12:00:00-04:00",
    },
    {
      id: "timing",
      title: "Times",
      body: program.timingNote,
      sentAt: "2026-11-09T12:00:00-04:00",
    },
    {
      id: "sample-transport",
      title: "Sample transportation",
      body: agendas.intro,
      sentAt: "2026-10-05T12:00:00-04:00",
    },
    {
      id: "pass-preview",
      title: "Pass preview",
      body: "DESIGN PREVIEW · NO PAYMENT COLLECTED Pass prices reflect this preview. Final inclusions and availability need confirmation before checkout goes live.",
      sentAt: "2026-10-04T12:00:00-04:00",
    },
  ],
  credits: {
    sentinel: "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017)",
    sentinelLicense: "https://creativecommons.org/licenses/by/4.0/",
    sentinelDocumentation: "https://eox.at/2017/08/sentinel-2-global-cloudless-mosaic/",
    sentinelPeriod: "2016 & 2017",
    sentinelNote: "Historical 2016-edition imagery from 2016–2017; not current imagery.",
    coastline: "Coastline data © OpenStreetMap contributors; ODbL 1.0 https://opendatacommons.org/licenses/odbl/1-0/ ; attribution https://www.openstreetmap.org/copyright",
    portraits: "Portraits are the files supplied with the panelist roster. Missing files are left blank.",
    logo: "The 1878 mark is the supplied 1878-logo-dark.png artwork.",
    scenes: "The eight backgrounds are the island scenes supplied with the program.",
    presentedBy: "https://tatel.18seventy8.com/",
  },
};

writeFileSync(path.join(repoRoot, "src/content/tatel.json"), `${JSON.stringify(content, null, 2)}\n`);

const photos = panelists.map((person) => person.photo).filter(Boolean);
const imageModule = `/* Generated by scripts/generate-tatel-content.mjs. Do not edit by hand. */
import type { ImageSourcePropType } from "react-native";
import { portraitKey } from "./portraitKey";

export const portraits: Record<string, ImageSourcePropType> = {
${photos.map((file) => `  ${JSON.stringify(file.replace(/\.[^.]+$/, ""))}: require("../assets/tatel/portraits/${file}"),`).join("\n")}
};

export function portraitFor(photo?: string | null): ImageSourcePropType | undefined {
  const key = portraitKey(photo);
  return key ? portraits[key] : undefined;
}

export const scenes: Record<string, ImageSourcePropType> = {
${content.scenes.map((scene) => `  ${JSON.stringify(scene.image)}: require("../assets/tatel/scenes/${scene.image}"),`).join("\n")}
};

export const routeMaps: Record<string, ImageSourcePropType> = {
${transport.modes.flatMap((mode) => mode.days.map((day) => `  ${JSON.stringify(day.map)}: require("../assets/tatel/routes/${day.map}"),`)).join("\n")}
};

export const logo1878 = require("../assets/tatel/1878-logo-dark.png") as ImageSourcePropType;

export const ilmaPages: ImageSourcePropType[] = [
${Array.from({ length: 12 }, (_, index) => `  require("../assets/tatel/ilma/page-${String(index + 1).padStart(2, "0")}.jpg"),`).join("\n")}
];

export const beaconPoster = require("../assets/tatel/beacon-poster.jpg") as ImageSourcePropType;
`;
writeFileSync(path.join(repoRoot, "src/images.ts"), imageModule);

const tba = sessions.filter((session) => session.speakerIds.length === 0).length;
console.log(JSON.stringify({
  sessions: sessions.length,
  supplemental: sessions.filter((session) => session.supplemental).length,
  panelists: panelists.length,
  photos: photos.length,
  venues: venues.length,
  tba,
}));

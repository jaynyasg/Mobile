/**
 * Build src/content/tatel.json and src/content/images.ts from an extracted
 * TATELprep tree. Nothing in the program is typed by hand.
 *
 *   TATEL_SOURCE=/path/to/extracted node scripts/generate-tatel-content.mjs
 *
 * The default source is /tmp/tatel-src. Point it at a checkout whose paths
 * match jaynyasg/TATELprep main (public/, docs/, and the image archive).
 */
import { mkdirSync, readFileSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(process.env.TATEL_SOURCE ?? "/tmp/tatel-src");
const assetRoot = path.join(repoRoot, "assets", "tatel");

function read(relative) {
  return readFileSync(path.join(sourceRoot, relative), "utf8");
}

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function textBetween(html, pattern) {
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing pattern ${pattern}`);
  return match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—");
}

function stripTags(value) {
  return decode(value.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

const programFile = JSON.parse(read("public/downloads/tatel-2027-program.json"));
const scenesFile = JSON.parse(read("public/scenes.json"));
const imagery = JSON.parse(read("public/assets/route-maps/aerial-imagery.json"));
const routeManifest = JSON.parse(read("public/assets/route-maps/manifest.json"));
const presentersJs = read("public/presenters.js");
const sandbox = { window: {} };
vm.runInNewContext(presentersJs, sandbox);
const presenters = sandbox.window.PRESENTERS;
if (!Array.isArray(presenters) || presenters.length !== 29) {
  throw new Error(`Expected 29 presenters, found ${presenters?.length}`);
}

const sessionsRaw = programFile.sessions;
const byName = new Map(presenters.map((person) => [person.name, slug(person.name)]));
for (const session of sessionsRaw) {
  for (const name of [...session.speakers, ...session.candidates]) {
    if (!byName.has(name)) throw new Error(`Session ${session.id} names ${name}, who is not on the roster`);
  }
}

const homeByName = new Map();
for (const session of sessionsRaw) {
  for (const name of [...session.speakers, ...session.candidates]) {
    if (!homeByName.has(name)) homeByName.set(name, { pillar: session.track, island: session.island });
  }
}

const days = programFile.program.days.map((day) => {
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

const pillars = programFile.program.pillars.map((pillar) => ({
  id: slug(pillar.name),
  name: pillar.name,
  island: pillar.island,
  region: pillar.region,
}));

const pillarByName = new Map(pillars.map((pillar) => [pillar.name, pillar]));

function iso(date, time) {
  return `${date}T${time}:00-04:00`;
}

const sessions = sessionsRaw.map((session) => {
  const pillar = pillarByName.get(session.track);
  if (!pillar) throw new Error(`Unknown pillar ${session.track}`);
  if (pillar.island !== session.island) {
    throw new Error(`${session.id} island ${session.island} does not match ${pillar.island}`);
  }
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    outcome: session.outcome,
    dayId: session.date,
    start: iso(session.date, session.start),
    end: iso(session.date, session.end),
    pillarId: pillar.id,
    island: session.island,
    region: pillar.region,
    phase: session.phase,
    format: session.format,
    featured: session.featured === true,
    featureRole: session.featureRole,
    speakerIds: session.speakers.map((name) => byName.get(name)),
    candidateIds: session.candidates.map((name) => byName.get(name)),
    specialists: session.specialists,
    status: session.status,
    venue: session.venue,
    sourcePage: session.sourcePage,
    sourceUrl: session.sourceUrl,
    workstream: session.workstream,
  };
});

const panelists = presenters.map((person) => {
  const home = homeByName.get(person.name);
  if (!home) throw new Error(`${person.name} has no proposed session`);
  const photo = path.basename(person.photo);
  return {
    id: byName.get(person.name),
    name: person.name,
    company: person.company,
    title: person.role,
    photo,
    proposedPillarId: pillarByName.get(home.pillar).id,
    proposedIsland: home.island,
  };
});

const scenes = scenesFile.map((scene) => ({
  id: scene.id,
  name: scene.name,
  image: path.basename(scene.image),
  source: scene.source,
  sha256: scene.sha256,
}));

const indexHtml = read("public/index.html");
const draftNotice = textBetween(indexHtml, /<p class="draft-notice">([\s\S]*?)<\/p>/);
const stayIntro = textBetween(indexHtml, /<div class="stay-intro"><p>([\s\S]*?)<\/p>/);
const brochureUrl = "https://partner.tatel.io/";
const brochureNote = textBetween(indexHtml, /<span class="source-pages">([\s\S]*?)<\/span>/);

const accommodationsHtml = indexHtml.split('id="accommodations"')[1].split('<section class="closing">')[0];
const stayGroups = [];
const groupBlocks = accommodationsHtml.split('<div class="island-group">').slice(1);
for (const block of groupBlocks) {
  const headingHtml = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1];
  const routeLabel = headingHtml.match(/<span>([\s\S]*?)<\/span>/);
  const heading = stripTags(headingHtml.replace(/<span>[\s\S]*?<\/span>/, ""));
  const introMatch = block.match(/<p class="island-group-intro">([\s\S]*?)<\/p>/);
  const cards = [];
  const cardPattern = /<article class="stay-card">([\s\S]*?)<\/article>/g;
  let cardMatch;
  while ((cardMatch = cardPattern.exec(block))) {
    const card = cardMatch[1];
    const image = path.basename(card.match(/<img src="([^"]+)"/)[1]);
    const imageAlt = decode(card.match(/alt="([^"]*)"/)[1]);
    const route = stripTags(card.match(/<span>(ROUTE [^<]+)<\/span>/)[1]);
    const island = stripTags(card.match(/<h4>([\s\S]*?)<\/h4>/)[1]);
    const dock = stripTags(card.match(/<p class="dock-name">([\s\S]*?)<\/p>/)[1]);
    const sections = [];
    const sectionPattern = /<h5>([\s\S]*?)<\/h5>([\s\S]*?)(?=<h5>|<\/div>\s*$)/g;
    let sectionMatch;
    while ((sectionMatch = sectionPattern.exec(card))) {
      const body = sectionMatch[2];
      const providers = [];
      const linkPattern = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      let linkMatch;
      while ((linkMatch = linkPattern.exec(body))) {
        const href = decode(linkMatch[1]);
        providers.push({
          name: stripTags(linkMatch[2]).replace(/\s*↗\s*$/, "").trim(),
          href: href.startsWith("assets/") ? null : href,
          localDeck: href.endsWith(".pdf"),
        });
      }
      const notes = [...body.matchAll(/<p class="stay-note">([\s\S]*?)<\/p>/g)].map((note) => stripTags(note[1]));
      sections.push({ heading: stripTags(sectionMatch[1]), providers, notes });
    }
    cards.push({
      id: slug(island),
      island,
      route,
      dock,
      image,
      imageAlt,
      sections,
    });
  }
  stayGroups.push({
    heading,
    routeLabel: routeLabel ? stripTags(routeLabel[1]) : null,
    intro: introMatch ? stripTags(introMatch[1]) : null,
    islands: cards,
  });
}

if (stayGroups.length !== 2) throw new Error(`Expected 2 stay groups, found ${stayGroups.length}`);

const mooring = read("public/mooring-preview.js");
const passes = [];
const passPattern = /<article class="mooring-pass">([\s\S]*?)<\/article>/g;
let passMatch;
while ((passMatch = passPattern.exec(mooring))) {
  const article = passMatch[1];
  const value = article.match(/value="([^"]+)"/)[1];
  const name = stripTags(article.match(/<strong>([\s\S]*?)<\/strong>/)[1]);
  const price = stripTags(article.match(/<span class="mooring-price">([\s\S]*?)<small>/)[1]);
  const unit = stripTags(article.match(/<small>([\s\S]*?)<\/small>/)[1]);
  const minimum = /Minimum of 8 guests/.test(article) ? "Minimum of 8 guests" : null;
  const paragraphs = [...article.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((item) => stripTags(item[1]));
  const bullets = [...article.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((item) => stripTags(item[1]));
  passes.push({ id: value, name, price, unit, minimum, paragraphs, bullets });
}
if (passes.length !== 3) throw new Error(`Expected 3 passes, found ${passes.length}`);
const passSourceUrl = mooring.match(/href="(https:\/\/www\.tatelexclusive\.com\/attend)"/)[1];
const passSourceNote = stripTags(mooring.match(/<div class="mooring-source">[\s\S]*?<p>([\s\S]*?)<\/p>/)[1]);
const passPreviewLabel = "DESIGN PREVIEW · NO PAYMENT COLLECTED";

const appJs = read("public/app.js");
const featuredStaffing = appJs.match(/'Potential contributors only\.[^']+'/)[0].slice(1, -1);
const participation = {
  featured: "Potential contributor · Not assigned",
  lead: "Proposed lead / convener",
  contributor: "Proposed contributor",
};

const decisions = read("docs/lovable/PROGRAM-DECISIONS.md");
const tuesday = decisions
  .split("## Tuesday access")[1]
  .split("When preparing")[0]
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .join(" ")
  .replace(/\*\*/g, "");

const agendas = programFile.agendas;
const transport = agendas.modes.map((mode) => ({
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
    mapDescription: routeManifest.find((entry) => entry.mode === mode.id && entry.date === day.date)?.description ?? null,
    items: day.items.map((item) =>
      item.sessionId
        ? { kind: "session", sessionId: item.sessionId }
        : { kind: "leg", time: item.time, title: item.title, detail: item.detail, caution: item.caution === true },
    ),
  })),
}));

for (const mode of transport) {
  for (const day of mode.days) {
    if (!day.mapDescription) throw new Error(`Missing route map for ${mode.id} ${day.date}`);
    for (const item of day.items) {
      if (item.kind === "session" && !sessions.some((session) => session.id === item.sessionId)) {
        throw new Error(`Agenda ${mode.id} references missing session ${item.sessionId}`);
      }
    }
  }
}

const notifications = [
  {
    id: "proposed-program",
    title: "Proposed program",
    body: draftNotice,
    sentAt: "2026-10-05T12:00:00-04:00",
  },
  {
    id: "tuesday-access",
    title: "Tuesday access",
    body: tuesday,
    sentAt: "2026-10-05T12:00:00-04:00",
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
    body: `${passPreviewLabel} ${passSourceNote}`,
    sentAt: "2026-10-04T12:00:00-04:00",
  },
];

const credits = {
  sentinel: imagery.attribution,
  sentinelLicense: imagery.license,
  sentinelDocumentation: imagery.sourceDocumentation,
  sentinelPeriod: imagery.imageryPeriod,
  sentinelNote: "Historical 2016-edition imagery from 2016–2017; not current imagery.",
  coastline: "Coastline data © OpenStreetMap contributors; ODbL 1.0 https://opendatacommons.org/licenses/odbl/1-0/ ; attribution https://www.openstreetmap.org/copyright",
  portraits: "Portrait files and the roster were copied unchanged from the supplied Panelists source. Company and title come from the presenter roster.",
  logo: "The 1878 mark is the supplied 1878-logo-dark.png artwork.",
  scenes: "The eight backgrounds keep the source URLs and SHA-256 hashes from scenes.json.",
  presentedBy: "https://tatel.18seventy8.com/",
};

const content = {
  generatedFrom: "TATELprep public/downloads/tatel-2027-program.json, public/presenters.js, public/scenes.json, public/index.html, public/mooring-preview.js, and public/assets/route-maps/",
  forum: {
    id: "tatel",
    name: "TATEL",
    edition: "Conversations",
    kicker: "The tech summit on water",
    dateLabel: "January 26 – 29, 2027",
    placeLabel: "Four days · across the Virgin Islands",
    startDate: days[0].date,
    endDate: days[days.length - 1].date,
    timezone: "America/Virgin",
    timezoneLabel: programFile.program.timezone,
    draftNotice,
    featuredStaffing,
    participation,
    closing: "Different perspectives. One shared horizon.",
    days,
    pillars,
  },
  panelists,
  sessions,
  scenes,
  stays: {
    intro: stayIntro,
    brochureUrl,
    brochureNote,
    groups: stayGroups,
  },
  passes: {
    legend: "Choose your passage - Early bird pricing",
    sourceUrl: passSourceUrl,
    sourceNote: passSourceNote,
    previewLabel: passPreviewLabel,
    items: passes,
  },
  transport: {
    checked: agendas.checked,
    intro: agendas.intro,
    venueAssumptions: agendas.venueAssumptions,
    borderNote: agendas.borderNote,
    sources: agendas.sources,
    modes: transport,
  },
  notifications,
  credits,
};

const contentDir = path.join(repoRoot, "src", "content");
mkdirSync(contentDir, { recursive: true });
writeFileSync(path.join(contentDir, "tatel.json"), `${JSON.stringify(content, null, 2)}\n`);

function place(fromRelative, toRelative) {
  const from = path.join(sourceRoot, fromRelative);
  const to = path.join(assetRoot, toRelative);
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
}

rmSync(assetRoot, { recursive: true, force: true });
for (const person of panelists) place(`public/assets/${person.photo}`, `portraits/${person.photo}`);
for (const scene of scenes) place(`public/assets/${scene.image}`, `scenes/${scene.image}`);
for (const mode of transport) {
  for (const day of mode.days) {
    place(`public/assets/route-maps/${mode.id}-${day.date}.png`, `routes/${day.map}`);
  }
}
place("public/assets/1878-logo-dark.png", "1878-logo-dark.png");
for (let page = 1; page <= 12; page += 1) {
  const name = `page-${String(page).padStart(2, "0")}.jpg`;
  place(`public/assets/ilma-deck-plans/${name}`, `ilma/${name}`);
}

function requireLines(directory, files) {
  return files
    .map((file) => `  ${JSON.stringify(file)}: require("../assets/tatel/${directory}/${file}"),`)
    .join("\n");
}

const imageModule = `/* Generated by scripts/generate-tatel-content.mjs. Do not edit by hand. */
import type { ImageSourcePropType } from "react-native";

export const portraits: Record<string, ImageSourcePropType> = {
${requireLines("portraits", panelists.map((person) => person.photo))}
};

export const scenes: Record<string, ImageSourcePropType> = {
${requireLines("scenes", scenes.map((scene) => scene.image))}
};

export const routeMaps: Record<string, ImageSourcePropType> = {
${requireLines(
  "routes",
  transport.flatMap((mode) => mode.days.map((day) => day.map)),
)}
};

export const logo1878 = require("../assets/tatel/1878-logo-dark.png") as ImageSourcePropType;

export const ilmaPages: ImageSourcePropType[] = [
${Array.from({ length: 12 }, (_, index) => {
  const name = `page-${String(index + 1).padStart(2, "0")}.jpg`;
  return `  require("../assets/tatel/ilma/${name}"),`;
}).join("\n")}
];
`;

writeFileSync(path.join(repoRoot, "src", "images.ts"), imageModule);

const counts = {
  sessions: sessions.length,
  featured: sessions.filter((session) => session.featured).length,
  circuit: sessions.filter((session) => session.featureRole === "Circuit feature").length,
  regular: sessions.filter((session) => !session.featured).length,
  panelists: panelists.length,
  stays: stayGroups.reduce((sum, group) => sum + group.islands.length, 0),
  passes: passes.length,
  maps: transport.reduce((sum, mode) => sum + mode.days.length, 0),
};
console.log(JSON.stringify(counts));

/**
 * Turn the approved venue photo zips and venue-matches.json into
 * public/venues responsive images plus src/content/places.json.
 *
 *   node scripts/build-venue-media.mjs
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploads = process.env.VENUE_UPLOADS ?? "/home/ubuntu/.cursor/projects/agent-repos-Mobile/uploads";
const publicRoot = path.join(repoRoot, "public/venues");
const widths = [640, 1280];
const catalog = JSON.parse(readFileSync(path.join(uploads, "venue-matches_5e4f.json"), "utf8"));

const islandIds = {
  "St. Thomas": "st-thomas",
  Lovango: "lovango",
  "St. John": "st-john",
  "Jost Van Dyke": "jost-van-dyke",
  "Scrub Island": "scrub-island",
};

const zipById = {
  "ritz-carlton-st-thomas": "ritz-carlton-st-thomas_9e53.zip",
  "margaritaville-vacation-club": "margaritaville-vacation-club_7a5b.zip",
  "lovango-resort-beach-club": "lovango-resort-beach-club_3a74.zip",
  "hideout-white-bay": "hideout-white-bay_2513.zip",
  "scrub-island-resort": "scrub-island-resort_4d05.zip",
  "gallows-point-resort": "gallows-point-resort_60cc.zip",
  "emerald-beach-resort": "emerald-beach-resort_e588.zip",
};

function stem(file) {
  return path.basename(file, path.extname(file)).toUpperCase();
}

function peopleOrFrame(notes) {
  const text = notes.toLowerCase();
  return (
    text.includes("people-focused") ||
    text.includes("selfie") ||
    text.includes("cropped people") ||
    text.includes("person at") ||
    text.includes("video frame") ||
    text.includes("screen captures/video") ||
    text.includes("venue not visible") ||
    text.includes("ritz kids")
  );
}

function uncertain(entry) {
  return entry.confidence === "low" || /IMG_265[4-9]/i.test(entry.file);
}

function heroRank(entry) {
  if (peopleOrFrame(entry.notes) || uncertain(entry)) return 0;
  let score = entry.confidence === "high" ? 30 : entry.confidence === "med" ? 20 : 0;
  const notes = entry.notes.toLowerCase();
  if (notes.includes("property images") || notes.includes("infinity") || notes.includes("marina")) score += 8;
  if (notes.includes("oceanfront") || notes.includes("treehouse") || notes.includes("plunge")) score += 4;
  return score;
}

function encode(source, destBase) {
  for (const width of widths) {
    execFileSync("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      source,
      "-vf",
      `scale=${width}:-2`,
      "-c:v",
      "libwebp",
      "-quality",
      "74",
      `${destBase}-${width}.webp`,
    ]);
  }
  execFileSync("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    source,
    "-vf",
    "scale=1280:-2",
    "-q:v",
    "5",
    `${destBase}-1280.jpg`,
  ]);
}

rmSync(publicRoot, { recursive: true, force: true });
const places = [];

for (const [id, zipName] of Object.entries(zipById)) {
  const record = catalog[id];
  if (!record) throw new Error(`Missing match record ${id}`);
  const extract = path.join("/tmp/venue-src", id);
  rmSync(extract, { recursive: true, force: true });
  mkdirSync(extract, { recursive: true });
  execFileSync("unzip", ["-q", "-o", path.join(uploads, zipName), "-d", "/tmp/venue-src"]);
  const files = readdirSync(extract).filter((name) => /\.(jpe?g|png)$/i.test(name));
  const byStem = new Map(files.map((name) => [stem(name), path.join(extract, name)]));
  const outDir = path.join(publicRoot, id);
  mkdirSync(outDir, { recursive: true });
  const photos = [];
  for (const entry of record.files) {
    const source = byStem.get(stem(entry.file));
    if (!source) throw new Error(`${id} is missing ${entry.file}`);
    const base = stem(entry.file).toLowerCase();
    encode(source, path.join(outDir, base));
    photos.push({
      id: base,
      alt: `${record.venue.replace(/ \(NOT.*\)/, "")}, ${base}`,
      hero: false,
      uncertain: uncertain(entry),
      confidence: entry.confidence,
      webp640: `/venues/${id}/${base}-640.webp`,
      webp1280: `/venues/${id}/${base}-1280.webp`,
      jpeg: `/venues/${id}/${base}-1280.jpg`,
    });
  }
  const ranked = record.files
    .map((entry, index) => ({ entry, index, score: heroRank(entry) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  if (!ranked.length) throw new Error(`${id} has no hero candidate`);
  const heroId = stem(ranked[0].entry.file).toLowerCase();
  const hero = photos.find((photo) => photo.id === heroId);
  hero.hero = true;
  const cleanName = record.venue.replace(/\s*\(NOT.*\)/, "");
  const added = record.on_tatelprep_accommodations_list === false;
  places.push({
    id,
    name: cleanName,
    island: record.island,
    islandVenueId: islandIds[record.island],
    source: added ? "app-addition" : "accommodations",
    sourceNote: added
      ? "Added in the app. This place is not in the website Accommodations list."
      : "Listed in the website Accommodations section.",
    hero: hero.webp1280,
    photos,
    models: [],
  });
  console.log(id, photos.length, "hero", heroId, added ? "app-addition" : "accommodations");
}

const emerald = places.find((place) => place.id === "emerald-beach-resort");
const modelDir = path.join(publicRoot, "emerald-beach-resort/models");
mkdirSync(modelDir, { recursive: true });
copyFileSync("/tmp/emerald-glb/site-visit.glb", path.join(modelDir, "site-visit.glb"));
copyFileSync("/tmp/emerald-glb/scan-1019.glb", path.join(modelDir, "scan-1019.glb"));
emerald.models = [
  {
    src: "/venues/emerald-beach-resort/models/site-visit.glb",
    label: "Emerald Beach Resort site visit, Scaniverse scan",
  },
  {
    src: "/venues/emerald-beach-resort/models/scan-1019.glb",
    label: "Emerald Beach Resort scan, 10 19 2026",
  },
];

writeFileSync(path.join(repoRoot, "src/content/places.json"), `${JSON.stringify(places, null, 2)}\n`);
console.log("places", places.length);

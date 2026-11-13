import {
  credits,
  forum,
  panelistById,
  panelistNames,
  panelists,
  participationLabel,
  passes,
  pillarById,
  sessions,
  sessionsForPanelist,
  stayIslands,
  transport,
} from "../content";
import { getProgram } from "../content/active";
import { joinLine } from "../content/labels";
import { sessionDateLine } from "./dayTheme";

export interface Citation {
  title: string;
  kind: "session" | "panelist" | "screen";
  id: string;
}

export interface GuideAnswer {
  text: string;
  citations: Citation[];
}

interface GuideDoc {
  id: string;
  title: string;
  body: string;
  keywords?: string[];
  citation: Citation;
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "for",
  "in",
  "on",
  "at",
  "is",
  "are",
  "do",
  "does",
  "what",
  "when",
  "where",
  "who",
  "how",
  "with",
  "your",
  "you",
  "my",
  "me",
  "please",
  "tell",
  "about",
  "from",
  "this",
  "that",
  "will",
  "can",
  "which",
]);

const FALLBACK =
  "I only know the TATEL sessions on this device: proposed sessions, panelists, islands, sample transport, stays, and the pass preview. Try a name, a track, or an island.";

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function scoreDoc(queryTokens: string[], doc: GuideDoc): number {
  const titleTokens = tokens(doc.title);
  const extra = tokens((doc.keywords ?? []).join(" "));
  const bodyTokens = tokens(doc.body);
  let score = 0;
  for (const token of queryTokens) {
    if (titleTokens.includes(token)) score += 5;
    else if (extra.includes(token)) score += 4;
    else if (bodyTokens.includes(token)) score += 1;
  }
  if (titleTokens.length > 0 && titleTokens.every((token) => queryTokens.includes(token))) score += 6;
  return score;
}

function buildCorpus(): GuideDoc[] {
  const { forum, sessions, panelists, passes, transport, credits } = getProgram();
  const zone = forum.timezone;
  const docs: GuideDoc[] = [
    {
      id: "draft",
      title: "Proposed program",
      keywords: ["draft", "unconfirmed", "confirmation"],
      body: forum.draftNotice,
      citation: { title: "Sessions", kind: "screen", id: "agenda" },
    },
    {
      id: "delete",
      title: "Delete my data",
      keywords: ["privacy", "settings", "erase"],
      body: "Settings has Delete my data. It clears favorites, messages, guide history, notification reads, your opt-in, and your profile from this device. The program stays.",
      citation: { title: "Settings", kind: "screen", id: "settings" },
    },
    {
      id: "time",
      title: "Atlantic time",
      keywords: ["ast", "local", "clock", "timezone"],
      body: `Session times are proposed in ${forum.timezoneLabel}. The phone also shows its own clock when the two differ. Times, venues, and participation remain unconfirmed.`,
      citation: { title: "Sessions", kind: "screen", id: "agenda" },
    },
    {
      id: "passes",
      title: "Pass preview",
      keywords: ["ticket", "price", "checkout", "beach", "boat", "vip"],
      body: `${passes.previewLabel} ${passes.legend}. ${passes.items
        .map((pass) => `${pass.name} ${pass.price} ${pass.unit}${pass.minimum ? `, ${pass.minimum}` : ""}`)
        .join(". ")}. ${passes.sourceNote}`,
      citation: { title: "Pass preview", kind: "screen", id: "ticket" },
    },
    {
      id: "imagery",
      title: "Route map imagery",
      keywords: ["sentinel", "satellite", "map"],
      body: `${credits.sentinelNote} ${credits.sentinel} License ${credits.sentinelLicense}. ${credits.coastline}`,
      citation: { title: "Sample transport", kind: "screen", id: "transport" },
    },
  ];

  for (const pillar of forum.pillars) {
    docs.push({
      id: `pillar-${pillar.id}`,
      title: `${pillar.name} pillar`,
      keywords: [pillar.island, pillar.region],
      body: `${pillar.name} is planned on ${pillar.island} (${pillar.region}). The specific venue is to be confirmed.`,
      citation: { title: pillar.name, kind: "screen", id: `pillar:${pillar.id}` },
    });
  }

  for (const mode of transport.modes) {
    docs.push({
      id: `transport-${mode.id}`,
      title: mode.name,
      keywords: ["transport", "agenda", "unconfirmed"],
      body: `${transport.intro} ${mode.name}: ${mode.summary}. ${mode.description} ${mode.warning}`,
      citation: { title: mode.name, kind: "screen", id: "transport" },
    });
  }

  for (const island of stayIslands()) {
    const providers = island.sections.flatMap((section) => section.providers.map((provider) => provider.name)).join(", ");
    docs.push({
      id: `stay-${island.id}`,
      title: `${island.island} accommodations`,
      keywords: ["stay", "hotel", island.dock],
      body: `${island.island}, ${island.route}. ${island.dock}. Places to stay: ${providers}.`,
      citation: { title: island.island, kind: "screen", id: `stay:${island.id}` },
    });
  }

  for (const session of sessions) {
    const day = forum.days.find((item) => item.id === session.dayId);
    const people = panelistNames(session.speakerIds) || "Speaker to be announced";
    const when = sessionDateLine(session, forum.days, zone);
    docs.push({
      id: `session-${session.id}`,
      title: session.title,
      keywords: [session.island, session.featured ? "featured" : "regular"],
      body: `${session.title}. ${day?.label}. ${when} on ${session.island}. ${session.format}. ${session.description} Lead: ${people}. Venue: to be confirmed.`,
      citation: { title: session.title, kind: "session", id: session.id },
    });
  }

  for (const person of panelists) {
    const talks = sessionsForPanelist(person.id);
    const lines = talks.slice(0, 4).map((session) => {
      const role = participationLabel(session, person.id);
      const when = sessionDateLine(session, forum.days, zone);
      return `${session.title}, ${when} (${role})`;
    });
    const pillar = pillarById(person.proposedPillarId);
    docs.push({
      id: `panelist-${person.id}`,
      title: person.name,
      keywords: [person.company, person.title, person.proposedIsland],
      body: `${joinLine([person.name, person.title, person.company])}. ${joinLine([pillar?.name ?? "Topic to be announced", person.proposedIsland || "Location TBC"])}. Linked sessions: ${lines.join("; ")}.`,
      citation: { title: person.name, kind: "panelist", id: person.id },
    });
  }

  return docs;
}

let corpus: GuideDoc[] | null = null;
let corpusProgram: unknown = null;

export function answerQuestion(question: string): GuideAnswer {
  const program = getProgram();
  if (corpusProgram !== program) {
    corpus = null;
    corpusProgram = program;
  }
  const queryTokens = tokens(question);
  if (queryTokens.length === 0) return { text: FALLBACK, citations: [] };
  corpus ??= buildCorpus();
  const ranked = corpus
    .map((doc) => ({ doc, score: scoreDoc(queryTokens, doc) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.length - b.doc.title.length);
  if (ranked.length === 0) return { text: FALLBACK, citations: [] };
  const citations: Citation[] = [];
  for (const item of ranked) {
    if (citations.some((citation) => citation.kind === item.doc.citation.kind && citation.id === item.doc.citation.id)) continue;
    citations.push(item.doc.citation);
    if (citations.length === 3) break;
  }
  return { text: ranked[0].doc.body, citations };
}

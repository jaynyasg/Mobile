import {
  exhibitors,
  forum,
  formatLabel,
  roomById,
  sessions,
  sessionsForSpeaker,
  speakers,
  sponsors,
  subEvents,
  tierLabel,
} from "../content";
import { formatRange } from "./time";

export interface Citation {
  title: string;
  kind: "session" | "speaker" | "sponsor" | "screen";
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
  "I only know the Portico program: sessions, speakers, rooms, sponsors, and the two side gatherings. Try a name, a room, or “Studio Walk.”";

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
  if (titleTokens.length > 0 && titleTokens.every((token) => queryTokens.includes(token))) {
    score += 6;
  }
  return score;
}

function buildCorpus(): GuideDoc[] {
  const zone = forum.timezone;
  const docs: GuideDoc[] = [];

  docs.push({
    id: "place-hall",
    title: "Harbor Hall",
    keywords: ["venue", "address", "where", "map"],
    body: `${forum.venue.name}, ${forum.venue.addressLine}, ${forum.venue.locality}. ${forum.venue.summary} ${forum.venue.pinNote}`,
    citation: { title: "Harbor Hall", kind: "screen", id: "venue" },
  });

  for (const room of forum.venue.rooms) {
    docs.push({
      id: `room-${room.id}`,
      title: room.name,
      body: `${room.name} is on ${room.floor} at Harbor Hall. ${room.summary}`,
      citation: { title: room.name, kind: "screen", id: "venue" },
    });
  }

  docs.push({
    id: "guide-badge",
    title: "Badge",
    keywords: ["pass", "ticket", "qr", "pickup", "lobby", "check"],
    body: "Passes are picked up in the Lobby from 8:30 AM Pacific on Tuesday. Your sample badge and its QR code are on the Badge screen. The code is the pass id for this demo, not a live ticket.",
    citation: { title: "Badge", kind: "screen", id: "ticket" },
  });

  const lunches = sessions.filter((session) => session.id.startsWith("lunch"));
  docs.push({
    id: "guide-lunch",
    title: "Lunch",
    keywords: ["courtyard", "food"],
    body: `Lunch is in the courtyard every day, with no program. ${lunches
      .map((session) => {
        const day = forum.days.find((item) => item.id === session.dayId);
        return `${day?.weekday} ${formatRange(session.start, session.end, zone)}`;
      })
      .join("; ")}.`,
    citation: { title: "Agenda", kind: "screen", id: "agenda" },
  });

  const reception = sessions.find((session) => session.id === "reception-tue");
  if (reception) {
    docs.push({
      id: "guide-reception",
      title: "Opening reception",
      body: `The opening reception is ${formatRange(reception.start, reception.end, zone)} in the courtyard.`,
      citation: { title: reception.title, kind: "session", id: reception.id },
    });
  }

  docs.push({
    id: "guide-delete",
    title: "Delete my data",
    keywords: ["privacy", "settings", "erase"],
    body: "Settings has Delete my data. It clears favorites, seats, messages, meeting requests, votes, questions, your card, and your profile from this device. The program stays.",
    citation: { title: "Settings", kind: "screen", id: "settings" },
  });

  docs.push({
    id: "guide-time",
    title: "Time zones",
    keywords: ["pacific", "local", "clock"],
    body: "The forum runs on Pacific time. Every session also shows the clock on this phone, when the two differ.",
    citation: { title: "Agenda", kind: "screen", id: "agenda" },
  });

  docs.push({
    id: "guide-conduct",
    title: "Conduct",
    body: forum.conduct.join(" "),
    citation: { title: "Harbor Hall", kind: "screen", id: "venue" },
  });

  for (const track of forum.tracks) {
    const titles = sessions
      .filter((session) => session.trackId === track.id && session.format !== "social")
      .map((session) => session.title);
    docs.push({
      id: `track-${track.id}`,
      title: `${track.name} track`,
      keywords: [track.name.toLowerCase()],
      body: `${track.description} On the program: ${titles.join("; ")}.`,
      citation: { title: "Agenda", kind: "screen", id: "agenda" },
    });
  }

  for (const session of sessions) {
    if (session.format === "social") continue;
    const day = forum.days.find((item) => item.id === session.dayId);
    const room = roomById(session.roomId);
    const names = session.speakerIds
      .map((id) => speakers.find((speaker) => speaker.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    docs.push({
      id: `session-${session.id}`,
      title: session.title,
      body: `${session.title} is a ${formatLabel[session.format].toLowerCase()} on ${day?.weekday}, ${formatRange(session.start, session.end, zone)}, in the ${room?.name}. ${session.summary}${names ? ` With ${names}.` : ""}`,
      citation: { title: session.title, kind: "session", id: session.id },
    });
  }

  for (const speaker of speakers) {
    const talks = sessionsForSpeaker(speaker.id);
    const lines = talks.map((session) => {
      const day = forum.days.find((item) => item.id === session.dayId);
      const room = roomById(session.roomId);
      return `${day?.weekday} ${formatRange(session.start, session.end, zone)}, ${session.title}, ${room?.name}`;
    });
    docs.push({
      id: `speaker-${speaker.id}`,
      title: speaker.name,
      keywords: [speaker.company],
      body: `${speaker.name} is ${speaker.title} at ${speaker.company}. ${speaker.bio} On the program: ${lines.join("; ")}.`,
      citation: { title: speaker.name, kind: "speaker", id: speaker.id },
    });
  }

  for (const sponsor of sponsors) {
    const deals = sponsor.deals.map((deal) => `${deal.title}. ${deal.detail}`).join(" ");
    docs.push({
      id: `sponsor-${sponsor.id}`,
      title: sponsor.name,
      keywords: [tierLabel[sponsor.tier], "deal", "sponsor"],
      body: `${sponsor.name} is a ${tierLabel[sponsor.tier].toLowerCase()}. ${sponsor.summary} ${deals}`,
      citation: { title: sponsor.name, kind: "sponsor", id: sponsor.id },
    });
  }

  for (const subEvent of subEvents) {
    const tables = exhibitors
      .filter((exhibitor) => exhibitor.subEventId === subEvent.id)
      .map((exhibitor) => `${exhibitor.name} (${exhibitor.table})`)
      .join(", ");
    docs.push({
      id: `sub-${subEvent.id}`,
      title: subEvent.name,
      body: `${subEvent.name} is ${subEvent.whenLabel}, ${subEvent.where}. ${subEvent.summary} Tables: ${tables}.`,
      citation: { title: subEvent.name, kind: "screen", id: subEvent.id },
    });
  }

  for (const exhibitor of exhibitors) {
    const gathering = subEvents.find((subEvent) => subEvent.id === exhibitor.subEventId);
    const roles = exhibitor.roles?.length ? ` Open roles: ${exhibitor.roles.join(", ")}.` : "";
    docs.push({
      id: `table-${exhibitor.id}`,
      title: exhibitor.name,
      keywords: ["table", exhibitor.table, gathering?.name ?? ""],
      body: `${exhibitor.name} is table ${exhibitor.table} at the ${gathering?.name}. ${exhibitor.summary}${roles}`,
      citation: { title: gathering?.name ?? exhibitor.name, kind: "screen", id: exhibitor.subEventId },
    });
  }

  return docs;
}

let corpus: GuideDoc[] | null = null;

export function answerQuestion(question: string): GuideAnswer {
  const queryTokens = tokens(question);
  if (queryTokens.length === 0) {
    return { text: FALLBACK, citations: [] };
  }
  corpus ??= buildCorpus();
  const ranked = corpus
    .map((doc) => ({ doc, score: scoreDoc(queryTokens, doc) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.length - b.doc.title.length);

  if (ranked.length === 0) return { text: FALLBACK, citations: [] };

  const citations: Citation[] = [];
  for (const item of ranked) {
    if (citations.some((citation) => citation.kind === item.doc.citation.kind && citation.id === item.doc.citation.id)) {
      continue;
    }
    citations.push(item.doc.citation);
    if (citations.length === 3) break;
  }

  return { text: ranked[0].doc.body, citations };
}

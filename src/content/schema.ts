import type { Panelist, ProgramData, Session, SessionVenue, Venue } from "./types";
import { bundle } from "./bundle";
import { visitorEdition } from "./labels";

export type ParseResult = { ok: true; program: ProgramData } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function venueForIsland(island: string, venues: Venue[], incoming: unknown): SessionVenue {
  const match = venues.find((venue) => venue.island === island);
  const base: SessionVenue = {
    island: island || null,
    venueId: match?.id ?? null,
    specific: null,
    label: "to be confirmed",
  };
  if (!isRecord(incoming)) return base;
  const specific = typeof incoming.specific === "string" && incoming.specific.trim() ? incoming.specific.trim() : null;
  const venueId = typeof incoming.venueId === "string" ? incoming.venueId : base.venueId;
  const label = specific ?? (typeof incoming.label === "string" && incoming.label ? incoming.label : "to be confirmed");
  return { island: typeof incoming.island === "string" ? incoming.island : base.island, venueId, specific, label };
}

function looksLikeAppSession(value: unknown): boolean {
  return isRecord(value) && Array.isArray(value.speakerIds);
}

function looksLikeSiteSession(value: unknown): boolean {
  return isRecord(value) && Array.isArray(value.speakers) && !Array.isArray(value.speakerIds);
}

export function parseContent(input: unknown, base: ProgramData = bundle): ParseResult {
  if (!isRecord(input)) return { ok: false, error: "Content is not an object" };
  const first = Array.isArray(input.sessions) ? input.sessions[0] : undefined;
  if (looksLikeSiteSession(first) || (input.presenters && input.program)) return normalizeSite(input, base);
  if (input.sessions && (input.days || input.timezone) && !input.forum) return normalizeSite(input, base);
  if (looksLikeAppSession(first) || input.forum) return normalizeApp(input, base);
  if (input.sessions || input.panelists || input.venues) return normalizeApp(input, base);
  return { ok: false, error: "Content has no sessions, panelists, venues, or forum" };
}

function normalizeApp(input: Record<string, unknown>, base: ProgramData): ParseResult {
  const program: ProgramData = { ...base, forum: { ...base.forum }, sessions: base.sessions, panelists: base.panelists, venues: base.venues };
  if (input.forum !== undefined) {
    if (!isRecord(input.forum)) return { ok: false, error: "forum is not an object" };
    program.forum = { ...base.forum, ...(input.forum as unknown as ProgramData["forum"]) };
    program.forum.edition = visitorEdition(program.forum.edition);
  }
  if (input.venues !== undefined) {
    if (!Array.isArray(input.venues)) return { ok: false, error: "venues must be a list" };
    program.venues = input.venues as Venue[];
  }
  if (input.panelists !== undefined) {
    if (!Array.isArray(input.panelists)) return { ok: false, error: "panelists must be a list" };
    program.panelists = input.panelists as Panelist[];
  }
  if (input.sessions !== undefined) {
    if (!Array.isArray(input.sessions)) return { ok: false, error: "sessions must be a list" };
    const sessions: Session[] = [];
    for (let index = 0; index < input.sessions.length; index += 1) {
      const value = input.sessions[index];
      if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
        return { ok: false, error: `sessions[${index}] needs an id and a title` };
      }
      const current = value as unknown as Session;
      sessions.push({
        ...current,
        id: value.id,
        title: value.title,
        speakerIds: Array.isArray(value.speakerIds) ? (value.speakerIds as string[]) : [],
        candidateIds: Array.isArray(value.candidateIds) ? (value.candidateIds as string[]) : [],
        roles: isRecord(value.roles) ? (value.roles as Record<string, string>) : {},
        start: typeof value.start === "string" ? value.start : null,
        end: typeof value.end === "string" ? value.end : null,
        timeLabel: typeof value.timeLabel === "string" ? value.timeLabel : null,
        venue: venueForIsland(text(value.island, current.island), program.venues, value.venue),
      });
    }
    program.sessions = sessions;
  }
  if (isRecord(input.sampleModel) && typeof input.sampleModel.src === "string") {
    program.sampleModel = { src: input.sampleModel.src, label: text(input.sampleModel.label, base.sampleModel.label) };
  }
  program.forum.edition = visitorEdition(program.forum.edition);
  return { ok: true, program };
}

function normalizeSite(input: Record<string, unknown>, base: ProgramData): ParseResult {
  const siteProgram = isRecord(input.program) ? input.program : input;
  const presenters = Array.isArray(input.presenters) ? input.presenters : Array.isArray(input.panelists) ? input.panelists : null;
  const rawSessions = input.sessions;
  if (!Array.isArray(rawSessions)) return { ok: false, error: "sessions must be a list" };

  const known = new Map(base.panelists.map((person) => [person.name, person.id]));
  const panelists: Panelist[] = presenters
    ? presenters.map((value, index) => {
        if (!isRecord(value) || typeof value.name !== "string") {
          throw new Error(`presenters[${index}] needs a name`);
        }
        const id = known.get(value.name) ?? slug(value.name);
        known.set(value.name, id);
        const photo = text(value.photo);
        return {
          id,
          name: value.name,
          displayName: typeof value.displayName === "string" ? value.displayName : null,
          company: text(value.company),
          title: text(value.role ?? value.title),
          photo: photo.split("/").pop() ?? "",
          bio: text(value.bio),
          bioSourceLabel: text(value.bioSourceLabel),
          origin: text(value.origin),
          affiliations: Array.isArray(value.affiliations) ? value.affiliations.filter((item): item is string => typeof item === "string") : [],
          keynote: value.keynote === true,
          proposedPillarId: "",
          proposedIsland: "",
        };
      })
    : base.panelists;

  let venues = base.venues;
  if (Array.isArray(input.accommodations)) {
    venues = input.accommodations.map((value, index) => {
      if (!isRecord(value) || typeof value.island !== "string") throw new Error(`accommodations[${index}] needs an island`);
      const existing = base.venues.find((venue) => venue.island === value.island);
      return {
        ...(existing ?? {
          id: slug(value.island),
          name: value.island,
          island: value.island,
          region: "",
          route: "",
          dock: "",
          photos: [],
          video: null,
          model: null,
          boat: [],
          land: [],
          notes: [],
          note: "",
        }),
        ...(value as Partial<Venue>),
        id: typeof value.id === "string" ? value.id : existing?.id ?? slug(value.island),
        island: value.island,
        name: text(value.name, value.island),
      };
    });
  }

  const nameToId = new Map(panelists.map((person) => [person.name, person.id]));
  const sessions: Session[] = [];
  for (let index = 0; index < rawSessions.length; index += 1) {
    const value = rawSessions[index];
    if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
      return { ok: false, error: `sessions[${index}] needs an id and a title` };
    }
    const names = Array.isArray(value.speakers) ? value.speakers : [];
    const speakerIds = names.map((name) => {
      if (typeof name !== "string" || !nameToId.has(name)) return "";
      return nameToId.get(name) ?? "";
    });
    if (speakerIds.some((id) => !id)) return { ok: false, error: `sessions[${index}] names a panelist who is not on the roster` };
    const roles: Record<string, string> = {};
    if (isRecord(value.roles)) {
      for (const [name, role] of Object.entries(value.roles)) {
        const id = nameToId.get(name);
        if (id && typeof role === "string") roles[id] = role;
      }
    }
    const island = text(value.island);
    const date = text(value.date ?? value.dayId);
    const start = typeof value.start === "string" && value.start.includes("T") ? value.start : typeof value.start === "string" && date ? `${date}T${value.start}:00-04:00` : null;
    const end = typeof value.end === "string" && value.end.includes("T") ? value.end : typeof value.end === "string" && date ? `${date}T${value.end}:00-04:00` : null;
    const pillarName = text(value.track ?? value.pillarId);
    const pillar = base.forum.pillars.find((item) => item.name === pillarName || item.id === pillarName);
    sessions.push({
      id: value.id,
      title: value.title,
      description: text(value.description),
      outcome: text(value.outcome),
      dayId: date,
      start: value.start ? start : null,
      end: value.end ? end : null,
      timeLabel: typeof value.timeLabel === "string" ? value.timeLabel : null,
      supplemental: value.supplemental === true,
      optional: value.optional === true,
      pillarId: pillar?.id ?? pillarName,
      island,
      region: pillar?.region ?? "",
      phase: text(value.phase),
      format: text(value.format),
      featured: value.featured === true,
      featureRole: typeof value.featureRole === "string" ? value.featureRole : null,
      speakerIds,
      candidateIds: [],
      roles,
      specialists: text(value.specialists),
      status: text(value.status),
      sourceNote: typeof value.sourceNote === "string" ? value.sourceNote : null,
      venue: venueForIsland(island, venues, value.venue),
      sourcePage: typeof value.sourcePage === "number" ? value.sourcePage : null,
      sourceUrl: text(value.sourceUrl),
      workstream: text(value.workstream),
    });
  }

  const forum = { ...base.forum, edition: visitorEdition(base.forum.edition) };
  if (typeof siteProgram.timezone === "string") forum.timezoneLabel = siteProgram.timezone;
  if (typeof siteProgram.timingNote === "string") forum.timingNote = siteProgram.timingNote;
  if (Array.isArray(siteProgram.weekAgenda)) forum.weekAgenda = siteProgram.weekAgenda as ProgramData["forum"]["weekAgenda"];
  if (Array.isArray(siteProgram.days)) {
    forum.days = (siteProgram.days as { date: string; label: string; phase: string }[]).map((day) => ({
      id: day.date,
      date: day.date,
      label: day.label,
      phase: day.phase,
      weekday: base.forum.days.find((item) => item.date === day.date)?.weekday ?? "",
      shortWeekday: base.forum.days.find((item) => item.date === day.date)?.shortWeekday ?? "",
      dayNumber: day.date.slice(-2),
    }));
  }

  return {
    ok: true,
    program: {
      ...base,
      forum,
      panelists,
      sessions,
      venues,
      generatedFrom: text(input.generatedFrom, "remote /tatel/downloads/tatel-2027-program.json"),
    },
  };
}

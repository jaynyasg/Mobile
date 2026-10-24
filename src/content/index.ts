/**
 * Public program for Portico Assembly.
 * Plain TypeScript: no React and no React Native. A website can import this module
 * the same way the mobile app does.
 */
import { attendees } from "./people";
import { exhibitors, sponsors, subEvents } from "./partners";
import { polls, sessions, speakers } from "./program";
import type { Attendee, Poll, Room, Session, Speaker, Sponsor, SubEvent, Track } from "./types";

export { forum } from "./forum";
export { speakers, sessions, polls } from "./program";
export { attendees, meetingSlots } from "./people";
export { sponsors, subEvents, exhibitors, notifications } from "./partners";
export type * from "./types";

import { forum } from "./forum";

export const formatLabel: Record<Session["format"], string> = {
  keynote: "Keynote",
  talk: "Talk",
  panel: "Panel",
  workshop: "Workshop",
  conversation: "Conversation",
  social: "Gathering",
  gathering: "Side program",
};

export const tierLabel: Record<Sponsor["tier"], string> = {
  host: "Host",
  patron: "Patron",
  partner: "Partner",
};

export function speakerById(id: string): Speaker | undefined {
  return speakers.find((speaker) => speaker.id === id);
}

export function sessionById(id: string): Session | undefined {
  return sessions.find((session) => session.id === id);
}

export function roomById(id: string): Room | undefined {
  return forum.venue.rooms.find((room) => room.id === id);
}

export function trackById(id: string): Track | undefined {
  return forum.tracks.find((track) => track.id === id);
}

export function sponsorById(id: string): Sponsor | undefined {
  return sponsors.find((sponsor) => sponsor.id === id);
}

export function attendeeById(id: string): Attendee | undefined {
  return attendees.find((attendee) => attendee.id === id);
}

export function subEventById(id: string): SubEvent | undefined {
  return subEvents.find((subEvent) => subEvent.id === id);
}

export function pollForSession(sessionId: string): Poll | undefined {
  return polls.find((poll) => poll.sessionId === sessionId);
}

export function sessionsForSpeaker(speakerId: string): Session[] {
  return sessions.filter((session) => session.speakerIds.includes(speakerId));
}

export function exhibitorsFor(subEventId: SubEvent["id"]) {
  return exhibitors.filter((exhibitor) => exhibitor.subEventId === subEventId);
}

export function speakerNames(session: Session): string {
  return session.speakerIds
    .map((id) => speakerById(id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

export function allDeals(): { sponsor: Sponsor; deal: Sponsor["deals"][number] }[] {
  return sponsors.flatMap((sponsor) => sponsor.deals.map((deal) => ({ sponsor, deal })));
}

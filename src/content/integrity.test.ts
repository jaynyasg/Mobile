import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  attendees,
  exhibitors,
  forum,
  meetingSlots,
  notifications,
  polls,
  sessions,
  speakers,
  sponsors,
  subEvents,
} from "./index";
import { evaluateMeeting } from "../logic/meetings";

function unique(ids: string[]) {
  expect(new Set(ids).size).toBe(ids.length);
}

describe("shared program", () => {
  it("keeps every reference inside the program", () => {
    unique(sessions.map((session) => session.id));
    unique(speakers.map((speaker) => speaker.id));
    unique(attendees.map((attendee) => attendee.id));
    unique(sponsors.map((sponsor) => sponsor.id));
    unique(sponsors.flatMap((sponsor) => sponsor.deals.map((deal) => deal.id)));
    unique(exhibitors.map((exhibitor) => exhibitor.id));
    unique(notifications.map((note) => note.id));
    unique(polls.map((poll) => poll.id));
    unique(meetingSlots.map((slot) => slot.id));

    const speakerIds = new Set(speakers.map((speaker) => speaker.id));
    const roomIds = new Set(forum.venue.rooms.map((room) => room.id));
    const dayIds = new Set(forum.days.map((day) => day.id));
    const sessionIds = new Set(sessions.map((session) => session.id));
    const subEventIds = new Set(subEvents.map((subEvent) => subEvent.id));

    for (const session of sessions) {
      expect(dayIds.has(session.dayId)).toBe(true);
      expect(roomIds.has(session.roomId)).toBe(true);
      expect(session.capacity).toBeGreaterThan(0);
      expect(session.seatsHeld).toBeLessThanOrEqual(session.capacity);
      for (const speakerId of session.speakerIds) expect(speakerIds.has(speakerId)).toBe(true);
      if (session.format === "social" || session.format === "gathering") expect(session.reservable).toBe(false);
      if (session.isKeynote) expect(session.reservable).toBe(true);
    }

    for (const poll of polls) expect(sessionIds.has(poll.sessionId)).toBe(true);
    for (const exhibitor of exhibitors) expect(subEventIds.has(exhibitor.subEventId)).toBe(true);

    expect(sessions.some((session) => session.seatsHeld === session.capacity && session.reservable)).toBe(true);
    expect(sessions.filter((session) => session.isKeynote).length).toBeGreaterThanOrEqual(3);
    expect(attendees.filter((attendee) => !attendee.networkingOptIn).length).toBeGreaterThanOrEqual(2);
    expect(exhibitors.filter((exhibitor) => exhibitor.subEventId === "studio-walk").length).toBeGreaterThanOrEqual(8);
    expect(exhibitors.filter((exhibitor) => exhibitor.subEventId === "talent-market").length).toBeGreaterThanOrEqual(6);

    const decisions = meetingSlots.map((slot) => evaluateMeeting(slot, sessions));
    expect(decisions.some((decision) => decision.ok)).toBe(true);
    expect(decisions.some((decision) => !decision.ok)).toBe(true);
  });

  it("does not import React or React Native", () => {
    const directory = path.dirname(fileURLToPath(import.meta.url));
    const sources = readdirSync(directory).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
    for (const file of sources) {
      const source = readFileSync(path.join(directory, file), "utf8");
      expect(source).not.toMatch(/from ["']react/);
      expect(source).not.toMatch(/react-native/);
    }
  });
});

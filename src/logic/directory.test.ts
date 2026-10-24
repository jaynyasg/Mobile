import { describe, expect, it } from "vitest";
import { attendees } from "../content";
import { visibleAttendees } from "./directory";

describe("opt-in directory", () => {
  it("hides people who did not opt in", () => {
    const visible = visibleAttendees(attendees, "");
    expect(visible.some((person) => person.id === "patrick-nguyen")).toBe(false);
    expect(visible.some((person) => person.id === "dana-frost")).toBe(false);
    expect(visible.some((person) => person.id === "samira-qureshi")).toBe(true);
    expect(visible.length).toBe(attendees.filter((person) => person.networkingOptIn).length);
  });

  it("searches the opted-in list", () => {
    const found = visibleAttendees(attendees, "brine");
    expect(found.map((person) => person.id)).toEqual(["malik-johnson"]);
  });
});
